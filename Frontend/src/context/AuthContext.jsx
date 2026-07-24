import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authAPI, setTokens, clearTokens } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await authAPI.profile();
      setUser(data);
      return data;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
        await fetchProfile();
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchProfile]);

  const login = useCallback(async (username, password) => {
    const data = await authAPI.login({ username, password });
    setTokens({ access: data.access, refresh: data.refresh });
    const me = await fetchProfile();
    return me;
  }, [fetchProfile]);

  const register = useCallback(async (form) => {
    const data = await authAPI.register(form);
    if (data.access && data.refresh) {
      setTokens({ access: data.access, refresh: data.refresh });
      await fetchProfile();
    }
    return data;
  }, [fetchProfile]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
