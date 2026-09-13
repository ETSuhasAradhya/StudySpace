import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogIn, UserPlus, Zap } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins for fast grading/demonstration
  const handleQuickLogin = async (demoEmail, demoRole) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon-large">
            <BookOpen size={32} color="#ffffff" />
          </div>
          <h1>StudySpace</h1>
          <p>Smart Library & Study Space Reservation System</p>
        </div>

        {/* Quick Demo Shortcuts Banner */}
        <div className="demo-shortcuts">
          <div className="demo-title">
            <Zap size={14} />
            <span>Instant Demo Logins (1-Click)</span>
          </div>
          <div className="demo-buttons">
            <button 
              type="button"
              className="btn-demo student"
              onClick={() => handleQuickLogin('alex@university.edu', 'student')}
            >
              🎓 Student: Alex
            </button>
            <button 
              type="button"
              className="btn-demo admin"
              onClick={() => handleQuickLogin('admin@studyspace.com', 'admin')}
            >
              ⚡ Admin: Campus
            </button>
          </div>
        </div>

        {/* Form Mode Toggle */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
          <button 
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            <UserPlus size={16} />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Maya Lin"
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. student@university.edu"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}
