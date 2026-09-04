import React,{ useState } from 'react';
import { api } from '../api/client';
import { connectSocket } from '../socket';

export default function LoginPage({ onAuthed }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
     name: '',
     email: '',
     password: '',
     role: 'retailer',
     phone: ''
    });
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      connectSocket();
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold mb-4">
          {mode === 'login' ? 'Log in' : 'Create account'}
        </h1>

        {mode === 'register' && (
          <>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <select
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="retailer">Retailer</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="rider">Rider</option>
            </select>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </>
        )}

        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-lime-400 text-gray-900 font-medium disabled:opacity-50"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="button"
          className="text-sm text-gray-400 underline"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? "Need an account? Register" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
