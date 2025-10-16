# Medication App

A full-stack web application for patients to upload prescriptions, extract medicines, manage their medicine stock, receive alerts, and navigate to the nearest clinics. Built for the Omniverse Hackathon.

---

## Features

- **Prescription Upload:** Patients can upload prescription images or enter prescription text. The app extracts medicines from the prescription.
- **Medicine Extraction:** Automatically detects and lists medicines from uploaded prescriptions.
- **Medicine Stock Management:** Add, update, and manage your personal medicine inventory.
- **Alerts & Reminders:** Get notified when your medicine stock is low or when it's time to take your medication.
- **Nearby Clinics:** Find and navigate to the nearest clinics or pharmacies.
- **User Dashboard:** Simple dashboard for managing all features.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Axios
- **Backend:** FastAPI (Python 3.11)
- **OCR & LLM:** (Demo mode) Hardcoded medicine extraction for privacy and demo purposes
- **Database:** MongoDB (for user and medicine data)

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Singh-Aman-Hub/Omniverse_hackathon.git
cd Omniverse_hackathon
```

### 2. Backend Setup
- Go to the backend directory:
	```bash
	cd backend
	```
- Create a Python virtual environment and activate it:
	```bash
	python3.11 -m venv venv
	source venv/bin/activate
	```
- Install dependencies:
	```bash
	pip install -r requirements.txt
	```
- (Optional) Set up your `.env` file for environment variables (see `.env.example` if provided).
- Start the backend server:
	```bash
	uvicorn server:app --reload
	```

### 3. Frontend Setup
- Open a new terminal and go to the frontend directory:
	```bash
	cd ../frontend
	```
- Install dependencies:
	```bash
	npm install
	```
- Start the frontend development server:
	```bash
	npm start
	```

### 4. Usage
- Open your browser and go to `http://localhost:3000`.
- Register or log in.
- Upload a prescription image or enter prescription text.
- View extracted medicines, manage your medicine stock, and receive alerts.
- Use the navigation feature to find nearby clinics.

---

## Project Structure

```
Omniverse_hackathon/
├── backend/
│   ├── requirements.txt
│   ├── server.py
│   └── ...
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
├── tests/
├── README.md
└── .gitignore
```

---

## Notes
- This demo version uses hardcoded medicine extraction for privacy and simplicity. In production, integrate a real OCR/LLM service.
- All sensitive files (node_modules, .env, venv, etc.) are excluded from git.

---

## License
MIT

---

## Authors
- Aman Singh (Singh-Aman-Hub)
- Omniverse Hackathon Team
# Here are your Instructions
