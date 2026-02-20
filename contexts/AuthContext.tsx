import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { getCurrentUser, loginUser as login, logoutUser as logout, setCurrentUser, getUsers, verifyUserCredentials } from '@/lib/storage';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
const LAST_ACTIVITY_KEY = 'last_activity';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loginUser: (email: string, password: string) => boolean;
  logoutUser: () => void;
  verifyCurrentUser: (email: string, password: string) => boolean;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (user) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
  }, [user]);

  // Check for inactivity
  useEffect(() => {
    if (!user) return;

    const checkInactivity = () => {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > INACTIVITY_TIMEOUT) {
          handleLogout();
          toast.info('Inaktivitás miatt kijelentkeztettük.');
        }
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkInactivity, 10000);

    // Update activity on user interaction
    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Initial activity timestamp
    updateActivity();

    return () => {
      clearInterval(interval);
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, [user, handleLogout]);

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      // Check if session is still valid (not timed out)
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > INACTIVITY_TIMEOUT) {
          handleLogout();
          return;
        }
      }
      setUser(savedUser);
    }
  }, [handleLogout]);

  const handleLogin = (email: string, password: string): boolean => {
    const loggedInUser = login(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      return true;
    }
    return false;
  };

  const verifyCurrentUser = (email: string, password: string): boolean => {
    if (!user) return false;
    return verifyUserCredentials(email, password, user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loginUser: handleLogin,
        logoutUser: handleLogout,
        verifyCurrentUser,
        resetInactivityTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
