import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem('rc_token');
      const savedUser = localStorage.getItem('rc_user');
      if (token && savedUser) return JSON.parse(savedUser);
    } catch (e) {
      console.error("Error reading saved user:", e);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    const token = localStorage.getItem('rc_token');
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.getMe();
      if (res.data) {
        setCurrentUser(res.data);
        localStorage.setItem('rc_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn("Session expired or invalid token.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await api.login(email, password, role);
      const { access_token, user } = res.data;
      localStorage.setItem('rc_token', access_token);
      localStorage.setItem('rc_user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      const { access_token, user } = res.data;
      localStorage.setItem('rc_token', access_token);
      localStorage.setItem('rc_user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rc_token');
    localStorage.removeItem('rc_user');
    setCurrentUser(null);
  };

  const switchPersona = async (userId) => {
    try {
      setLoading(true);
      const res = await api.switchPersona(userId);
      setCurrentUser(res.data.user);
      localStorage.setItem('rc_token', res.data.access_token);
      localStorage.setItem('rc_user', JSON.stringify(res.data.user));
      return res.data.user;
    } catch (err) {
      console.error("Error switching persona:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserCity = (newCity) => {
    setCurrentUser(prev => {
      const updated = { ...prev, city: newCity };
      localStorage.setItem('rc_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      register,
      logout,
      switchPersona,
      updateUserCity,
      refreshUser: fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

