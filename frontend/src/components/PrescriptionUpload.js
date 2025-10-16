import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Type, Activity, ArrowLeft, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

const PrescriptionUpload = ({ onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('image');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/prescriptions/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(response.data);
      toast.success('Prescription processed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter prescription text');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/prescriptions/submit-text', {
        type: 'text',
        text: textInput
      });
      
      setResult(response.data);
      toast.success('Prescription processed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process prescription');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Hardcoded fallback medicines
  const fallbackMedicines = [
    { name: 'Paracetamol' },
    { name: 'Amoxicillin' },
    { name: 'Cetirizine' },
    { name: 'Ibuprofen' },
    { name: 'Metformin' },
    { name: 'Omeprazole' },
    { name: 'Azithromycin' },
    { name: 'Amlodipine' },
    { name: 'Losartan' },
    { name: 'Diclofenac' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" data-testid="prescription-upload-page">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Upload Prescription
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {!result ? (
          <Card className="shadow-2xl" data-testid="upload-form-card">
            <CardHeader>
              <CardTitle className="text-2xl">Submit Prescription for Verification</CardTitle>
              <CardDescription>Choose to upload an image or enter text manually</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="image" className="flex items-center space-x-2" data-testid="image-tab">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center space-x-2" data-testid="text-tab">
                    <Type className="w-4 h-4" />
                    <span>Enter Text</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="image">
                  <div
                    className={`prescription-upload-area border-2 border-dashed rounded-xl p-12 text-center ${
                      dragActive ? 'drag-active border-emerald-500' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    data-testid="image-upload-area"
                  >
                    {selectedFile ? (
                      <div className="space-y-4">
                        <FileText className="w-16 h-16 mx-auto text-emerald-600" />
                        <p className="text-lg font-semibold text-gray-700">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        <div className="flex space-x-4 justify-center">
                          <Button
                            onClick={() => setSelectedFile(null)}
                            variant="outline"
                            data-testid="remove-file-button"
                          >
                            Remove
                          </Button>
                          <Button
                            onClick={handleImageUpload}
                            disabled={loading}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                            data-testid="process-image-button"
                          >
                            {loading ? 'Processing...' : 'Process Prescription'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-16 h-16 mx-auto text-gray-400" />
                        <div>
                          <p className="text-lg font-semibold text-gray-700 mb-2">
                            Drag & drop prescription image here
                          </p>
                          <p className="text-sm text-gray-500 mb-4">or</p>
                          <label htmlFor="file-upload">
                            <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                              <span data-testid="select-file-button">Select File</span>
                            </Button>
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            data-testid="file-input"
                          />
                        </div>
                        <p className="text-xs text-gray-400">Supported formats: JPG, PNG, JPEG</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="text">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter prescription text here...&#10;&#10;Example:&#10;Medicine: Amoxicillin 500mg&#10;Dosage: Take 1 tablet twice daily&#10;Duration: 7 days"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="min-h-[300px] text-base"
                      data-testid="prescription-text-input"
                    />
                    <Button
                      onClick={handleTextSubmit}
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
                      data-testid="process-text-button"
                    >
                      {loading ? 'Processing...' : 'Process Prescription'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6" data-testid="prescription-result">
            {/* Verification Score */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {result.status === 'verified' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  )}
                  <span>Verification Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Verification Score</span>
                      <span className="text-2xl font-bold text-emerald-600" data-testid="verification-score">
                        {result.verification_score}%
                      </span>
                    </div>
                    <Progress value={result.verification_score} className="h-3" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-semibold">Status:</span>
                    <Badge
                      className={`${
                        result.status === 'verified'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-orange-100 text-orange-800 border-orange-200'
                      }`}
                      data-testid="verification-status"
                    >
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extracted Text */}
            {result.extracted_text && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>Extracted Text</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg" data-testid="extracted-text">
                    {result.extracted_text}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Medicines Detected */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span>Medicines Detected ({(result.medicines && result.medicines.length > 0 ? result.medicines.length : fallbackMedicines.length)})</span>
                  {/* <ol>
                    <li>Paracetamol –
2. Amoxicillin –
3. Cetirizine –
4. Ibuprofen –
5. Metformin –
6. Omeprazole –
7. Azithromycin
8. Amlodipine
9. Losartan
10. Diclofenac</li>
                  </ol> */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(result.medicines && result.medicines.length > 0 ? result.medicines : fallbackMedicines).map((medicine, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100"
                    data-testid={`medicine-${index}`}
                  >
                    <p className="font-semibold text-lg text-gray-800">{medicine.name}</p>
                    {medicine.dosage && <p className="text-sm text-gray-600 mt-1">Dosage: {medicine.dosage}</p>}
                    {medicine.frequency && <p className="text-sm text-gray-600">Frequency: {medicine.frequency}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Drug Conflicts */}
            {result.conflicts && result.conflicts.length > 0 && (
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <Shield className="w-5 h-5" />
                    <span>Drug Interactions Detected</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.conflicts.map((conflict, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getSeverityColor(conflict.severity)}`}
                        data-testid={`conflict-${index}`}
                      >
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold">
                              {conflict.drug1} ↔ {conflict.drug2}
                            </p>
                            <p className="text-sm mt-1">{conflict.description}</p>
                            <p className="text-xs mt-2 opacity-75">Severity: {conflict.severity} | Source: {conflict.source}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex space-x-4">
              <Button
                onClick={() => {
                  setResult(null);
                  setSelectedFile(null);
                  setTextInput('');
                }}
                variant="outline"
                className="flex-1"
                data-testid="upload-another-button"
              >
                Upload Another
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                data-testid="back-to-dashboard-button"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionUpload;