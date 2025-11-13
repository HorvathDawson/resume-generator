import React from 'react';

export interface FooterConfig {
  type: 'none' | 'mountains' | 'fish' | 'minimal' | 'modern';
  height: string;
  backgroundColor?: string;
  textColor?: string;
}

interface FooterProps {
  config: FooterConfig;
}

const MountainsFooter = () => (
  <div className="footer-mountains">
    <div className="mountains-container">
      <div className="mountain mountain-1"></div>
      <div className="mountain mountain-2"></div>
      <div className="mountain mountain-3"></div>
      <div className="mountain mountain-4"></div>
      <div className="mountain mountain-5"></div>
    </div>
  </div>
);

const FishFooter = () => (
  <div className="footer-fish">
    <svg width="100%" height="100%" viewBox="0 0 800 160" preserveAspectRatio="none">
      {/* Fish 1 (larger, on the left) */}
      <g className="fish fish-1" transform="translate(150, 40)">
        {/* Fish body */}
        <ellipse cx="40" cy="30" rx="35" ry="20" fill="#2c5aa0"/>
        {/* Fish tail */}
        <polygon points="0,30 15,15 15,45" fill="#2c5aa0"/>
        {/* Fish eye */}
        <circle cx="55" cy="25" r="3" fill="white"/>
        <circle cx="57" cy="23" r="1.5" fill="#2c5aa0"/>
      </g>
      
      {/* Fish 2 (smaller, swimming right) */}
      <g className="fish fish-2" transform="translate(550, 80)">
        <ellipse cx="25" cy="20" rx="20" ry="12" fill="#2c5aa0"/>
        <polygon points="0,20 8,10 8,30" fill="#2c5aa0"/>
        <circle cx="35" cy="16" r="2" fill="white"/>
        <circle cx="36" cy="15" r="1" fill="#2c5aa0"/>
      </g>
      
      {/* Waves at bottom */}
      <path d="M0,120 Q200,100 400,120 T800,120 L800,160 L0,160 Z" fill="#e3f2fd" opacity="0.3"/>
    </svg>
  </div>
);

const MinimalFooter = () => (
  <div className="footer-minimal">
    <div className="minimal-line"></div>
  </div>
);

const ModernFooter = () => (
  <div className="footer-modern">
    <div className="modern-pattern">
      <div className="modern-accent"></div>
    </div>
  </div>
);

export const Footer: React.FC<FooterProps> = ({ config }) => {
  if (config.type === 'none') return null;

  return (
    <footer 
      className={`page-footer footer-${config.type}`}
      style={{ 
        height: config.height,
        backgroundColor: config.backgroundColor || '#ffffff',
        color: config.textColor || '#333333'
      }}
    >
      {config.type === 'mountains' && <MountainsFooter />}
      {config.type === 'fish' && <FishFooter />}
      {config.type === 'minimal' && <MinimalFooter />}
      {config.type === 'modern' && <ModernFooter />}
    </footer>
  );
};
