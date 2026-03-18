'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAuthenticated, removeToken, setToken } from './api/client';
import { accountService, AccountResponse } from './api/accounts';
import { authService, UserInfo } from './api/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  account: AccountResponse | null;
  user: UserInfo | null;
  login: (token: string) => void;
  logout: () => void;
  refreshAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
    if (authenticated) {
      refreshAccount();
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // User might not exist or endpoint might fail
      console.error('Failed to fetch user:', error);
      setUser(null);
    }
  };

  const refreshAccount = async () => {
    try {
      const accountData = await accountService.getByUser();
      setAccount(accountData);
    } catch (error) {
      // Account might not exist yet (e.g., user just registered)
      console.error('Failed to fetch account:', error);
      setAccount(null);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const login = (token: string) => {
    setToken(token);
    setIsLoggedIn(true);
    refreshAccount();
    fetchUser();
  };

  const logout = () => {
    removeToken();
    setIsLoggedIn(false);
    setAccount(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, account, user, login, logout, refreshAccount, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
