import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ProfileDropdown.css';

const ProfileDropdown = ({ onProfileClick, onTutorialClick, userImage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const handleProfileClick = () => {
        setIsOpen(false);
        onProfileClick();
    };

    const handleTutorialClick = () => {
        setIsOpen(false);
        onTutorialClick();
    };

    return (
        <div className="profile-dropdown-container" ref={dropdownRef}>
            {/* Main Button */}
            <button 
                className={`profile-dropdown-button ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="profile-dropdown-avatar">
                    <img 
                        src={userImage || '/assets/avatar_3.png'} 
                        alt="Profile" 
                    />
                </div>
                <span className="profile-dropdown-text">Profile</span>
                <svg 
                    className={`profile-dropdown-chevron ${isOpen ? 'rotated' : ''}`}
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none"
                >
                    <path 
                        d="M2.5 4.5L6 8L9.5 4.5" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="profile-dropdown-menu"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ 
                            duration: 0.15, 
                            ease: [0.4, 0, 0.2, 1] 
                        }}
                    >
                        {/* Profile Option */}
                        <button 
                            className="profile-dropdown-item profile-dropdown-item--primary"
                            onClick={handleProfileClick}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                                <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span>Edit Profile</span>
                        </button>

                        {/* Divider */}
                        <div className="profile-dropdown-divider" />

                        {/* Tutorial Option */}
                        <button 
                            className="profile-dropdown-item"
                            onClick={handleTutorialClick}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Tutorial</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileDropdown;
