import React from 'react';

interface LoadingOverlayProps {
  show: boolean;
  iconSrc?: string; // default to '/image.png'
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, iconSrc = '/image.png' }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <img src={iconSrc} alt="loading" className="w-12 h-12 object-contain opacity-90" />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;

