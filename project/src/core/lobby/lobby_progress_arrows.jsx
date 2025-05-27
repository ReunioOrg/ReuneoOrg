import React from 'react';
import './lobby_progress_arrows.css';

const ArrowHint = ({ direction = 'down', show = true, className = '', style = {} }) => {
    if (!show) return null;
    // SVG arrow points up by default, rotate for down
    const rotation = direction === 'down' ? 'rotate(180 16 16)' : '';
    return (
        <div className={`arrow-hint-container ${direction} ${className}`} style={style}>
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="arrow-hint-svg"
            >
                <g transform={rotation}>
                    <path
                        d="M16 6v16M16 22l-7-7M16 22l7-7"
                        stroke="url(#arrow-gradient)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#arrow-glow)"
                    />
                    <defs>
                        <linearGradient id="arrow-gradient" x1="16" y1="6" x2="16" y2="22" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#7f5fff" />
                            <stop offset="0.5" stopColor="#2e8bff" />
                            <stop offset="1" stopColor="#00e0ff" />
                        </linearGradient>
                        <filter id="arrow-glow" x="-10" y="-10" width="52" height="52" filterUnits="userSpaceOnUse">
                            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#7f5fff" floodOpacity="0.5" />
                        </filter>
                    </defs>
                </g>
            </svg>
            <div className="arrow-hint-text">Tap Here</div>
        </div>
    );
};

export default ArrowHint; 