// AuthPage — Login and registration page with demo account display
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    phoneNumber: '', role: 'CUSTOMER',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register({
          email: form.email, password: form.password,
          firstName: form.firstName, lastName: form.lastName,
          phoneNumber: form.phoneNumber, role: form.role,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">Q</div>
        </div>
        <h1 className="auth-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to manage your queue'
            : 'Join the Queue Management System'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    className="form-input" type="text" required
                    placeholder="John"
                    value={form.firstName}
                    onChange={e => update('firstName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-input" type="text" required
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={e => update('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input" type="tel"
                  placeholder="1234567890"
                  value={form.phoneNumber}
                  onChange={e => update('phoneNumber', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">I am a</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={e => update('role', e.target.value)}
                >
                  <option value="CUSTOMER">Customer / Patient</option>
                  <option value="STAFF">Staff Member</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input" type="email" required
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input" type="password" required
              placeholder="Enter your password" minLength={6}
              value={form.password}
              onChange={e => update('password', e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <a href="#" onClick={e => { e.preventDefault(); setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </a>
        </p>

        {isLogin && (
          <div style={{
            marginTop: '20px', padding: '14px', background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)',
          }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Demo Accounts:</strong>
            <div style={{ marginTop: '6px', display: 'grid', gap: '3px' }}>
              <span>Admin: admin@queue.com / admin123</span>
              <span>Staff: staff1@queue.com / staff123</span>
              <span>Customer: john@example.com / customer123</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
