import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function LoginPage() {
  const { signIn, session, therapist } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (session && therapist) return <Navigate to="/app" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      navigate('/app');
    }
  }

  function fillDemo() {
    setEmail('demo@unfazed.in');
    setPassword('demo1234');
  }

  return (
    <div className="flex min-h-screen flex-col bg-sage-50">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-700">
            <Sparkles className="h-5 w-5 text-sage-100" />
          </div>
          <span className="font-serif text-xl font-semibold text-sage-900">Unfazed</span>
        </Link>

        <div className="card p-8">
          <h1 className="font-serif text-2xl font-semibold text-ink-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-500">Sign in to your practice dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-sage w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <button
            onClick={fillDemo}
            className="mt-3 w-full rounded-lg bg-sage-100 px-3.5 py-2.5 text-sm font-medium text-sage-800 transition-colors hover:bg-sage-200"
          >
            Use demo account
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-sage-700 hover:text-sage-800">
            Create one
          </Link>
        </p>

        <Link to="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-ink-600">
          <ArrowLeft className="h-4 w-4" /> Back to Unfazed
        </Link>
      </div>
    </div>
  );
}
