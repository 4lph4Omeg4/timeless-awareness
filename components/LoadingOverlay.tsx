import React from 'react';

interface LoadingOverlayProps {
  stage: 'text' | 'image' | null;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ stage }) => {
  if (!stage) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
        <div className="absolute inset-0 border-4 border-t-purple-500 border-r-indigo-500 border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-4 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
           <span className="text-2xl font-serif font-bold text-white">TA</span>
        </div>
      </div>
      
      <h2 className="text-2xl font-serif text-indigo-100 mb-2">
        {stage === 'text' ? 'Transmuting Thought into Word...' : 'Manifesting Visual Reality...'}
      </h2>
      <p className="text-indigo-300/70 text-sm font-light animate-pulse">
        Accessing the unified field
      </p>
    </div>
  );
};