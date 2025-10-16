import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Activity, ArrowLeft, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

const MedicineStock = ({ onLogout }) => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    quantity: '',
    daily_usage: '1',
    expiry_date: ''
  });

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const response = await axios.get('/medicines');
      setMedicines(response.data);
    } catch (error) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/medicines', {
        ...formData,
        quantity: parseInt(formData.quantity),
        daily_usage: parseInt(formData.daily_usage)
      });
      toast.success('Medicine added successfully!');
      setShowAddDialog(false);
      setFormData({ name: '', dosage: '', quantity: '', daily_usage: '1', expiry_date: '' });
      loadMedicines();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add medicine');
    }
  };

  const handleDelete = async (medicineId) => {
    try {
      await axios.delete(`/medicines/${medicineId}`);
      toast.success('Medicine deleted');
      loadMedicines();
    } catch (error) {
      toast.error('Failed to delete medicine');
    }
  };

  const handleUpdateQuantity = async (medicineId, newQuantity) => {
    try {
      await axios.put(`/medicines/${medicineId}`, { quantity: parseInt(newQuantity) });
      toast.success('Quantity updated');
      loadMedicines();
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadge = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) {
      return <Badge className="bg-red-600 text-white">Expired</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-red-500 text-white">Expires in {days}d</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-orange-500 text-white">Expires in {days}d</Badge>;
    } else {
      return <Badge className="bg-green-500 text-white">Valid</Badge>;
    }
  };

  const getStockBadge = (quantity) => {
    if (quantity === 0) {
      return <Badge className="bg-red-600 text-white">Out of Stock</Badge>;
    } else if (quantity <= 2) {
      return <Badge className="bg-red-500 text-white">Critical</Badge>;
    } else if (quantity <= 5) {
      return <Badge className="bg-orange-500 text-white">Low</Badge>;
    } else {
      return <Badge className="bg-green-500 text-white">In Stock</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-2xl font-semibold text-emerald-600">Loading medicines...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" data-testid="medicine-stock-page">
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
              Medicine Stock Manager
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Your Medicines</h2>
            <p className="text-gray-600">{medicines.length} medicine(s) in inventory</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                data-testid="add-medicine-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-medicine-dialog" className="bg-white">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
                <DialogDescription>Enter medicine details to add to your inventory</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMedicine} className="space-y-4">
                <Input
                  placeholder="Medicine Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="medicine-name-input"
                />
                <Input
                  placeholder="Dosage (e.g., 500mg)"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  required
                  data-testid="medicine-dosage-input"
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  min="0"
                  data-testid="medicine-quantity-input"
                />
                <Input
                  type="number"
                  placeholder="Daily Usage"
                  value={formData.daily_usage}
                  onChange={(e) => setFormData({ ...formData, daily_usage: e.target.value })}
                  required
                  min="1"
                  data-testid="medicine-daily-usage-input"
                />
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Expiry Date</label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                    data-testid="medicine-expiry-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  data-testid="submit-medicine-button"
                >
                  Add Medicine
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {medicines.length === 0 ? (
          <Card className="shadow-xl">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-500 mb-2">No medicines in inventory</p>
              <p className="text-sm text-gray-400">Add your first medicine to start tracking</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {medicines.map((medicine) => (
              <Card key={medicine.id} className="medicine-card shadow-lg" data-testid={`medicine-card-${medicine.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{medicine.name}</CardTitle>
                      <CardDescription className="text-base">{medicine.dosage}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(medicine.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-medicine-${medicine.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold">Quantity:</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-emerald-600" data-testid={`quantity-${medicine.id}`}>
                          {medicine.quantity}
                        </span>
                        {getStockBadge(medicine.quantity)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        <span className="font-semibold">Expiry:</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{new Date(medicine.expiry_date).toLocaleDateString()}</span>
                        {getExpiryBadge(medicine.expiry_date)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-semibold">Daily Usage:</span>
                      <span className="text-sm">{medicine.daily_usage} per day</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-semibold">Days Remaining:</span>
                      <span className="text-sm font-bold text-blue-600">
                        {Math.floor(medicine.quantity / medicine.daily_usage)} days
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(medicine.id, medicine.quantity - 1)}
                        disabled={medicine.quantity === 0}
                        className="flex-1"
                        data-testid={`decrease-quantity-${medicine.id}`}
                      >
                        -1
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(medicine.id, medicine.quantity + 1)}
                        className="flex-1"
                        data-testid={`increase-quantity-${medicine.id}`}
                      >
                        +1
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateQuantity(medicine.id, medicine.quantity + 10)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        data-testid={`refill-${medicine.id}`}
                      >
                        Refill +10
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineStock;