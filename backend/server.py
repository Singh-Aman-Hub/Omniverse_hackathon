from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import base64
import io
import google.generativeai as genai
import requests
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'mediassist_db')]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'mediassist_secret_key_2025')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Local drug interaction database (fallback)
DRUG_INTERACTIONS = {
    "aspirin": ["warfarin", "ibuprofen", "naproxen"],
    "warfarin": ["aspirin", "ibuprofen", "vitamin k"],
    "metformin": ["alcohol", "iodinated contrast"],
    "lisinopril": ["potassium supplements", "nsaids"],
    "atorvastatin": ["grapefruit juice", "cyclosporine"],
    "omeprazole": ["clopidogrel", "methotrexate"],
    "levothyroxine": ["calcium", "iron supplements"],
    "amlodipine": ["grapefruit juice", "simvastatin"],
    "metoprolol": ["verapamil", "diltiazem"],
    "losartan": ["potassium supplements", "nsaids"]
}

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Prescription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # "image" or "text"
    original_text: Optional[str] = None
    extracted_text: Optional[str] = None
    image_base64: Optional[str] = None
    medicines: List[dict] = []
    conflicts: List[dict] = []
    verification_score: float = 0.0
    status: str = "pending"  # pending, verified, flagged
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PrescriptionCreate(BaseModel):
    type: str
    text: Optional[str] = None

class Medicine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    dosage: str
    quantity: int
    daily_usage: int = 1
    expiry_date: str
    prescription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MedicineCreate(BaseModel):
    name: str
    dosage: str
    quantity: int
    daily_usage: int = 1
    expiry_date: str
    prescription_id: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # "expiry", "stock", "conflict", "reminder"
    severity: str  # "low", "medium", "high"
    title: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def extract_text_from_image(image_base64: str) -> dict:
    """Extract text from prescription image using OpenAI Vision"""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro-vision')
        prompt = "Extract all text from this prescription image. Format your response as JSON: { 'extracted_text': 'complete text from image', 'medicines': [{'name': 'medicine name', 'dosage': 'dosage info', 'frequency': 'frequency'}], 'legibility_score': 0.0-1.0, 'warnings': ['any concerns'] }"
        response = model.generate_content([prompt, image_base64])
        try:
            result = json.loads(response.text)
        except Exception:
            result = {
                "extracted_text": response.text,
                "medicines": [],
                "legibility_score": 0.7,
                "warnings": []
            }
        return result
    except Exception as e:
        logging.error(f"OCR error: {str(e)}")
        return {
            "extracted_text": "Error processing image",
            "medicines": [],
            "legibility_score": 0.0,
            "warnings": [f"OCR failed: {str(e)}"]
        }

async def check_drug_conflicts(medicines: List[str]) -> List[dict]:
    """Check for drug interactions using FDA API with local fallback"""
    conflicts = []
    
    # Normalize medicine names
    normalized_meds = [med.lower().strip() for med in medicines]
    
    # Check local database first
    for i, med1 in enumerate(normalized_meds):
        for med2 in normalized_meds[i+1:]:
            # Check if either drug has known interactions
            if med1 in DRUG_INTERACTIONS and med2 in DRUG_INTERACTIONS[med1]:
                conflicts.append({
                    "drug1": med1,
                    "drug2": med2,
                    "severity": "high",
                    "description": f"Known interaction between {med1} and {med2}",
                    "source": "local_db"
                })
            elif med2 in DRUG_INTERACTIONS and med1 in DRUG_INTERACTIONS[med2]:
                conflicts.append({
                    "drug1": med2,
                    "drug2": med1,
                    "severity": "high",
                    "description": f"Known interaction between {med2} and {med1}",
                    "source": "local_db"
                })
    
    # Try FDA API for additional checks
    try:
        for med in medicines[:3]:  # Limit to 3 to avoid rate limits
            response = requests.get(
                f"https://api.fda.gov/drug/label.json",
                params={"search": f"openfda.brand_name:{med}", "limit": 1},
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('results'):
                    result = data['results'][0]
                    if 'drug_interactions' in result:
                        conflicts.append({
                            "drug1": med,
                            "drug2": "multiple",
                            "severity": "medium",
                            "description": result['drug_interactions'][0][:200] if result['drug_interactions'] else "",
                            "source": "fda_api"
                        })
    except Exception as e:
        logging.warning(f"FDA API error: {str(e)}")
    
    return conflicts

async def calculate_verification_score(medicines: List[dict], conflicts: List[dict], legibility_score: float) -> float:
    """Calculate prescription verification score"""
    base_score = legibility_score * 100
    
    # Deduct points for conflicts
    conflict_penalty = len(conflicts) * 15
    
    # Deduct if no medicines found
    if len(medicines) == 0:
        base_score -= 30
    
    score = max(0, min(100, base_score - conflict_penalty))
    return round(score, 2)

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_pw = hash_password(user_data.password)
    user = User(email=user_data.email, full_name=user_data.full_name)
    user_dict = user.model_dump()
    user_dict['password'] = hashed_pw
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"sub": user.id})
    return {"token": token, "user": {"id": user.id, "email": user.email, "full_name": user.full_name}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user['id']})
    return {"token": token, "user": {"id": user['id'], "email": user['email'], "full_name": user['full_name']}}

# Prescription endpoints
@api_router.post("/prescriptions/upload-image")
async def upload_prescription_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    # Read and encode image
    contents = await file.read()
    image_base64 = base64.b64encode(contents).decode('utf-8')
    
    # Extract text using OCR (Gemini Vision)
    ocr_result = await extract_text_from_image(image_base64)
    extracted_text = ocr_result.get('extracted_text', '')

    # Use Gemini Flash 2.5 to extract medicines from the extracted text
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""Extract all medicines from the following prescription text. Format your response as JSON: {{'medicines': [{{'name': 'medicine name', 'dosage': 'dosage', 'frequency': 'frequency'}}]}}
        Prescription: {extracted_text}"""
        response = model.generate_content(prompt)
        try:
            parsed = json.loads(response.text)
            medicines = parsed.get('medicines', [])
        except Exception:
            medicines = []
    except Exception as e:
        logging.error(f"Gemini Flash extraction error: {str(e)}")
        medicines = []

    # Extract medicine names for conflict check
    medicine_names = [med['name'] for med in medicines]

    # Check conflicts
    conflicts = await check_drug_conflicts(medicine_names)

    # Calculate score
    score = await calculate_verification_score(
        medicines,
        conflicts,
        ocr_result.get('legibility_score', 0.7)
    )

    # Create prescription record
    prescription = Prescription(
        user_id=user_id,
        type="image",
        extracted_text=extracted_text,
        image_base64=image_base64,
        medicines=medicines,
        conflicts=conflicts,
        verification_score=score,
        status="verified" if score >= 70 and len(conflicts) == 0 else "flagged"
    )

    prescription_dict = prescription.model_dump()
    prescription_dict['created_at'] = prescription_dict['created_at'].isoformat()
    
    await db.prescriptions.insert_one(prescription_dict)

    # Create alerts for conflicts
    for conflict in conflicts:
        alert = Alert(
            user_id=user_id,
            type="conflict",
            severity="high",
            title="Drug Interaction Detected",
            message=conflict['description']
        )
        alert_dict = alert.model_dump()
        alert_dict['created_at'] = alert_dict['created_at'].isoformat()
        await db.alerts.insert_one(alert_dict)

    # Return the full prescription object for frontend compatibility
    return prescription_dict

@api_router.post("/prescriptions/submit-text")
async def submit_prescription_text(
    prescription_data: PrescriptionCreate,
    user_id: str = Depends(get_current_user)
):
    # Use Gemini to parse text and extract medicines
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"Parse this prescription text and extract medicines. Format as JSON: {{'medicines': [{{'name': 'medicine name', 'dosage': 'dosage', 'frequency': 'frequency'}}]}} Prescription: {prescription_data.text}"
        response = model.generate_content(prompt)
        try:
            parsed = json.loads(response.text)
        except Exception:
            parsed = {"medicines": []}
        
        medicine_names = [med['name'] for med in parsed.get('medicines', [])]
        conflicts = await check_drug_conflicts(medicine_names)
        score = await calculate_verification_score(parsed.get('medicines', []), conflicts, 1.0)
        
        prescription = Prescription(
            user_id=user_id,
            type="text",
            original_text=prescription_data.text,
            extracted_text=prescription_data.text,
            medicines=parsed.get('medicines', []),
            conflicts=conflicts,
            verification_score=score,
            status="verified" if score >= 70 and len(conflicts) == 0 else "flagged"
        )
        
        prescription_dict = prescription.model_dump()
        prescription_dict['created_at'] = prescription_dict['created_at'].isoformat()
        
        await db.prescriptions.insert_one(prescription_dict)
        
        return prescription
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/prescriptions", response_model=List[Prescription])
async def get_prescriptions(user_id: str = Depends(get_current_user)):
    prescriptions = await db.prescriptions.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for p in prescriptions:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return prescriptions

@api_router.get("/prescriptions/{prescription_id}")
async def get_prescription(prescription_id: str, user_id: str = Depends(get_current_user)):
    prescription = await db.prescriptions.find_one({"id": prescription_id, "user_id": user_id}, {"_id": 0})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if isinstance(prescription['created_at'], str):
        prescription['created_at'] = datetime.fromisoformat(prescription['created_at'])
    return prescription

# Medicine stock endpoints
@api_router.post("/medicines")
async def add_medicine(medicine_data: MedicineCreate, user_id: str = Depends(get_current_user)):
    medicine = Medicine(user_id=user_id, **medicine_data.model_dump())
    medicine_dict = medicine.model_dump()
    medicine_dict['created_at'] = medicine_dict['created_at'].isoformat()
    
    await db.medicines.insert_one(medicine_dict)
    
    # Check for expiry alert
    from datetime import date
    expiry_date = datetime.strptime(medicine.expiry_date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    days_until_expiry = (expiry_date - datetime.now(timezone.utc)).days
    
    if days_until_expiry <= 30:
        alert = Alert(
            user_id=user_id,
            type="expiry",
            severity="medium" if days_until_expiry <= 30 else "low",
            title="Medicine Expiring Soon",
            message=f"{medicine.name} expires in {days_until_expiry} days"
        )
        alert_dict = alert.model_dump()
        alert_dict['created_at'] = alert_dict['created_at'].isoformat()
        await db.alerts.insert_one(alert_dict)
    
    # Check stock level
    if medicine.quantity <= 5:
        alert = Alert(
            user_id=user_id,
            type="stock",
            severity="high" if medicine.quantity <= 2 else "medium",
            title="Low Stock Alert",
            message=f"Only {medicine.quantity} units of {medicine.name} remaining"
        )
        alert_dict = alert.model_dump()
        alert_dict['created_at'] = alert_dict['created_at'].isoformat()
        await db.alerts.insert_one(alert_dict)
    
    return medicine

@api_router.get("/medicines", response_model=List[Medicine])
async def get_medicines(user_id: str = Depends(get_current_user)):
    medicines = await db.medicines.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    for m in medicines:
        if isinstance(m['created_at'], str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return medicines

@api_router.put("/medicines/{medicine_id}")
async def update_medicine(
    medicine_id: str,
    updates: dict,
    user_id: str = Depends(get_current_user)
):
    result = await db.medicines.update_one(
        {"id": medicine_id, "user_id": user_id},
        {"$set": updates}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return {"message": "Updated successfully"}

@api_router.delete("/medicines/{medicine_id}")
async def delete_medicine(medicine_id: str, user_id: str = Depends(get_current_user)):
    result = await db.medicines.delete_one({"id": medicine_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return {"message": "Deleted successfully"}

# Chat assistant endpoints
@api_router.post("/chat")
async def chat_with_ai(chat_request: ChatRequest, user_id: str = Depends(get_current_user)):
    session_id = chat_request.session_id or str(uuid.uuid4())
    
    # Get chat history
    history = await db.chat_messages.find(
        {"user_id": user_id, "session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(50)
    
    # Save user message
    user_msg = ChatMessage(
        user_id=user_id,
        session_id=session_id,
        role="user",
        content=chat_request.message
    )
    user_msg_dict = user_msg.model_dump()
    user_msg_dict['timestamp'] = user_msg_dict['timestamp'].isoformat()
    await db.chat_messages.insert_one(user_msg_dict)
    
    try:
        # Get user's medicines for context
        medicines = await db.medicines.find({"user_id": user_id}, {"_id": 0, "name": 1, "dosage": 1}).to_list(100)
        medicine_list = ", ".join([f"{m['name']} ({m['dosage']})" for m in medicines[:5]])

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""You are MediAssist, a helpful AI health assistant. You help patients with symptom analysis, medication information, and general health guidance.\nUser's current medications: {medicine_list or 'None'}\nImportant:\n- Provide helpful information but always recommend consulting a doctor for serious symptoms\n- Be empathetic and clear\n- If asked about drug interactions, check their medication list\n- Never provide emergency medical advice - always recommend calling emergency services for urgent issues\n\nUser: {chat_request.message}"""
        response = model.generate_content(prompt)
        response_text = response.text if hasattr(response, 'text') else str(response)

        # Save assistant message
        assistant_msg = ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=response_text
        )
        assistant_msg_dict = assistant_msg.model_dump()
        assistant_msg_dict['timestamp'] = assistant_msg_dict['timestamp'].isoformat()
        await db.chat_messages.insert_one(assistant_msg_dict)

        return {"response": response_text, "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, user_id: str = Depends(get_current_user)):
    messages = await db.chat_messages.find(
        {"user_id": user_id, "session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    
    for msg in messages:
        if isinstance(msg['timestamp'], str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    return messages

@api_router.get("/chat/sessions")
async def get_chat_sessions(user_id: str = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$first": "$content"},
            "last_timestamp": {"$first": "$timestamp"}
        }}
    ]
    sessions = await db.chat_messages.aggregate(pipeline).to_list(100)
    return [{"session_id": s['_id'], "last_message": s['last_message'][:50], "last_timestamp": s['last_timestamp']} for s in sessions]

# Alerts endpoints
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(user_id: str = Depends(get_current_user)):
    alerts = await db.alerts.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for a in alerts:
        if isinstance(a['created_at'], str):
            a['created_at'] = datetime.fromisoformat(a['created_at'])
    return alerts

@api_router.put("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str, user_id: str = Depends(get_current_user)):
    result = await db.alerts.update_one(
        {"id": alert_id, "user_id": user_id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as read"}

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    prescriptions_count = await db.prescriptions.count_documents({"user_id": user_id})
    medicines_count = await db.medicines.count_documents({"user_id": user_id})
    alerts_count = await db.alerts.count_documents({"user_id": user_id, "is_read": False})
    
    # Get medicines expiring soon
    medicines = await db.medicines.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    expiring_soon = 0
    low_stock = 0
    
    for med in medicines:
        if med.get('quantity', 0) <= 5:
            low_stock += 1
        try:
            expiry = datetime.fromisoformat(med['expiry_date'])
            if (expiry - datetime.now(timezone.utc)).days <= 30:
                expiring_soon += 1
        except:
            pass
    
    return {
        "total_prescriptions": prescriptions_count,
        "total_medicines": medicines_count,
        "unread_alerts": alerts_count,
        "expiring_soon": expiring_soon,
        "low_stock": low_stock
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()