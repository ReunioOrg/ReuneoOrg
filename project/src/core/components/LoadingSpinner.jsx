import React from 'react';
import './LoadingSpinner.css';

/**
 * Shared loading spinner component
 * 
 * Props:
 * - size: number (default 60) - width/height of spinner in pixels
 * - fullScreen: boolean (default false) - if true, centers spinner on full viewport
 * 
 * Usage:
 *   // Inline spinner
 *   <LoadingSpinner size={40} />
 *   
 *   // Full screen centered (for auth loading)
 *   <LoadingSpinner fullScreen />
 */
const LoadingSpinner = ({ size = 60, fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="loading-spinner-fullscreen">
                <div className="loading-spinner" style={{ width: size, height: size }}>
                    <div className="loading-spinner-inner"></div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="loading-spinner" style={{ width: size, height: size }}>
            <div className="loading-spinner-inner"></div>
        </div>
    );
};

export default LoadingSpinner;
