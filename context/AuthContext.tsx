// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_STORAGE_KEY = 'app_pin';
const SESSION_STORAGE_KEY = 'session_active';

interface AuthContextType {
  isAuthenticated: boolean;
  pin: string | null;
  setPin: (pin: string) => Promise<void>;
  authenticate: (inputPin: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = { children: ReactNode; };

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [pin, setPinState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Load PIN & session on mount
  useEffect(() => {
    (async () => {
      try {
        const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
        const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

        if (storedPin) setPinState(storedPin);
        if (storedSession === 'true') setIsAuth(true);
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2️⃣ Persist a new PIN
  const setPin = async (newPin: string) => {
    await AsyncStorage.setItem(PIN_STORAGE_KEY, newPin);
    setPinState(newPin);
  };

  // 3️⃣ Attempt login or first‐time PIN creation
  const authenticate = async (inputPin: string): Promise<boolean> => {
    setIsAuth(true);
    return true;
  };

  // 4️⃣ Logout
  const logout = async () => {
    setIsAuth(false);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  };

  // 5️⃣ While loading, render nothing (or a splash screen)
  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, pin, setPin, authenticate, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 6️⃣ Custom hook for consumers
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
};
