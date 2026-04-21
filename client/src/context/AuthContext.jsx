import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('flashdeck_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const persist = (u) => {
    if (u) localStorage.setItem('flashdeck_user', JSON.stringify(u));
    else localStorage.removeItem('flashdeck_user');
    setUser(u);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      persist(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => persist(null);

  const refresh = async () => {
    try {
      const { data } = await api.get('/auth/me');
      persist({ ...user, ...data });
    } catch (e) {}
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put('/auth/me', payload);
    persist({ ...user, ...data });
    return data;
  };

  useEffect(() => {
    if (user?.token) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
