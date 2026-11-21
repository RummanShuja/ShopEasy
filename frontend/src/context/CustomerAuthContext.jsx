import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { request } from '../api/http';

const KEY = 'shopeasy-customer-session';
const CustomerAuthContext = createContext(null);
function savedToken() { try { return sessionStorage.getItem(KEY); } catch { return null; } }
function persist(token) { try { if (token) sessionStorage.setItem(KEY, token); else sessionStorage.removeItem(KEY); } catch { /* In-memory session still works. */ } }

export function CustomerAuthProvider({ children }) {
  const [token, setToken] = useState(savedToken);
  const [customer, setCustomer] = useState(null);
  const [restoring, setRestoring] = useState(Boolean(savedToken()));
  const [sessionError, setSessionError] = useState('');
  const [revision, setRevision] = useState(0);
  const clearSession = useCallback(() => {
    persist(null); setToken(null); setCustomer(null); setRestoring(false); setSessionError('');
  }, []);
  useEffect(() => {
    const expired = () => clearSession();
    window.addEventListener('shopeasy-session-expired', expired);
    return () => window.removeEventListener('shopeasy-session-expired', expired);
  }, [clearSession]);
  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    request('/api/customer/session', { token, signal: controller.signal }).then((profile) => {
      if (!controller.signal.aborted) { setCustomer(profile); setRestoring(false); setSessionError(''); }
    }).catch((error) => {
      if (controller.signal.aborted) return;
      if (error.status === 401) clearSession();
      else { setSessionError(error.message); setRestoring(false); }
    });
    let expiry;
    try { expiry = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; } catch { clearSession(); }
    const timer = expiry ? window.setTimeout(clearSession, Math.max(0, expiry - Date.now())) : null;
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [token, clearSession, revision]);
  async function signIn(values, register = false) {
    const result = await request(`/api/customer/${register ? 'register' : 'login'}`, { method: 'POST', body: values });
    persist(result.accessToken); setCustomer(result.customer); setToken(result.accessToken); setSessionError('');
  }
  async function signOut() {
    if (token) await request('/api/customer/logout', { method: 'POST', token });
    clearSession();
  }
  return <CustomerAuthContext.Provider value={{ token, customer, restoring, sessionError, signIn, signOut,
    retrySession: () => { setRestoring(true); setRevision((value) => value + 1); } }}>{children}</CustomerAuthContext.Provider>;
}
export function useCustomerAuth() { return useContext(CustomerAuthContext); }
