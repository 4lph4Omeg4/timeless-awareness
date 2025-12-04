import React, { useState, useEffect } from 'react';
import { generateAlchemyContent, generateAlchemyImage } from './services/geminiService';
import { ContentPackage, BrandingConfig, LogoPosition, HistoryItem, UserProfile } from './types';
import ImageCompositor from './components/ImageCompositor';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AuthPage } from './components/AuthPage';
import { AuthActionHandler } from './components/AuthActionHandler';
import { ProfilePage } from './components/ProfilePage';
import { auth, db, storage } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, deleteDoc, getDocs, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ClipboardDocumentIcon, ArrowPathIcon, ClockIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { Analytics } from "@vercel/analytics/next"
// Placeholder logo
const TA_LOGO_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-full h-full">
    <rect width="200" height="200" rx="40" fill="#0f172a" />
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="bold" fontSize="100" fill="white">TA</text>
  </svg>
);

// Social Media Icons
const ICONS = {
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  X: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  Telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white translate-x-[-1px] translate-y-[1px]">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  Discord: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.772-.6083 1.1588a18.3218 18.3218 0 00-5.4911 0 13.638 13.638 0 00-.6134-1.1588.0775.0775 0 00-.0785-.0371 19.7363 19.7363 0 00-4.8852 1.5151.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561 20.03 20.03 0 005.9937 3.0317.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057 13.111 13.111 0 01-1.872-.8914.0766.0766 0 01.007-.1281c.1191-.0548.2383-.1115.3594-.1618a.0745.0745 0 01.0795.0127 14.815 14.815 0 0011.9606 0 .0738.0738 0 01.0785-.0127c.121.0503.2421.107.3613.1618a.077.077 0 01.007.1281 13.1413 13.1413 0 01-1.872.8914.0779.0779 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286 20.0717 20.0717 0 006.0027-3.0317.077.077 0 00.0322-.0551c.4692-4.6761-.4969-9.2102-3.6496-13.6604a.061.061 0 00-.0321-.0277zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
    </svg>
  ),
  Reddit: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  )
};

interface SocialCardProps {
  platform: string;
  content: string;
  icon: React.ReactNode;
  bgClass: string;
  copyKey: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}

const SocialCard: React.FC<SocialCardProps> = ({ platform, content, icon, bgClass, copyKey, onCopy, copiedKey }) => (
  <div className={`${bgClass} border border-indigo-900/20 rounded-xl p-6 shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl`}>
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-200 tracking-wide">{platform}</span>
      </div>
      <button
        onClick={() => onCopy(content, copyKey)}
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
        title="Copy to clipboard"
      >
        {copiedKey === copyKey ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
      </button>
    </div>
    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-light">{content}</p>
  </div>
);

// Helper to format blog markdown
const formatBlogContent = (markdown: string) => {
  let cleanMd = markdown.replace(/^#\s+(.*)$/m, '').trim();
  const blocks = cleanMd.split(/\n\s*\n/);

  return blocks.map((block, index) => {
    if (block.startsWith('##')) {
      return <h3 key={index} className="text-xl font-bold mt-8 mb-4 text-indigo-200 border-l-4 border-indigo-500 pl-3">{block.replace(/^##\s+/, '')}</h3>;
    }
    if (block.startsWith('###')) {
      return <h4 key={index} className="text-lg font-semibold mt-6 mb-3 text-indigo-300">{block.replace(/^###\s+/, '')}</h4>;
    }
    if (block.trim().startsWith('- ') || block.trim().startsWith('* ')) {
      const items = block.split('\n').map((line, i) => (
        <li key={i} className="mb-2 pl-2 text-slate-300">
          <span className="mr-2 text-indigo-500">•</span>
          <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>') }}></span>
        </li>
      ));
      return <ul key={index} className="my-4 ml-4">{items}</ul>;
    }
    return (
      <p key={index} className="mb-6 leading-relaxed text-slate-300/90 text-lg">
        <span dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>') }} />
      </p>
    );
  });
};

// Helper to convert base64 to blob
const base64ToBlob = (base64: string, mimeType: string) => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Navigation
  const [activeView, setActiveView] = useState<'home' | 'profile'>('home');

  const [idea, setIdea] = useState('');
  const [content, setContent] = useState<ContentPackage | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Branding State
  const [branding, setBranding] = useState<BrandingConfig>({
    logoFile: null,
    url: '',
    position: LogoPosition.BottomRight,
    opacity: 80
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'blog' | 'socials' | 'image'>('blog');
  const [loadingStage, setLoadingStage] = useState<'text' | 'image' | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load History & Branding from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
        if (currentUser.photoURL) setUserProfilePic(currentUser.photoURL);

        // Fetch User Data (Branding)
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            if (userData.branding) {
              setBranding(prev => ({
                ...prev,
                logoUrl: userData.branding?.logoUrl,
                url: userData.branding?.url || '',
                position: userData.branding?.position || LogoPosition.BottomRight,
                opacity: userData.branding?.opacity || 80
              }));
            }
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }

        // Fetch History
        try {
          const q = query(collection(db, `users/${currentUser.uid}/history`), orderBy("timestamp", "desc"));
          const querySnapshot = await getDocs(q);
          const loadedHistory: HistoryItem[] = [];
          querySnapshot.forEach((doc) => {
            loadedHistory.push({ id: doc.id, ...doc.data() } as HistoryItem);
          });
          setHistory(loadedHistory);
        } catch (e) {
          console.error("Error fetching history:", e);
        }

      } else {
        setUser(null);
        setHistory([]);
      }
      setAuthLoading(false);
    });

    // Check for Auth Action (Reset/Verify)
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');
    if (mode && oobCode) {
      // Skip normal auth load if action is present
      setAuthLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (loggedInUser: User, tempProfilePic?: string) => {
    setUser(loggedInUser);
    if (tempProfilePic) setUserProfilePic(tempProfilePic);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfilePic(null);
    setContent(null);
    setGeneratedImageUrl(null);
    setIdea('');
    setHistory([]);
    setActiveView('home');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBranding(prev => ({ ...prev, logoFile: e.target.files![0] }));
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;

    try {
      setLoadingStage('text');
      setGeneratedImageUrl(null);

      const generatedContent = await generateAlchemyContent(idea);
      setContent(generatedContent);

      setLoadingStage('image');
      // This comes back as 'data:image/jpeg;base64,...'
      const base64ImageUrl = await generateAlchemyImage(generatedContent.imagePrompt);
      setGeneratedImageUrl(base64ImageUrl);

      // IMPORTANT: Upload image to Firebase Storage instead of saving base64 to Firestore
      let storageImageUrl = base64ImageUrl;

      if (user) {
        try {
          console.log("Uploading generated image to storage...");
          const imageBlob = base64ToBlob(base64ImageUrl, 'image/jpeg');
          const timestamp = Date.now();
          // Changed to image_generations to match rules
          const imageRef = ref(storage, `image_generations/${user.uid}/${timestamp}.jpg`);

          await uploadBytes(imageRef, imageBlob);
          storageImageUrl = await getDownloadURL(imageRef);
          console.log("Image uploaded to:", storageImageUrl);
        } catch (uploadError) {
          console.error("Failed to upload generated image, falling back to base64 (risk of size limit):", uploadError);
        }
      }

      // Create History Item with the STORAGE URL (or base64 fallback)
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(), // Temporary ID, Firestore will assign real one
        timestamp: Date.now(),
        idea: idea,
        content: generatedContent,
        imageUrl: storageImageUrl
      };

      // Save to Firestore
      if (user) {
        try {
          // Remove ID for creation
          const { id, ...dataToSave } = newHistoryItem;
          const docRef = await addDoc(collection(db, `users/${user.uid}/history`), dataToSave);
          newHistoryItem.id = docRef.id; // Update with real ID
        } catch (e) {
          console.error("Error saving to firestore", e);
          alert("Content generated, but failed to save to history database.");
        }
      }

      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (err) {
      console.error(err);
      alert("The alchemy failed. Please check your API key or try a simpler idea.");
    } finally {
      setLoadingStage(null);
    }
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setContent(item.content);
    setGeneratedImageUrl(item.imageUrl);
    setIdea(item.idea);
    setActiveTab('blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/history`, id));
      } catch (err) {
        console.error("Error deleting history item:", err);
      }
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Auth Action Routes
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const oobCode = urlParams.get('oobCode');
  if (mode && oobCode) {
    return <AuthActionHandler mode={mode} oobCode={oobCode} />;
  }

  if (authLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-500 animate-pulse">Loading Alchemy...</div>;
  }

  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // View: Profile
  if (activeView === 'profile') {
    return (
      <ProfilePage
        user={user}
        onBack={() => setActiveView('home')}
        onBrandingUpdate={(updatedBranding) => setBranding(updatedBranding)}
      />
    );
  }

  // View: Home (App)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0a1a] to-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans">
      <LoadingOverlay stage={loadingStage} />

      {/* Header */}
      <header className="border-b border-indigo-900/30 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => setActiveView('home')}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-indigo-900/20 border border-indigo-800 transition-transform hover:scale-105">
              {TA_LOGO_SVG}
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent tracking-wide">
                Timeline Alchemy
              </h1>
              <p className="text-xs text-indigo-400/80 tracking-widest uppercase">Unified Field Creator</p>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-6">
            <div
              className="flex items-center space-x-4 cursor-pointer group"
              onClick={() => setActiveView('profile')}
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm text-indigo-100 font-serif group-hover:text-white transition-colors">{user.displayName || user.email?.split('@')[0]}</span>
                <span className="text-xs text-indigo-500/60 uppercase tracking-wider">Alchemist</span>
              </div>

              <div className="w-10 h-10 rounded-full bg-slate-800 border border-indigo-500/30 overflow-hidden group-hover:border-indigo-400 transition-colors">
                {userProfilePic ? (
                  <img src={userProfilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-400">
                    <UserCircleIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-red-900/10 rounded-lg"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* LEFT COLUMN: Input, Branding & History */}
        <div className="lg:col-span-4 space-y-8">

          {/* Idea Input */}
          <section className="bg-slate-900/60 border border-indigo-900/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm hover:border-indigo-500/30 transition-colors">
            <h2 className="text-lg font-serif font-semibold text-indigo-200 mb-4 flex items-center">
              <span className="w-1.5 h-6 bg-indigo-500 mr-3 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
              Seed Idea
            </h2>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Enter a fragmented thought to unite. For example: 'The conflict between technology and nature is an illusion...'"
              className="w-full h-40 bg-slate-950/50 border border-indigo-900/50 rounded-xl p-4 text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-600/70"
            />
            <button
              onClick={handleGenerate}
              disabled={!idea || loadingStage !== null}
              className="mt-4 w-full bg-gradient-to-r from-indigo-700 to-purple-800 hover:from-indigo-600 hover:to-purple-700 text-white font-serif font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center group"
            >
              {loadingStage ? 'Transmuting...' : 'Perform Alchemy'}
              {!loadingStage && <ArrowPathIcon className="w-5 h-5 ml-2 group-hover:rotate-180 transition-transform duration-700" />}
            </button>
          </section>

          {/* Branding Settings (Quick Edit) */}
          <section className="bg-slate-900/60 border border-indigo-900/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm hover:border-purple-500/30 transition-colors relative overflow-hidden">
            {/* Edit overlay link */}
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setActiveView('profile')} className="text-xs text-indigo-400 hover:text-white transition-colors">Edit Profile & Branding</button>
            </div>

            <h2 className="text-lg font-serif font-semibold text-indigo-200 mb-4 flex items-center">
              <span className="w-1.5 h-6 bg-purple-500 mr-3 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
              Signature & Seal
            </h2>

            <div className="space-y-5 opacity-80 pointer-events-none select-none grayscale-[0.5]">
              {/* Visual representation of current settings (Read Only here) */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-950 border border-indigo-900/50 rounded-lg flex items-center justify-center overflow-hidden">
                  {branding.logoUrl ? <img src={branding.logoUrl} className="w-full h-full object-contain p-1" /> : <span className="text-[10px] text-slate-600">No Logo</span>}
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-indigo-900/30 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-indigo-900/30 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 italic">Customize your branding in your Profile settings.</p>
            </div>
          </section>

          {/* History Section */}
          {history.length > 0 && (
            <section className="bg-slate-900/60 border border-indigo-900/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm hover:border-blue-500/30 transition-colors">
              <h2 className="text-lg font-serif font-semibold text-indigo-200 mb-4 flex items-center">
                <span className="w-1.5 h-6 bg-blue-500 mr-3 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                Alchemy History
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => restoreHistoryItem(item)}
                    className="group bg-slate-950/40 border border-indigo-900/20 p-3 rounded-lg cursor-pointer hover:bg-indigo-900/20 hover:border-indigo-500/30 transition-all flex justify-between items-start"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-indigo-100 truncate group-hover:text-white transition-colors">
                        {item.content.blogTitle}
                      </h4>
                      <div className="flex items-center text-xs text-slate-500 mt-1 group-hover:text-indigo-300/70">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteHistoryItem(e, item.id)}
                      className="ml-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-8 min-h-[600px]">
          {!content ? (
            <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-indigo-900/30 rounded-3xl p-12 bg-slate-900/20">
              <div className="w-24 h-24 mb-6 opacity-20 text-indigo-500 animate-pulse-slow">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif text-indigo-200 mb-2">Awaiting Input</h3>
              <p className="text-slate-500 max-w-md">Enter your idea to begin the transmutation process. The alchemist is ready.</p>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-indigo-900/40 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col ring-1 ring-white/5">

              {/* Tabs */}
              <div className="flex border-b border-indigo-900/50 bg-slate-950/50 backdrop-blur-sm">
                {(['blog', 'socials', 'image'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-sm font-medium tracking-widest uppercase transition-all relative
                      ${activeTab === tab
                        ? 'text-indigo-300 bg-indigo-950/40 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]'
                        : 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/10'}
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">

                {/* BLOG TAB */}
                {activeTab === 'blog' && (
                  <div className="animate-fadeIn space-y-6">
                    <div className="flex justify-between items-start border-b border-indigo-900/30 pb-6 mb-6">
                      <div>
                        <h2 className="text-3xl font-serif text-indigo-100 leading-tight mb-2 drop-shadow-md">{content.blogTitle}</h2>
                        <p className="text-indigo-400/70 text-sm font-mono">Generated Article • ~{content.blogContent.split(/\s+/).length} Words</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(content.blogContent, 'blog')}
                        className="flex items-center text-xs bg-indigo-950 hover:bg-indigo-900 text-indigo-300 px-4 py-2 rounded-lg transition-colors border border-indigo-800/50 hover:border-indigo-500"
                      >
                        {copiedField === 'blog' ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" /> : <ClipboardDocumentIcon className="w-4 h-4 mr-2" />}
                        {copiedField === 'blog' ? 'Copied' : 'Copy Markdown'}
                      </button>
                    </div>
                    <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-serif prose-p:text-slate-300 prose-p:leading-relaxed prose-headings:text-indigo-200">
                      {formatBlogContent(content.blogContent)}
                    </div>
                  </div>
                )}

                {/* SOCIALS TAB */}
                {activeTab === 'socials' && (
                  <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SocialCard
                        platform="Facebook"
                        content={content.facebookPost}
                        icon={ICONS.Facebook}
                        bgClass="bg-[#18191a]"
                        copyKey="fb"
                        onCopy={copyToClipboard}
                        copiedKey={copiedField}
                      />

                      <SocialCard
                        platform="Instagram"
                        content={content.instagramPost}
                        icon={ICONS.Instagram}
                        bgClass="bg-gradient-to-br from-[#2d1331] to-[#1a1a1a]"
                        copyKey="ig"
                        onCopy={copyToClipboard}
                        copiedKey={copiedField}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <SocialCard
                        platform="X (Twitter)"
                        content={content.twitterPost}
                        icon={ICONS.X}
                        bgClass="bg-black"
                        copyKey="x"
                        onCopy={copyToClipboard}
                        copiedKey={copiedField}
                      />
                    </div>

                    <SocialCard
                      platform="LinkedIn"
                      content={content.linkedinPost}
                      icon={ICONS.LinkedIn}
                      bgClass="bg-[#0A66C2]/20"
                      copyKey="li"
                      onCopy={copyToClipboard}
                      copiedKey={copiedField}
                    />

                    <SocialCard
                      platform="Telegram"
                      content={content.telegramPost}
                      icon={ICONS.Telegram}
                      bgClass="bg-[#26A5E4]/20"
                      copyKey="tg"
                      onCopy={copyToClipboard}
                      copiedKey={copiedField}
                    />

                    <SocialCard
                      platform="Discord"
                      content={content.discordPost}
                      icon={ICONS.Discord}
                      bgClass="bg-[#5865F2]/20"
                      copyKey="dc"
                      onCopy={copyToClipboard}
                      copiedKey={copiedField}
                    />

                    <SocialCard
                      platform="Reddit"
                      content={content.redditPost}
                      icon={ICONS.Reddit}
                      bgClass="bg-[#FF4500]/20"
                      copyKey="rd"
                      onCopy={copyToClipboard}
                      copiedKey={copiedField}
                    />
                  </div>
                )}

                {/* IMAGE TAB */}
                {activeTab === 'image' && (
                  <div className="animate-fadeIn flex flex-col items-center space-y-6 h-full">
                    {generatedImageUrl ? (
                      <div className="w-full max-w-4xl space-y-4">
                        <ImageCompositor
                          baseImageUrl={generatedImageUrl}
                          branding={branding}
                        />
                        <div className="bg-slate-950 p-4 rounded-lg border border-indigo-900/30 text-xs text-indigo-300/60 font-mono shadow-inner">
                          <span className="text-indigo-400 font-bold mr-2">PROMPT:</span> {content.imagePrompt}
                        </div>
                        <div className="text-center text-sm text-indigo-400">
                          <p className="animate-pulse">Right-click the image above to save your Alchemical Creation.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 text-slate-700 mb-4">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-slate-500">No image generated yet.</p>
                        <p className="text-slate-600 text-sm mt-2">Run the alchemy process to visualize your thought.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;