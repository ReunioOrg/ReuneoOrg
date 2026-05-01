import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminSettingsDropdown.css';

const AdminSettingsDropdown = ({ onTutorial, onPlanDetails, onEditLobby, onJoinLobby, showPlanDetails }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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

    const handle = (fn) => {
        setIsOpen(false);
        fn();
    };

    return (
        <div className="admin-settings-dropdown" ref={dropdownRef}>
            <button
                className={`admin-settings-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="Settings"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <svg
                    className={`admin-settings-chevron ${isOpen ? 'rotated' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                >
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="admin-settings-menu"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {/* Tutorial */}
                        <button className="admin-settings-item" onClick={() => handle(onTutorial)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Tutorial</span>
                        </button>

                        {showPlanDetails && (
                            <>
                                <div className="admin-settings-divider" />
                                <button className="admin-settings-item" onClick={() => handle(onPlanDetails)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="1" x2="12" y2="23"/>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                    </svg>
                                    <span>Plan Details</span>
                                </button>
                            </>
                        )}

                        <div className="admin-settings-divider" />

                        {/* Edit Lobby */}
                        <button className="admin-settings-item" onClick={() => handle(onEditLobby)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span>Edit Lobby</span>
                        </button>

                        <div className="admin-settings-divider" />

                        {/* Join Lobby */}
                        <button className="admin-settings-item" onClick={() => handle(onJoinLobby)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14"/>
                                <path d="M5 12l7 7 7-7"/>
                            </svg>
                            <span>Join Lobby</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSettingsDropdown;
