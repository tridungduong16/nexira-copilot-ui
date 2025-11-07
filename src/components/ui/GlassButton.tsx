import React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Reusable glassy button with gradient overlay and animated shine, matching the Explore Now style.
 */
const GlassButton: React.FC<GlassButtonProps> = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={[
        'relative group overflow-hidden',
        'bg-white/20 backdrop-blur-md border border-white/0',
        'transition-all duration-300 ease-out-smooth',
        'hover:bg-white/30 hover:border-white/20 hover:shadow-lg hover:scale-[1.02]',
        'active:scale-[0.98]',
        className,
      ].join(' ')}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: 'inherit' }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent"
          style={{ borderRadius: 'inherit' }}
        />
        {/* Shine */}
        <div
          className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ borderRadius: 'inherit' }}
        />
      </div>

      {/* Content */}
      <span className="relative z-10">
        {children}
      </span>
    </button>
  );
};

export default GlassButton;

