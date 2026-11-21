import { useState } from 'react';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/layout/Logo';
import { useAdminAuth } from '../context/AdminAuthContext';

export function AdminLoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { token, signIn } = useAdminAuth();
  const { state } = useLocation();
  if (token) return <Navigate replace to={['/admin/orders', '/admin/products'].includes(state?.from) ? state.from : '/admin'} />;

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(credentials);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  function change(event) {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
    setError(null);
  }

  return (
    <main className="admin-login">
      <div className="login-top container"><Logo /><Link className="back-link" to="/"><ArrowLeft size={16} /> Storefront</Link></div>
      <section className="login-card">
        <span className="status-icon"><LockKeyhole size={25} /></span>
        <h1>Admin sign in</h1>
        <p>Manage ShopEasy inventory and view orders.</p>
        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="admin-username">Username</label>
            <input id="admin-username" name="username" autoComplete="username" required maxLength={100}
              value={credentials.username} onChange={change} />
            {error?.fieldErrors?.username && <span className="field-error">{error.fieldErrors.username}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={72}
              value={credentials.password} onChange={change} />
            {error?.fieldErrors?.password && <span className="field-error">{error.fieldErrors.password}</span>}
          </div>
          {error && <p className="inline-error" role="alert">{error.message}</p>}
          <button className="button button--primary" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  );
}
