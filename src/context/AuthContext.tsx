import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  User,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from '../types/auth';
import {
  loginApi,
  registerApi,
  getCurrentUserApi,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
} from '../api/auth';
import { registerUnauthorizedHandler, unregisterUnauthorizedHandler } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSecretary: boolean;
  isCommitteeOrAbove: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    removeStoredToken();
    removeStoredUser();
    setUser(null);
    setToken(null);
  }, []);

  // Register 401 handler for auto-logout
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout();
    });

    return () => {
      unregisterUnauthorizedHandler();
    };
  }, [logout]);

  // Validate session on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const freshUser = await getCurrentUserApi();
        setUser(freshUser);
        setStoredUser(freshUser);
      } catch {
        // If /me fails, clear corrupted or expired session
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    const data = await loginApi(payload);
    setStoredToken(data.access_token);
    setStoredUser(data.user);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const data = await registerApi(payload);
    return data;
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!token) return null;
    try {
      const freshUser = await getCurrentUserApi();
      setUser(freshUser);
      setStoredUser(freshUser);
      return freshUser;
    } catch {
      logout();
      return null;
    }
  }, [token, logout]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  }, []);

  const isAuthenticated = !!token && !!user;
  const isSecretary = user?.role === 'secretary';
  const isCommitteeOrAbove = user?.role === 'secretary' || user?.role === 'committee';

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      isSecretary,
      isCommitteeOrAbove,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [
      user,
      token,
      isAuthenticated,
      isLoading,
      isSecretary,
      isCommitteeOrAbove,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

