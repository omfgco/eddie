'use client';
import { useState } from 'react';

const s = {
  input: {
    width: '100%', padding: '11px 14px', background: '#0d1117',
    border: '1px solid #242d38', borderRadius: 8, color: '#e6edf3',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  label: {
    display: 'block', fontFamily: 'monospace', fontSize: 10, fontWeight: 800,
    letterSpacing: 1.5, textTransform: 'uppercase', color: '#8b949e', marginBottom: 6,
  },
};

export default function Login() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!user.trim() || !pass) { setError('Enter a username and password.'); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      if (res.ok) {
        // Full reload so middleware re-evaluates with the new cookie.
        window.location.href = '/';
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Incorrect username or password.');
    } catch {
      setError('Could not reach the server. Try again.');
    }
    setBusy(false);
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
      background: '#0b0f14', color: '#e6edf3', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            margin: 0, fontSize: 44, fontWeight: 900, letterSpacing: -1.5, color: '#58a6ff', lineHeight: 1,
          }}>Eddie</h1>
          <div style={{
            fontFamily: 'monospace', fontSize: 9, color: '#6e7681',
            letterSpacing: 2, textTransform: 'uppercase', marginTop: 8,
          }}>Trademark Name Vetter</div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 9, marginTop: 18,
          }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 9, color: '#6e7681',
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}>by</span>
            <img src="/omfgco-dice.svg" alt="OMFGCO" style={{ height: 30 }} />
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#111820', border: '1px solid #1c2333',
          borderRadius: 12, padding: 24,
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label} htmlFor="eddie-user">Username</label>
            <input
              id="eddie-user" type="text" value={user} autoComplete="username" autoFocus
              onChange={(e) => setUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              style={s.input}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={s.label} htmlFor="eddie-pass">Password</label>
            <input
              id="eddie-pass" type="password" value={pass} autoComplete="current-password"
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              style={s.input}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: '#2d1215', border: '1px solid #5c2328',
              borderRadius: 8, color: '#f87171', fontSize: 13, marginBottom: 16, lineHeight: 1.5,
            }}>{error}</div>
          )}

          <button
            onClick={submit} disabled={busy}
            style={{
              width: '100%', padding: 13, background: busy ? '#1c2333' : '#58a6ff',
              color: busy ? '#6e7681' : '#0b0f14', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 800, cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 11, color: '#6e7681', marginTop: 18, lineHeight: 1.6,
        }}>
          Internal tool. Sessions last 12 hours.
        </p>
      </div>
    </div>
  );
}
