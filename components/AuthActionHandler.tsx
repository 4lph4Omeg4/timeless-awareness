import React, { useEffect, useState } from 'react';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from '../services/firebase';
import { CheckCircleIcon, XCircleIcon, KeyIcon, EnvelopeIcon } from '@heroicons/react/24/solid';

interface AuthActionHandlerProps {
  mode: string;
  oobCode: string;
}

export const AuthActionHandler: React.FC<AuthActionHandlerProps> = ({ mode, oobCode }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handleAction = async () => {
      // 1. Verify Email
      if (mode === 'verifyEmail') {
        try {
          await applyActionCode(auth, oobCode);
          setStatus('success');
          setMessage('Your email has been verified. You can now access the full capabilities of the Timeline Alchemy.');
        } catch (error) {
          console.error(error);
          setStatus('error');
          setMessage('The verification code is invalid or has expired.');
        }
      } 
      // 2. Reset Password (Verification Step)
      else if (mode === 'resetPassword') {
        try {
          const emailAddress = await verifyPasswordResetCode(auth, oobCode);
          setEmail(emailAddress);
          setStatus('loading'); // Remain loading/interactive to show form
        } catch (error) {
          console.error(error);
          setStatus('error');
          setMessage('The password reset link is invalid or has expired.');
        }
      }
    };

    handleAction();
  }, [mode, oobCode]);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }
    
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      setMessage('Your password has been successfully reset. You may now sign in.');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('Failed to reset password. Please try again.');
    }
  };

  // Render: Reset Password Form
  if (mode === 'resetPassword' && status !== 'error' && status !== 'success') {
     return (
       <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-6">
          <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-indigo-900/40 rounded-2xl shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-slate-950 rounded-xl border border-indigo-800 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)] mb-4">
                 <KeyIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-indigo-100 mb-2">Reset Password</h2>
              <p className="text-slate-400 text-sm">for {email}</p>
            </div>
            
            <form onSubmit={handlePasswordResetSubmit} className="space-y-6">
               <div>
                  <label className="block text-xs font-medium text-indigo-300 mb-1 uppercase tracking-wider">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950/50 border border-indigo-900/50 rounded-lg px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
               </div>
               <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-serif font-bold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all"
               >
                 Change Password
               </button>
            </form>
          </div>
       </div>
     );
  }

  // Render: Success / Error / Loading for Verify Email (or Post-Reset Success)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-6">
       {/* Background Ambience */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]"></div>
       </div>

       <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-indigo-900/40 rounded-2xl shadow-2xl text-center">
          
          {status === 'loading' && (
             <div className="flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-purple-500 border-l-transparent animate-spin mb-4"></div>
                <h2 className="text-xl font-serif text-indigo-200">Processing...</h2>
             </div>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto bg-green-900/20 rounded-full border border-green-500/50 flex items-center justify-center mb-6">
                 <CheckCircleIcon className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-indigo-100 mb-4">Success</h2>
              <p className="text-slate-300 mb-8">{message}</p>
              <button 
                onClick={() => window.location.href = '/'} // Redirect to root to clear params and show login
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-serif font-bold py-3 rounded-xl shadow-lg transition-all"
              >
                Continue to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto bg-red-900/20 rounded-full border border-red-500/50 flex items-center justify-center mb-6">
                 <XCircleIcon className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-indigo-100 mb-4">Error</h2>
              <p className="text-slate-300 mb-8">{message}</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-serif font-bold py-3 rounded-xl shadow-lg transition-all border border-indigo-900/30"
              >
                Back to Home
              </button>
            </>
          )}
       </div>
    </div>
  );
};