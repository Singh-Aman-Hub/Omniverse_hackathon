import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Activity, ArrowLeft, Send, Bot, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';
import { toast } from 'sonner';

const ChatAssistant = ({ onLogout }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load chat sessions or start new
    loadChatSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSessions = async () => {
    try {
      const response = await axios.get('/chat/sessions');
      if (response.data.length > 0) {
        const latestSession = response.data[0];
        setSessionId(latestSession.session_id);
        loadChatHistory(latestSession.session_id);
      }
    } catch (error) {
      console.error('Failed to load sessions');
    }
  };

  const loadChatHistory = async (sid) => {
    try {
      const response = await axios.get(`/chat/history/${sid}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load chat history');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/chat', {
        message: inputMessage,
        session_id: sessionId
      });

      if (!sessionId) {
        setSessionId(response.data.session_id);
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
  };

  const suggestedQuestions = [
    "What should I do if I have a fever?",
    "Can I take these medicines together?",
    "What are the side effects of ibuprofen?",
    "How do I manage a headache?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" data-testid="chat-assistant-page">
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
              AI Health Assistant
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={startNewChat}
            data-testid="new-chat-button"
          >
            New Chat
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl h-[calc(100vh-120px)] flex flex-col">
        <Card className="flex-1 flex flex-col shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>Chat with MediAssist AI</span>
            </CardTitle>
            <CardDescription>
              Ask about symptoms, medications, or general health questions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" data-testid="chat-messages-area">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">How can I assist you today?</h3>
                  <p className="text-gray-500 mb-6">Ask me anything about your health and medications</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {suggestedQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-left justify-start h-auto py-3 px-4 hover:bg-emerald-50 hover:border-emerald-300"
                        onClick={() => setInputMessage(question)}
                        data-testid={`suggested-question-${index}`}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`chat-message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${index}`}
                    >
                      <div
                        className={`flex items-start space-x-2 max-w-[80%] ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                              : 'bg-gradient-to-br from-cyan-400 to-blue-500'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-emerald-100' : 'text-gray-400'
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-500">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading}
                  className="flex-1 h-12"
                  data-testid="chat-input"
                />
                <Button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  data-testid="send-message-button"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
              <p className="text-xs text-gray-400 mt-2 text-center">
                AI responses are for informational purposes. Always consult a doctor for medical advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatAssistant;