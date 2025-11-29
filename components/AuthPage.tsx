import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, sendPasswordResetEmail, updateProfile, signInWithPopup } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage, googleProvider } from '../services/firebase';
import { UserCircleIcon, PhotoIcon, EnvelopeIcon, KeyIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface AuthPageProps {
  onLoginSuccess: (user: any, profilePicBlob?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Profile Pic
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Verification & Reset States
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Google accounts are implicitly verified
      onLoginSuccess(user, user.photoURL || undefined);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      let msg = "Google Sign-In failed.";
      if (err.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
      if (err.code === 'auth/popup-blocked') msg = "Pop-up blocked by browser.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Handle Profile Picture Upload if selected
        if (profilePic) {
           try {
             const storageRef = ref(storage, `profile_pics/${user.uid}`);
             await uploadBytes(storageRef, profilePic);
             const downloadURL = await getDownloadURL(storageRef);
             await updateProfile(user, { photoURL: downloadURL });
           } catch (uploadErr) {
             console.error("Error uploading profile pic during reg:", uploadErr);
             // Continue even if image upload fails
           }
        }

        // Send verification email
        await sendEmailVerification(user);
        
        // Sign out immediately to prevent auto-login until verified
        // await signOut(auth); // Removed explicit sign out to allow auto-login flow if needed
        // But for security/logic flow regarding "Verification Sent Screen", keep logic consistent.
        // Actually, keeping them signed in (but unverified) allows us to use `user` object if needed.
        
        // However, `App.tsx` checks `!user.emailVerified` and shows AuthPage if false.
        // So keeping them signed in is fine, App.tsx will handle the routing back to AuthPage.
        
        // Show verification screen
        setVerificationSentEmail(email);
        
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        let user = userCredential.user;
        
        // Force refresh user token to get latest emailVerified status
        await user.reload();
        user = auth.currentUser!;

        if (!user.emailVerified) {
           await signOut(auth);
           setError("Please verify your email address before logging in.");
           setLoading(false);
           return;
        }

        onLoginSuccess(user, user.photoURL || previewUrl || undefined);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "An error occurred.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      if (err.code === 'auth/wrong-password') msg = "Invalid password.";
      if (err.code === 'auth/user-not-found') msg = "User not found.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid credentials.";
      if (err.code === 'auth/too-many-requests') msg = "Too many failed attempts. Please try again later.";
      
      setError(msg);
    } finally {
      if (!verificationSentEmail) {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage(null);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage({ type: 'success', text: 'Password reset link sent! Check your email.' });
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to send reset email.";
      if (err.code === 'auth/user-not-found') msg = "No user found with this email.";
      if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
      setResetMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendStatus === 'sending' || resendStatus === 'sent') return;
    setResendStatus('sending');
    try {
      // Attempt to sign in silently to get the user object
      // This relies on the email/password state still being present in the form
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await signOut(auth); // Sign out again immediately to maintain security state
      
      setResendStatus('sent');
      setTimeout(() => setResendStatus('idle'), 5000); // Reset after 5s
      
    } catch (e) {
      console.error("Error resending email:", e);
      setResendStatus('idle');
      setError("Could not resend. Please ensure your password is correct.");
    }
  };

  // View: Verification Sent
  if (verificationSentEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
         {/* Background Ambience */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]"></div>
         </div>

         <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-indigo-900/40 rounded-2xl shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-slate-950 rounded-xl border border-indigo-800 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)] mb-6">
               <EnvelopeIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-indigo-100 mb-4">
              Verification Sent
            </h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              We have sent a verification link to <span className="text-indigo-400 font-semibold">{verificationSentEmail}</span>. 
              <br/>Verify it and log in.
            </p>
            
            <button 
              onClick={handleResendVerification}
              disabled={resendStatus !== 'idle'}
              className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4 mb-6 flex items-center justify-center w-full disabled:opacity-50 disabled:cursor-default"
            >
               {resendStatus === 'sending' && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
               {resendStatus === 'sending' ? 'Resending...' : 
                resendStatus === 'sent' ? 'Email Sent!' : 'Resend Verification Email'}
            </button>

            <button 
              onClick={() => {
                  setVerificationSentEmail(null);
                  setIsRegistering(false);
                  setPassword('');
                  setLoading(false);
              }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-serif font-bold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              Return to Login
            </button>
         </div>
      </div>
    );
  }

  // View: Reset Password
  if (isResettingPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]"></div>
         </div>

         <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-indigo-900/40 rounded-2xl shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-slate-950 rounded-xl border border-indigo-800 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)] mb-4">
                 <KeyIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-indigo-100 mb-2">
                Reset Password
              </h2>
              <p className="text-slate-400 text-sm">
                Enter your email to receive a reset link.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-indigo-300 mb-1 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950/50 border border-indigo-900/50 rounded-lg px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="seeker@alchemy.com"
                />
              </div>

              {resetMessage && (
                <div className={`text-xs border p-3 rounded-lg text-center ${resetMessage.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-400' : 'bg-red-900/20 border-red-900/50 text-red-400'}`}>
                  {resetMessage.text}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-serif font-bold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => {
                  setIsResettingPassword(false);
                  setResetMessage(null);
                  setResetEmail('');
                }}
                className="text-sm text-slate-500 hover:text-indigo-300 transition-colors"
              >
                Back to Login
              </button>
            </div>
         </div>
      </div>
    );
  }

  // View: Login / Register
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
       {/* Background Ambience */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]"></div>
       </div>

       <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-indigo-900/40 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-slate-950 rounded-xl border border-indigo-800 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)] mb-4">
               <span className="text-2xl font-serif font-bold text-white">TA</span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-indigo-100 mb-2">
              {isRegistering ? 'Initiate Alchemy' : 'Enter the Void'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isRegistering ? 'Create your identity to begin transmuting.' : 'Sign in to continue your work.'}
            </p>
          </div>

          {/* Google Sign In Button - Prominent */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 font-sans font-semibold py-3 rounded-xl shadow-md transition-all flex items-center justify-center mb-6"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
               <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
               <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
               <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
               <path fill="#EA4335" d="M12 4.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="relative flex items-center justify-center mb-6">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-indigo-900/40"></div>
             </div>
             <span className="relative bg-slate-900/80 px-3 text-xs text-indigo-300/60 uppercase tracking-widest">Or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Profile Picture Upload (Register Only) */}
            {isRegistering && (
              <div className="flex flex-col items-center space-y-3">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-950 border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 transition-colors group cursor-pointer">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-300/50 group-hover:text-indigo-300">
                       <PhotoIcon className="w-8 h-8" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-xs text-indigo-300/70 uppercase tracking-wider">Upload Avatar</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-indigo-300 mb-1 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/50 border border-indigo-900/50 rounded-lg px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="seeker@alchemy.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-indigo-300 mb-1 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/50 border border-indigo-900/50 rounded-lg px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Forgot Password Link (Login Mode Only) */}
            {!isRegistering && (
              <div className="flex justify-end -mt-4">
                 <button
                   type="button"
                   onClick={() => {
                     setIsResettingPassword(true);
                     setResetEmail(email); // Pre-fill if they typed it
                     setError(null);
                   }}
                   className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors hover:underline"
                 >
                   Forgot Password?
                 </button>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-lg text-center space-y-3">
                <div className="text-red-400 text-xs">{error}</div>
                {/* Resend Verification Button (Only if error relates to verification) */}
                {error.toLowerCase().includes("verify") && (
                   <button
                     type="button"
                     onClick={handleResendVerification}
                     disabled={resendStatus !== 'idle'}
                     className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center justify-center w-full disabled:opacity-50"
                   >
                      {resendStatus === 'sending' ? (
                        <>
                          <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
                          Resending...
                        </>
                      ) : resendStatus === 'sent' ? (
                        'Email Sent!'
                      ) : (
                        'Resend Verification Email'
                      )}
                   </button>
                )}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-serif font-bold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isRegistering ? 'Begin Journey' : 'Access Terminal')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setProfilePic(null);
                setPreviewUrl(null);
                setVerificationSentEmail(null);
              }}
              className="text-sm text-slate-500 hover:text-indigo-300 transition-colors underline underline-offset-4"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
       </div>
    </div>
  );
};