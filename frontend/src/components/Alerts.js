import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Activity, ArrowLeft, CheckCircle, AlertTriangle, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

const Alerts = ({ onLogout }) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await axios.get('/alerts');
      setAlerts(response.data);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await axios.put(`/alerts/${alertId}/read`);
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === alertId ? { ...alert, is_read: true } : alert))
      );
      toast.success('Alert marked as read');
    } catch (error) {
      toast.error('Failed to mark alert as read');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'conflict':
        return <Shield className="w-5 h-5" />;
      case 'expiry':
        return <Clock className="w-5 h-5" />;
      case 'stock':
        return <Bell className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'from-red-50 to-red-100 border-red-200 text-red-800';
      case 'medium':
        return 'from-orange-50 to-orange-100 border-orange-200 text-orange-800';
      default:
        return 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800';
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unread') return !alert.is_read;
    if (filter === 'high') return alert.severity === 'high';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-2xl font-semibold text-emerald-600">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" data-testid="alerts-page">
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
              Alerts & Notifications
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Alerts</h2>
          <p className="text-gray-600">{alerts.filter((a) => !a.is_read).length} unread alert(s)</p>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" data-testid="filter-all">All</TabsTrigger>
            <TabsTrigger value="unread" data-testid="filter-unread">Unread</TabsTrigger>
            <TabsTrigger value="high" data-testid="filter-high">High Priority</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredAlerts.length === 0 ? (
          <Card className="shadow-xl">
            <CardContent className="py-16 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <p className="text-xl text-gray-500 mb-2">No alerts to display</p>
              <p className="text-sm text-gray-400">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`alert-item shadow-md border-2 bg-gradient-to-r ${getSeverityColor(alert.severity)} ${
                  !alert.is_read ? 'border-l-4' : ''
                }`}
                data-testid={`alert-card-${alert.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          alert.severity === 'high'
                            ? 'bg-red-200'
                            : alert.severity === 'medium'
                            ? 'bg-orange-200'
                            : 'bg-yellow-200'
                        }`}
                      >
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold text-lg">{alert.title}</h3>
                          <Badge
                            className={`${
                              alert.severity === 'high'
                                ? 'bg-red-600 text-white'
                                : alert.severity === 'medium'
                                ? 'bg-orange-600 text-white'
                                : 'bg-yellow-600 text-white'
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {!alert.is_read && <Badge className="bg-blue-600 text-white">NEW</Badge>}
                        </div>
                        <p className="text-sm mb-3">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-xs opacity-75">
                          <span>Type: {alert.type}</span>
                          <span>•</span>
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="ml-4"
                        data-testid={`mark-read-${alert.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
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

export default Alerts;