import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Mail, Lock, ShieldCheck, User, ArrowRight, Loader2 } from 'lucide-react';


export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isLoading } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let res;
      if (isSignUp) {
        if (!name) {
          setError('Please enter your name');
          setSubmitting(false);
          return;
        }
        res = await signUpWithEmail(email, password, name);
      } else {
        res = await signInWithEmail(email, password);
      }

      if (res && !res.success) {
        setError(res.message || 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <header className="w-full flex justify-between items-center p-6 z-10">
        <div className="text-2xl tracking-tight text-[#111827]">
          <span className="font-bold">Cja </span>
          <span className="font-normal">verixa</span>
        </div>
        <div className="flex bg-[#78350f] text-[#fef3c7] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded gap-1.5 items-center shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ENCRYPTED SESSION</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center z-10 px-4">
        <div className="text-center mb-8">
            <div className="text-3xl tracking-tight text-[#111827] mb-1">
              <span className="font-bold">Cja </span>
              <span className="font-normal">verixa</span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-2">Architectural Security</p>
        </div>

        <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-2xl font-semibold text-[#111827] mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            {isSignUp ? 'Join the sanctuary and start managing tasks.' : 'Please enter your credentials to access your secure sanctuary.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe" 
                    className="w-full bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 text-sm rounded-lg pl-10 pr-4 py-3 outline-none text-gray-800 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 text-sm rounded-lg pl-10 pr-4 py-3 outline-none text-gray-800 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                {!isSignUp && <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Forgot?</a>}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 text-sm rounded-lg pl-10 pr-4 py-3 outline-none text-gray-800 transition-all font-mono"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={isLoading || submitting}
              className="w-full bg-[#111827] hover:bg-slate-800 text-white font-medium py-3.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSignUp ? 'Create Sanctuary Account' : 'Access Sanctuary'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-gray-200 w-full"></div>
            <div className="bg-white px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider absolute">Or continue with</div>
          </div>

          <button 
            type="button"
            onClick={signInWithGoogle}
            disabled={isLoading || submitting}
            className="w-full bg-[#f9fafb] hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google OAuth
          </button>
        </div>
        
        <p className="mt-8 text-sm text-gray-600 z-10">
          {isSignUp ? 'Already have access?' : 'New to the sanctuary?'}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-[#111827] font-semibold hover:underline ml-1.5"
          >
            {isSignUp ? 'Login here' : 'Create an account'}
          </button>
        </p>
      </main>

      <footer className="w-full flex flex-col md:flex-row justify-between items-center p-6 text-[10px] text-gray-400 font-semibold tracking-wide z-10 mt-auto uppercase">
        <div>© 2024 CJA VERIXA. ARCHITECTURAL SECURITY.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-gray-600">PRIVACY</a>
          <a href="#" className="hover:text-gray-600">TERMS</a>
          <a href="#" className="hover:text-gray-600">HELP</a>
        </div>
      </footer>
    </div>
  );
}
