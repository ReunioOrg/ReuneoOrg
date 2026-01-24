import React from 'react';
import './LoadingSpinner.css';

/**
 * Shared loading spinner component
 * 
 * Props:
 * - size: number (default 60) - width/height of spinner in pixels
 * - fullScreen: boolean (default false) - if true, centers spinner on full viewport
 * - message: string (optional) - text to display below the spinner
 * 
 * Usage:
 *   // Inline spinner
 *   <LoadingSpinner size={40} />
 *   
 *   // Full screen centered (for auth loading)
 *   <LoadingSpinner fullScreen />
 *   
 *   // Full screen with message
 *   <LoadingSpinner fullScreen message="Connecting..." />
 */
const LoadingSpinner = ({ size = 60, fullScreen = false, message = null }) => {
    if (fullScreen) {
        return (
            <div className="loading-spinner-fullscreen">
                <div className="loading-spinner-content">
                    <div className="loading-spinner" style={{ width: size, height: size }}>
                        <div className="loading-spinner-inner"></div>
                    </div>
                    {message && <p className="loading-spinner-message">{message}</p>}
                </div>
            </div>
        );
    }
    
    return (
        <div className="loading-spinner-wrapper">
            <div className="loading-spinner" style={{ width: size, height: size }}>
                <div className="loading-spinner-inner"></div>
            </div>
            {message && <p className="loading-spinner-message">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
