import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
import { ShieldCheck, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Pending() {
  const { user, profile, submitInviteCode } = useAuth();
  
  // Invite code is "15042011", 8 digits.
  const [code, setCode] = useState<string[]>(Array(8).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (profile) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <h2 className="text-2xl font-bold text-emerald-600 mb-2 z-10">Account Approved!</h2>
        <p className="text-gray-600 z-10">Redirecting you to the dashboard...</p>
      </div>
    );
  }

  const handleChange = (index: number, value: string) => {
    setError('');
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only allow 1 char
    setCode(newCode);

    // Auto focus next
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 8) {
      setError('Please enter the complete 8-digit code.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    const res = await submitInviteCode(fullCode);
    if (!res.success) {
      setError(res.message || 'Invalid verification code.');
    } else {
      setSuccess('Identity verified. Entering sanctuary...');
      window.location.href = '/';
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans relative overflow-hidden">
      {/* Background radial soft gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[100px] opacity-60"></div>
      </div>

      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 px-4">
        
        <div className="bg-white w-full max-w-[480px] rounded-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-3xl font-bold text-[#111827] mb-3">Identity Verification</h2>
          <p className="text-sm text-gray-500 mb-8 font-medium">
            Please enter the 8-digit secret invite code to continue to your secure dashboard. You are logged in as {user?.email}.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 sm:gap-3 justify-center mb-8">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={clsx(
                    "w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-bold rounded-lg border focus:outline-none transition-all",
                    digit ? "border-[#1e1b4b] bg-white ring-2 ring-[#1e1b4b]/10 text-[#1e1b4b]" : "border-gray-200 bg-[#f3f4f6] text-gray-400 focus:bg-white focus:border-[#1e1b4b]"
                  )}
                />
              ))}
            </div>

            {error && <p className="text-sm text-red-600 text-center mb-4">{error}</p>}
            {success && <p className="text-sm text-emerald-600 text-center mb-4 font-medium">{success}</p>}

            {/* Login Action */}
            <button 
              type="submit"
              disabled={isSubmitting || code.some(d => !d)}
              className="w-full bg-[#111827] hover:bg-[#1f2937] text-white font-medium py-3.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Owner needs to approve you?</p>
            <button className="text-sm font-semibold text-[#1e1b4b] hover:text-[#312e81] transition-colors" onClick={() => window.location.reload()}>
              Refresh Status
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
             <div className="inline-flex bg-white shadow-sm border border-gray-100 text-[#111827] px-4 py-3 rounded-lg gap-3 items-start">
               <div className="bg-[#111827] rounded text-white p-1.5 mt-0.5 shadow-sm">
                 <ShieldCheck className="w-4 h-4" />
               </div>
               <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Security Protocol</h4>
                  <p className="text-xs italic font-medium italic text-gray-600">"Multi-factor authentication is active for your protection."</p>
               </div>
             </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full flex flex-col md:flex-row justify-between items-center p-6 text-[10px] sm:text-xs text-gray-400 font-semibold tracking-wide z-10 mt-auto uppercase">
        <div>© 2024 CJA VERIXA. ARCHITECTURAL SECURITY.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-gray-600 transition-colors">PRIVACY POLICY</a>
          <a href="#" className="hover:text-gray-600 transition-colors">TERMS OF SERVICE</a>
          <a href="#" className="hover:text-gray-600 transition-colors">HELP CENTER</a>
        </div>
      </footer>
    </div>
  );
}
