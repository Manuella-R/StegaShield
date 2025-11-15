import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { authAPI, getToken } from './utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Try to get current user, but don't fail if API is not available
      // Use Promise.race with timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      try {
        const response = await Promise.race([
          authAPI.getCurrentUser(),
          timeoutPromise,
        ]);
        
        if (response && response.user) {
          setCurrentUser(response.user);
          setUserRole(response.user.role || 'user');
        }
      } catch (apiError) {
        // If API is not available or times out, clear token and continue
        console.warn('API not available or timeout:', apiError.message);
        localStorage.removeItem('token');
        setCurrentUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setCurrentUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      // Check if 2FA is required
      if (response && response.requires2FA) {
        // Return special response indicating 2FA is needed
        return {
          requires2FA: true,
          user_id: response.user_id,
          email: response.email
        };
      }
      
      if (response && response.user) {
        setCurrentUser(response.user);
        setUserRole(response.user.role || 'user');
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const verify2FA = useCallback(async (userId, code) => {
    try {
      const response = await authAPI.verify2FA(userId, code);
      if (response && response.user) {
        setCurrentUser(response.user);
        setUserRole(response.user.role || 'user');
      }
      return response;
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response && response.user) {
        setCurrentUser(response.user);
        setUserRole(response.user.role || 'user');
      }
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      authAPI.logout();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
    setCurrentUser(null);
    setUserRole(null);
    setLoading(false);
  }, []);

  const updateUser = useCallback((userData) => {
    setCurrentUser((prev) => ({ ...prev, ...userData }));
  }, []);

  const oauthLogin = useCallback(async (oauthData) => {
    try {
      const response = await authAPI.oauthLogin(oauthData);
      
      // Check if 2FA is required
      if (response && response.requires2FA) {
        // Return special response indicating 2FA is needed
        return {
          requires2FA: true,
          user_id: response.user_id,
          email: response.email,
          oauth: true
        };
      }
      
      if (response && response.user) {
        setCurrentUser(response.user);
        setUserRole(response.user.role || 'user');
        setLoading(false);
      }
      return response;
    } catch (error) {
      console.error('OAuth login error:', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      userRole,
      loading,
      login,
      register,
      logout,
      updateUser,
      checkAuth,
      oauthLogin,
      verify2FA,
    }),
    [currentUser, userRole, loading, login, register, logout, updateUser, checkAuth, oauthLogin, verify2FA]
  );

  // Initialize auth check on mount
  useEffect(() => {
    let mounted = true;
    
    const runCheckAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Failed to check auth on mount:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    runCheckAuth();
    
    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}