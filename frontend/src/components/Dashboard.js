import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, Package, MessageSquare, Bell, LogOut, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, prescriptionsRes, alertsRes] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/prescriptions'),
        axios.get('/alerts')
      ]);

      setStats(statsRes.data);
      setRecentPrescriptions(prescriptionsRes.data.slice(0, 3));
      setRecentAlerts(alertsRes.data.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-2xl font-semibold text-emerald-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" data-testid="dashboard-page">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              MediAssist AI
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex items-center space-x-2"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back!</h2>
          <p className="text-gray-600">Here's your health overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card border-2 border-emerald-100 hover:border-emerald-300" data-testid="stat-prescriptions">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Prescriptions</CardDescription>
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats?.total_prescriptions || 0}</div>
            </CardContent>
          </Card>

          <Card className="stat-card border-2 border-teal-100 hover:border-teal-300" data-testid="stat-medicines">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Active Medicines</CardDescription>
                <Package className="w-5 h-5 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{stats?.total_medicines || 0}</div>
            </CardContent>
          </Card>

          <Card className="stat-card border-2 border-orange-100 hover:border-orange-300" data-testid="stat-alerts">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Unread Alerts</CardDescription>
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.unread_alerts || 0}</div>
            </CardContent>
          </Card>

          <Card className="stat-card border-2 border-red-100 hover:border-red-300" data-testid="stat-expiring">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Expiring Soon</CardDescription>
                <Clock className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.expiring_soon || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => navigate('/upload')}
            className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-base flex flex-col items-center justify-center space-y-2"
            data-testid="upload-prescription-button"
          >
            <FileText className="w-6 h-6" />
            <span>Upload Prescription</span>
          </Button>

          <Button
            onClick={() => navigate('/medicines')}
            className="h-20 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-base flex flex-col items-center justify-center space-y-2"
            data-testid="manage-medicines-button"
          >
            <Package className="w-6 h-6" />
            <span>Manage Medicines</span>
          </Button>

          <Button
            onClick={() => navigate('/chat')}
            className="h-20 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-base flex flex-col items-center justify-center space-y-2"
            data-testid="ai-assistant-button"
          >
            <MessageSquare className="w-6 h-6" />
            <span>AI Assistant</span>
          </Button>

          <Button
            onClick={() => navigate('/alerts')}
            className="h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-base flex flex-col items-center justify-center space-y-2"
            data-testid="view-alerts-button"
          >
            <Bell className="w-6 h-6" />
            <span>View Alerts</span>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Prescriptions */}
          <Card data-testid="recent-prescriptions-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Recent Prescriptions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPrescriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No prescriptions yet</p>
              ) : (
                <div className="space-y-4">
                  {recentPrescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="flex items-start justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100"
                      data-testid={`prescription-${prescription.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {prescription.status === 'verified' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                          )}
                          <span className="font-semibold text-sm">
                            {prescription.type === 'image' ? 'Image Upload' : 'Text Entry'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {prescription.medicines.length} medicine(s) detected
                        </p>
                        <p className="text-xs text-gray-500">
                          Score: {prescription.verification_score}%
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nearby Medicine Stores Card */}
          <Card
            className="cursor-pointer border-2 border-blue-100 hover:border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 flex flex-col justify-center items-center"
            data-testid="nearby-medicine-stores-card"
            onClick={() => window.location.href = 'http://localhost:3002/'}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Nearby Medicine Stores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Click to find medicine stores near you</p>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card data-testid="recent-alerts-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <span>Recent Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No alerts</p>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'high'
                          ? 'bg-red-50 border-red-200'
                          : alert.severity === 'medium'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-start space-x-2">
                        <AlertTriangle
                          className={`w-4 h-4 mt-0.5 ${
                            alert.severity === 'high'
                              ? 'text-red-600'
                              : alert.severity === 'medium'
                              ? 'text-orange-600'
                              : 'text-yellow-600'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;