import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('studyspace_token') || null);
  const [loading, setLoading] = useState(true);

  // Restore user session on initial load
  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('studyspace_token');
      const savedUser = localStorage.getItem('studyspace_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        try {
          // Verify with backend
          const res = await api.getMe();
          setUser(res.user);
          localStorage.setItem('studyspace_user', JSON.stringify(res.user));
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('studyspace_token', res.token);
    localStorage.setItem('studyspace_user', JSON.stringify(res.user));
    return res;
  };

  const register = async (name, email, password, role) => {
    const res = await api.register(name, email, password, role);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('studyspace_token', res.token);
    localStorage.setItem('studyspace_user', JSON.stringify(res.user));
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('studyspace_token');
    localStorage.removeItem('studyspace_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
