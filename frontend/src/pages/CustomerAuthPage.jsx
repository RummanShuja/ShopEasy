import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Leaf, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import hero from '../assets/pharmacy-hero.png';

export function CustomerAuthPage({ register = false }) {
  const { customer, restoring, signIn } = useCustomerAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (customer) return <Navigate to="/shop" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await signIn(values, register); navigate('/shop', { replace: true }); }
    catch (failure) { setError(failure); }
    finally { setBusy(false); }
  }
  return <div className="container account-entry">
    <div className="account-story" style={{ backgroundImage: `url(${hero})` }}>
      <span className="eyebrow"><Leaf size={16} /> A little care goes a long way</span>
      <h2>Your wellbeing.<br />Our everyday purpose.</h2><p>A thoughtful home for your daily essentials.</p>
    </div>
    <section className="account-form-panel"><span className="eyebrow">Your ShopEasy account</span>
      <h1>{register ? 'Begin with a little care.' : 'Good to see you again.'}</h1>
      <p>{register ? 'Save your cart and keep track of your orders.' : 'Sign in to pick up where you left off.'}</p>
      <form onSubmit={submit} className="account-form">
        {register && <label className="form-field">Full name<input name="name" autoComplete="name" required maxLength={100}
          value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>}
        <label className="form-field">Email address<input type="email" name="email" autoComplete="email" required maxLength={254}
          value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
          {error?.fieldErrors?.email && <span className="field-error">{error.fieldErrors.email}</span>}</label>
        <label className="form-field">Password<span className="password-field"><input type={showPassword ? 'text' : 'password'}
          name="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : undefined} maxLength={72}
          value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} />
          <button type="button" className="icon-button" aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
          {register && <small>At least 8 characters.</small>}
          {error?.fieldErrors?.password && <span className="field-error">{error.fieldErrors.password}</span>}</label>
        {error && <p className="inline-error" role="alert">{error.message}</p>}
        <button className="button button--primary" disabled={busy || restoring}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={18} /></button>
      </form>
      <p className="account-switch">{register ? 'Already part of ShopEasy?' : 'New to ShopEasy?'}{' '}
        <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
      <div className="account-security"><ShieldCheck size={17} /> Your personal details stay protected.</div>
    </section>
  </div>;
}
