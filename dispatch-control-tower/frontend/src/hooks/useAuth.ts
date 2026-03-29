import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { UserPayload } from '../types';

interface AuthState {
  token: string | null;
  user: UserPayload | null;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
});

function decodeJwt(token: string): UserPayload | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded) as UserPayload;
  } catch {
    return null;
  }
}

function getInitialToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const user = decodeJwt(token);
  if (!user || user.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
    return null;
  }
  return token;
}

export function useAuthProvider(): AuthState {
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [user, setUser] = useState<UserPayload | null>(() => {
    const t = getInitialToken();
    return t ? decodeJwt(t) : null;
  });

  const login = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(decodeJwt(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) return;
    const decoded = decodeJwt(token);
    if (!decoded) return;
    const ms = decoded.exp * 1000 - Date.now();
    if (ms <= 0) {
      logout();
      return;
    }
    const timer = setTimeout(logout, ms);
    return () => clearTimeout(timer);
  }, [token, logout]);

  return { token, user, login, logout };
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
