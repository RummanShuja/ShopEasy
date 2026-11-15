import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminLogin } from '../api/adminApi';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const signOut = useCallback(() => setSession(null), []);

  useEffect(() => {
    if (!session) return undefined;
    const timer = window.setTimeout(signOut, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session, signOut]);

  async function signIn(credentials) {
    const { accessToken, expiresIn } = await adminLogin(credentials);
    setSession({ token: accessToken, expiresAt: Date.now() + expiresIn * 1000 });
  }

  const handleAuthError = useCallback((error) => {
    if (error.status === 401) signOut();
  }, [signOut]);

  return (
    <AdminAuthContext.Provider value={{ token: session?.token, signIn, signOut, handleAuthError }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
