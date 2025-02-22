import React, { useState, useEffect } from 'react';
import { Loader2, LogOut, MessageSquare, Plus, Send, Pencil } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase, Message, ChatSession, createChatSession, updateChatTitle } from '../lib/supabase';
import {useNavigate} from 'react-router-dom' 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NewPage from './newPage';


type AuthMode = 'login' | 'register';

interface FormData {
  fullName?: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

function MainChat() {
  const navigate=useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadChatSessions();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadChatSessions();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadChatSessions = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load chat sessions');
      return;
    }

    if (data) {
      setChatSessions(data);
      if (data.length > 0 && !currentChatId) {
        setCurrentChatId(data[0].id);
        loadMessages(data[0].id);
      }
    }
  };

  const loadMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_session_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load messages');
      return;
    }

    if (data) {
      setMessages(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone_number: formData.phoneNumber,
            },
          },
        });

        if (error) throw error;
        toast.success('Registration successful! You can now login.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        toast.success('Login successful!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMessages([]);
    setChatSessions([]);
    setCurrentChatId(null);
    toast.success('Signed out successfully');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user?.id || !currentChatId) return;

    const userMessage = {
      user_id: session.user.id,
      chat_session_id: currentChatId,
      role: 'user' as const,
      content: input.trim(),
    };

    const { error: userError } = await supabase
      .from('messages')
      .insert(userMessage);

    if (userError) {
      toast.error('Failed to send message');
      return;
    }

    setInput('');

    // Simulate AI response
    const aiMessage = {
      user_id: session.user.id,
      chat_session_id: currentChatId,
      role: 'assistant' as const,
      content: "I'm a simulated AI response. In a real application, this would be connected to an AI service.",
    };

    const { error: aiError } = await supabase
      .from('messages')
      .insert(aiMessage);

    if (aiError) {
      toast.error('Failed to receive AI response');
      return;
    }

    // Update chat session's updated_at
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentChatId);

    // Reload messages and chat sessions
    await loadMessages(currentChatId);
    await loadChatSessions();
  };

  const handleNewChat = async () => {
    if (!session?.user?.id) return;

    const newChat = await createChatSession(session.user.id);
    if (newChat) {
      setCurrentChatId(newChat.id);
      setChatSessions([newChat, ...chatSessions]);
      setMessages([]);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    loadMessages(chatId);
  };

  const handleEditTitle = (chatId: string, currentTitle: string) => {
    setEditingTitle(chatId);
    setTitleInput(currentTitle);
  };

  const handleTitleSave = async (chatId: string) => {
    if (!titleInput.trim()) return;

    const success = await updateChatTitle(chatId, titleInput.trim());
    if (success) {
      await loadChatSessions();
      setEditingTitle(null);
    } else {
      toast.error('Failed to update chat title');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-center text-white mb-8">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-purple-200">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg bg-purple-950/50 border border-purple-500 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-purple-200">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg bg-purple-950/50 border border-purple-500 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+1234567890"
                  />
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-purple-200">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-purple-950/50 border border-purple-500 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-purple-200">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg bg-purple-950/50 border border-purple-500 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  {mode === 'login' ? 'Logging in...' : 'Registering...'}
                </span>
              ) : (
                <span>{mode === 'login' ? 'Login' : 'Register'}</span>
              )}
            </button>

            <p className="text-center text-sm text-purple-200">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-purple-400 hover:text-purple-300 font-medium focus:outline-none"
              >
                {mode === 'login' ? 'Register here' : 'Login here'}
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    
    <div className="flex h-screen bg-black relative ">
      
      {/* New Top Button */}
      <button
        onClick={() => navigate("/new-page")}
        className="absolute top-4 left-1/2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition"
      >
        Go to New Page
      </button>

      {/* Sidebar */}
      <div className="w-64 bg-gray-900 p-4 flex flex-col">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white mb-4"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-white/70 cursor-pointer ${
                currentChatId === chat.id ? "bg-white/10" : ""
              }`}
              onClick={() => handleChatSelect(chat.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              {editingTitle === chat.id ? (
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => handleTitleSave(chat.id)}
                  onKeyPress={(e) => e.key === "Enter" && handleTitleSave(chat.id)}
                  className="flex-1 bg-transparent border-b border-purple-500 focus:outline-none text-sm"
                  autoFocus
                />
              ) : (
                <>
                  <span className="flex-1 truncate text-sm">{chat.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTitle(chat.id, chat.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-white/20 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-white/70 p-3">
            <div className="flex-1 truncate text-sm">{session.user.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-white/70"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-800">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/70">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">Welcome to AI Chat</h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user" ? "bg-purple-600 text-white" : "bg-white/10 text-white/90"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-white/10 text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default MainChat;