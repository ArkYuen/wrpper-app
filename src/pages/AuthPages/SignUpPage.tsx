import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">W</span>
          </div>
          <span className="text-base font-semibold text-gray-900 tracking-tight">
            wrp<span className="text-brand-600">per</span>
          </span>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9l3.5 3.5L14 6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Check your email</h2>
              <p className="text-xs text-gray-400">We sent a confirmation link to <strong>{email}</strong></p>
            </div>
          ) : (
            <>
              <h1 className="text-base font-semibold text-gray-900 mb-1">Create account</h1>
              <p className="text-sm text-gray-400 mb-5">Start attributing influencer conversions</p>

              {error && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="input-label">Email</label>
                  <input className="input font-sans" type="email" placeholder="you@brand.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="input-label">Password</label>
                  <input className="input font-sans" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Create account'}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-gray-400">
                Already have an account?{' '}
                <Link to="/signin" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
