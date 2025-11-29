import React, { useState, useEffect, useRef } from 'react';
import { updateProfile, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from '../services/firebase';
import { BrandingConfig, LogoPosition, UserProfile } from '../types';
import { ArrowLeftIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';

interface ProfilePageProps {
  user: User;
  onBack: () => void;
  onBrandingUpdate: (config: BrandingConfig) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onBrandingUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Profile State
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photoURL);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Branding State
  const [branding, setBranding] = useState<BrandingConfig>({
    logoFile: null,
    url: '',
    position: LogoPosition.BottomRight,
    opacity: 80
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load Branding from Firestore on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          if (data.branding) {
            const newBranding: BrandingConfig = {
              logoFile: null,
              logoUrl: data.branding.logoUrl,
              url: data.branding.url || '',
              position: data.branding.position || LogoPosition.BottomRight,
              opacity: data.branding.opacity || 80
            };
            setBranding(newBranding);
            if (data.branding.logoUrl) {
              setLogoPreview(data.branding.logoUrl);
            }
            onBrandingUpdate(newBranding);
          }
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
      }
    };
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBranding(prev => ({ ...prev, logoFile: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any form submission defaults
    setLoading(true);
    setMessage(null);

    let currentPhotoURL = user.photoURL;
    let currentLogoURL = branding.logoUrl;

    // STEP 1: Upload Profile Picture
    if (photoFile) {
      try {
        console.log("Starting Profile Picture Upload...");
        const photoRef = ref(storage, `profile_pics/${user.uid}`);
        await uploadBytes(photoRef, photoFile);
        currentPhotoURL = await getDownloadURL(photoRef);
        console.log("Profile Picture Uploaded:", currentPhotoURL);
      } catch (err: any) {
        console.error("Profile Picture Upload Failed:", err);
        const errMsg = err.code === 'storage/unauthorized' 
          ? "Permission denied: Cannot upload profile picture." 
          : "Failed to upload profile picture.";
        setMessage({ type: 'error', text: errMsg });
        setLoading(false);
        return; // Stop if this fails
      }
    }

    // STEP 2: Update Auth Profile
    try {
      if (displayName !== user.displayName || currentPhotoURL !== user.photoURL) {
         console.log("Updating Auth Profile...");
         await updateProfile(user, {
          displayName: displayName,
          photoURL: currentPhotoURL || null
        });
      }
    } catch (err) {
      console.error("Auth Update Failed:", err);
      // Continue, this is not critical for data persistence
    }

    // STEP 3: Upload Logo
    if (branding.logoFile) {
      try {
        console.log("Starting Logo Upload...");
        const logoRef = ref(storage, `branding_logos/${user.uid}`);
        await uploadBytes(logoRef, branding.logoFile);
        currentLogoURL = await getDownloadURL(logoRef);
        console.log("Logo Uploaded:", currentLogoURL);
      } catch (err: any) {
        console.error("Logo Upload Failed:", err);
        const errMsg = err.code === 'storage/unauthorized' 
          ? "Permission denied: Cannot upload logo." 
          : "Failed to upload logo.";
        setMessage({ type: 'error', text: errMsg });
        setLoading(false);
        return; // Stop
      }
    }

    // STEP 4: Save to Firestore
    try {
      console.log("Saving to Firestore...");
      
      // Sanitize Data - Ensure NO undefined values
      const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: displayName || '',
        photoURL: currentPhotoURL || null,
        branding: {
          logoUrl: currentLogoURL || null,
          url: branding.url || '',
          position: branding.position || LogoPosition.BottomRight,
          opacity: branding.opacity ?? 80 // Use nullish coalescing
        }
      };

      await setDoc(doc(db, "users", user.uid), userProfileData, { merge: true });
      console.log("Firestore Save Complete");

      // STEP 5: Update Local State & Cleanup
      const updatedBranding = {
        ...branding,
        logoUrl: currentLogoURL,
        logoFile: null
      };
      
      setBranding(updatedBranding);
      onBrandingUpdate(updatedBranding);
      
      setPhotoFile(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (logoInputRef.current) logoInputRef.current.value = '';

      setMessage({ type: 'success', text: 'All settings saved successfully.' });

    } catch (err: any) {
      console.error("Firestore Save Failed:", err);
      const errMsg = err.code === 'permission-denied' 
        ? "Database permission denied." 
        : "Failed to save settings to database.";
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={onBack}
            className="mr-4 p-2 rounded-full hover:bg-indigo-900/30 text-indigo-400 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-serif font-bold text-indigo-100">Alchemist Profile</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Identity */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900/60 border border-indigo-900/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg font-serif font-semibold text-indigo-200 mb-6">Identity</h2>
              
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-indigo-500/30 group cursor-pointer shadow-lg shadow-indigo-900/20">
                   {photoPreview ? (
                     <img src={photoPreview} alt="Profile" className="w-full h-full object-cover transition-opacity group-hover:opacity-75" />
                   ) : (
                     <div className="w-full h-full bg-slate-950 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300">
                       <UserCircleIcon className="w-20 h-20" />
                     </div>
                   )}
                   
                   {/* Overlay */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <PhotoIcon className="w-8 h-8 text-white" />
                   </div>
                   
                   <input 
                      ref={photoInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                   />
                </div>
                <p className="text-xs text-indigo-400 mt-2 uppercase tracking-wider">Tap to Change</p>
              </div>

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Display Name</label>
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-indigo-900/50 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Email</label>
                  <div className="w-full bg-slate-950/30 border border-indigo-900/20 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Branding */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-indigo-900/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg font-serif font-semibold text-indigo-200 mb-6">Default Branding</h2>
              <p className="text-sm text-slate-400 mb-6">These settings will be applied automatically to all your future alchemical image generations.</p>

              <div className="space-y-6">
                
                {/* Logo Upload */}
                <div className="flex items-start space-x-6">
                  <div className="w-24 h-24 bg-slate-950 border border-dashed border-indigo-500/30 rounded-lg flex items-center justify-center overflow-hidden relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-xs text-slate-600 text-center px-2">No Logo</span>
                    )}
                    <input 
                      ref={logoInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-indigo-300 mb-2 uppercase tracking-wider">Upload Brand Logo</label>
                    <p className="text-xs text-slate-500 mb-3">Recommended: PNG with transparent background.</p>
                    <button className="relative px-4 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 text-xs rounded-lg transition-colors border border-indigo-800/30">
                      Choose File
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div>
                    <label className="block text-xs font-medium text-indigo-300 mb-2 uppercase tracking-wider">Website URL</label>
                    <input 
                      type="text" 
                      value={branding.url}
                      onChange={(e) => setBranding(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="www.yourbrand.com"
                      className="w-full bg-slate-950/50 border border-indigo-900/50 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-200"
                    />
                   </div>
                   <div>
                    <label className="block text-xs font-medium text-indigo-300 mb-2 uppercase tracking-wider">Position</label>
                    <select 
                      value={branding.position}
                      onChange={(e) => setBranding(prev => ({ ...prev, position: e.target.value as LogoPosition }))}
                      className="w-full bg-slate-950/50 border border-indigo-900/50 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
                    >
                      <option value={LogoPosition.BottomLeft}>Bottom Left</option>
                      <option value={LogoPosition.BottomRight}>Bottom Right</option>
                    </select>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-medium text-indigo-300 mb-2 uppercase tracking-wider">Opacity: {branding.opacity}%</label>
                   <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={branding.opacity}
                    onChange={(e) => setBranding(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                   />
                </div>

              </div>
            </div>

            {/* Save Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-indigo-900/20">
               <div className="flex-1">
                 {message && (
                    <div className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {message.text}
                    </div>
                 )}
               </div>
               <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-serif font-bold shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {loading ? 'Saving...' : 'Save Changes'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};