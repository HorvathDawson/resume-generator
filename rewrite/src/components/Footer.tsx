import React from 'react';

export interface FooterConfig {
  type: 'none' | 'default' | 'mountains' | 'fish' | 'minimal' | 'modern';
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
    <svg width="100%" height="100%" viewBox="0 0 21 4.25" preserveAspectRatio="none">
      {/* Water background gradient */}
      <defs>
        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0f8ff" />
          <stop offset="100%" stopColor="#e6f3ff" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#waterGradient)" />
      
      {/* Fish 1 (larger, on the left) */}
      <g className="fish fish-1">
        {/* Fish body */}
        <ellipse cx="4" cy="2" rx="1.2" ry="0.6" fill="var(--primary-color, #2c5aa0)"/>
        {/* Fish tail */}
        <polygon points="2.5,2 3.2,1.5 3.2,2.5" fill="var(--primary-color, #2c5aa0)"/>
        {/* Fish eye */}
        <circle cx="4.8" cy="1.8" r="0.1" fill="white"/>
        <circle cx="4.85" cy="1.75" r="0.05" fill="var(--primary-color, #2c5aa0)"/>
      </g>
      
      {/* Fish 2 (smaller, swimming right) */}
      <g className="fish fish-2">
        <ellipse cx="15" cy="3" rx="0.8" ry="0.4" fill="var(--primary-color, #2c5aa0)"/>
        <polygon points="13.8,3 14.3,2.7 14.3,3.3" fill="var(--primary-color, #2c5aa0)"/>
        <circle cx="15.6" cy="2.9" r="0.07" fill="white"/>
        <circle cx="15.65" cy="2.85" r="0.035" fill="var(--primary-color, #2c5aa0)"/>
      </g>
      
      {/* Small fish 3 */}
      <g className="fish fish-3">
        <ellipse cx="8" cy="1.5" rx="0.5" ry="0.25" fill="var(--primary-color, #2c5aa0)" opacity="0.7"/>
        <polygon points="7.3,1.5 7.6,1.3 7.6,1.7" fill="var(--primary-color, #2c5aa0)" opacity="0.7"/>
      </g>
      
      {/* Bubbles */}
      <g className="bubbles">
        <circle cx="6" cy="1.8" r="0.08" fill="white" opacity="0.6"/>
        <circle cx="6.5" cy="1.3" r="0.05" fill="white" opacity="0.4"/>
        <circle cx="7" cy="0.8" r="0.06" fill="white" opacity="0.5"/>
        <circle cx="12" cy="2.2" r="0.04" fill="white" opacity="0.3"/>
        <circle cx="13" cy="1.8" r="0.07" fill="white" opacity="0.5"/>
      </g>
      
      {/* Water waves at bottom */}
      <path d="M0,3.5 Q5.25,3.2 10.5,3.5 T21,3.5 L21,4.25 L0,4.25 Z" fill="#e3f2fd" opacity="0.4"/>
    </svg>
  </div>
);

const MinimalFooter = () => (
  <div className="footer-minimal">
    <div className="footer-simple">
      <div className="footer-dot"></div>
    </div>
  </div>
);

const ModernFooter = () => (
  <div className="footer-modern">
    <div className="footer-content">
      <div className="footer-line"></div>
      <div className="footer-text">
        <span className="footer-accent">•</span>
        <span className="footer-message">Professional Portfolio</span>
        <span className="footer-accent">•</span>
      </div>
      <div className="footer-gradient"></div>
    </div>
  </div>
);

const DefaultFooter = () => (
  <div className="footer-default">
    <div className="foot-back"></div>
    <div className="foot-front">
      <div className="left"></div>
      <div className="right"></div>
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
        backgroundColor: config.backgroundColor || 'transparent',
        color: config.textColor || '#333333'
      }}
    >
      {config.type === 'default' && <DefaultFooter />}
      {config.type === 'mountains' && <MountainsFooter />}
      {config.type === 'fish' && <FishFooter />}
      {config.type === 'minimal' && <MinimalFooter />}
      {config.type === 'modern' && <ModernFooter />}
    </footer>
  );
};
