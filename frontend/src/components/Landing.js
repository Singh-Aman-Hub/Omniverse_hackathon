import React, { useState } from 'react';
import { FileText, Shield, MessageSquare, Package, Bell, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';

const Landing = ({ onLogin }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(endpoint, formData);
      
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      onLogin(response.data.token, response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <Card className="w-full max-w-md shadow-2xl" data-testid="auth-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              MediAssist AI
            </CardTitle>
            <CardDescription className="text-center text-base">
              Your intelligent health companion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required={!isLogin}
                      data-testid="fullname-input"
                      className="h-12"
                    />
                  </div>
                )}
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="email-input"
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="password-input"
                    className="h-12"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-base"
                  disabled={loading}
                  data-testid="auth-submit-button"
                >
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </form>
            </Tabs>
            
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowAuth(false)}
              data-testid="back-button"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mb-6 shadow-lg">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent" data-testid="landing-title">
            MediAssist AI
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Your intelligent health companion powered by AI. Verify prescriptions, manage medications, and get instant health assistance.
          </p>
          <Button
            onClick={() => setShowAuth(true)}
            className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            data-testid="get-started-button"
          >
            Get Started Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="glass-hover border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300" data-testid="feature-prescription">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-bold">Prescription Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Upload prescription images or enter text manually. Our AI extracts and verifies medicine information with accuracy scores.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover border-2 border-teal-100 hover:border-teal-300 transition-all duration-300" data-testid="feature-conflict">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-teal-600" />
              </div>
              <CardTitle className="text-xl font-bold">Drug Conflict Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automatically detect dangerous drug interactions using FDA database and local ML models for your safety.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover border-2 border-cyan-100 hover:border-cyan-300 transition-all duration-300" data-testid="feature-chat">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-cyan-600" />
              </div>
              <CardTitle className="text-xl font-bold">AI Health Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Chat with AI for symptom analysis, medication queries, and general health guidance available 24/7.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300" data-testid="feature-stock">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-bold">Medicine Stock Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track your medicine inventory with smart alerts for low stock and expiring medications.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover border-2 border-teal-100 hover:border-teal-300 transition-all duration-300" data-testid="feature-alerts">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-teal-600" />
              </div>
              <CardTitle className="text-xl font-bold">Smart Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Receive prioritized notifications about drug conflicts, expiry dates, and stock levels.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover border-2 border-cyan-100 hover:border-cyan-300 transition-all duration-300" data-testid="feature-secure">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-cyan-600" />
              </div>
              <CardTitle className="text-xl font-bold">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your health data is encrypted and secure. We prioritize your privacy with industry-standard security.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;