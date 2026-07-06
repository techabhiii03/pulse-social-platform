import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-block w-2 h-2 rounded-full bg-accent pulse-live mb-3" />
          <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your Pulse account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-2xl p-6 space-y-4">
          {error && <p className="text-sm text-accent2 bg-accent2/10 border border-accent2/20 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full mt-1 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-accent text-ink font-semibold rounded-lg py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          No account? <Link to="/register" className="text-accent hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
