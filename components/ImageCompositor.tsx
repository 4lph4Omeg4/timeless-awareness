import React from 'react';
import { BrandingConfig, LogoPosition } from '../types';

interface ImageCompositorProps {
  baseImageUrl: string;
  branding: BrandingConfig;
  className?: string;
}

const ImageCompositor: React.FC<ImageCompositorProps> = ({ baseImageUrl, branding, className }) => {
  // Determine position classes based on configuration
  const getPositionClasses = () => {
    switch (branding.position) {
      case LogoPosition.BottomLeft:
        return 'bottom-8 left-8 items-start';
      case LogoPosition.BottomRight:
      default:
        return 'bottom-8 right-8 items-end';
    }
  };

  // Safe opacity value
  const opacityValue = (branding.opacity ?? 80) / 100;

  return (
    <div className={`relative w-full aspect-video rounded-lg overflow-hidden shadow-2xl border border-indigo-900/50 group ${className}`}>
      {/* Base Image - Rendered as standard IMG to avoid CORS/Canvas taint issues */}
      <img 
        src={baseImageUrl} 
        alt="Alchemical Creation" 
        className="w-full h-full object-cover"
        crossOrigin="anonymous" 
      />

      {/* Branding Overlay */}
      <div 
        className={`absolute ${getPositionClasses()} flex flex-col pointer-events-none transition-opacity duration-300`}
        style={{ opacity: opacityValue }}
      >
        {/* Logo Layer */}
        {(branding.logoFile || branding.logoUrl) && (
          <div className="mb-2">
            {branding.logoFile ? (
              <img 
                src={URL.createObjectURL(branding.logoFile)} 
                alt="Brand Logo" 
                className="max-h-24 max-w-[150px] object-contain drop-shadow-lg"
              />
            ) : branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt="Brand Logo" 
                className="max-h-24 max-w-[150px] object-contain drop-shadow-lg"
              />
            ) : null}
          </div>
        )}

        {/* Text Layer (URL) */}
        {branding.url && (
          <p 
            className="text-white font-sans font-bold text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wide"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            {branding.url}
          </p>
        )}
      </div>

      {/* Hover Info */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white border border-white/20">
        Right-click to Save Image
      </div>
    </div>
  );
};

export default ImageCompositor;