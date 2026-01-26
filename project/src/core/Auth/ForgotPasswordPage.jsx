import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/api';
import './ForgotPasswordPage.css';

/**
 * ForgotPasswordPage - Request a password reset email
 * 
 * Flow:
 * 1. User enters email
 * 2. Toast appears on first keystroke warning to double-check email
 * 3. User clicks Submit
 * 4. Modal appears saying "Check Your Inbox"
 * 5. User clicks "Got it" to stay on page (can try another email)
 */
const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [hasShownToast, setHasShownToast] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [error, setError] = useState('');

    const handleEmailChange = (e) => {
        const value = e.target.value.toLowerCase();
        setEmail(value);
        setError(''); // Clear any previous error
        
        // Show toast on first keystroke (with 300ms delay for smooth appearance)
        if (!hasShownToast && value.length > 0) {
            setHasShownToast(true);
            setTimeout(() => setShowToast(true), 300);
            
            // Auto-hide toast after 4 seconds
            setTimeout(() => setShowToast(false), 4300);
        }
    };

    const validateEmail = (email) => {
        return email && email.includes('@') && email.includes('.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await apiFetch('/auth/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim() })
            });

            const data = await response.json();

            if (data.success) {
                // Show success modal
                setShowModal(true);
            } else {
                // Rate limit or other error
                setError(data.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            console.error('Password reset request error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        // Reset form so user can try another email if needed
        setEmail('');
        setHasShownToast(false);
    };

    return (
        <div className="forgot-password-container">
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            <h3 className="forgot-password-header">
                Reset Your Password
            </h3>
            
            <p className="forgot-password-subtitle">
                Enter your email and we'll send you a reset link
            </p>

            <div className="step-form-container">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div style={{ marginTop: '0' }}>
                        <label className="step-label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Enter your email"
                            className="step-input"
                            autoFocus
                            autoComplete="email"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="primary-button"
                        disabled={isSubmitting || !email}
                        style={{ marginTop: '30px' }}
                    >
                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <button 
                    type="button"
                    onClick={() => navigate('/login')}
                    className="back-to-login-link"
                >
                    Back to Login
                </button>
            </div>

            {/* Toast Warning */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        className="email-toast"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        Double-check your email address is correct before submitting.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="reset-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleModalClose}
                    >
                        <motion.div
                            className="reset-modal-content"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ 
                                type: "spring",
                                stiffness: 400,
                                damping: 25
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="reset-modal-header">
                                📬 Check Your Inbox
                            </h2>
                            <p className="reset-modal-subtext">
                                If an account exists with this email, we've sent a password reset link. Check your inbox and spam folder.
                            </p>
                            <button
                                type="button"
                                className="reset-modal-button"
                                onClick={handleModalClose}
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ForgotPasswordPage;
