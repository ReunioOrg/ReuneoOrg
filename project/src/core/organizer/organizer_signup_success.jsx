import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './organizer_signup_success.css';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../Auth/AuthContext';
import UserIsReadyAnimation from '../lobby/user_is_ready_animation';
import LoadingSpinner from '../components/LoadingSpinner';

const OrganizerSignupSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth } = useContext(AuthContext);

    // "verifying" -> "animation" -> "check-email" (or "done" for upgrades)
    const [phase, setPhase] = useState('verifying');
    const [email, setEmail] = useState('');
    const [lobbyData, setLobbyData] = useState(null);
    const [error, setError] = useState('');
    const [isUpgradeResult, setIsUpgradeResult] = useState(false);
    const [isFreeTrial, setIsFreeTrial] = useState(false);
    const [addedActivations, setAddedActivations] = useState(null);
    const [upgradeLobbyCode, setUpgradeLobbyCode] = useState(null);

    const timerRef = useRef(null);

    // Phase 1: verify payment on mount (or skip for free trial)
    useEffect(() => {
        // Free trial path: skip Stripe verification entirely
        if (location.state?.freeTrial) {
            setIsFreeTrial(true);
            setEmail(location.state.email || '');
            setLobbyData(location.state.lobbyData || null);
            setPhase('animation');
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            setError('Missing session ID. Please try your purchase again.');
            return;
        }

        const verify = async () => {
            try {
                const res = await apiFetch(`/plan-checkout-success?session_id=${encodeURIComponent(sessionId)}`);
                const data = await res.json();

                if (!res.ok || data.error) {
                    setError(data.error || 'Payment verification failed.');
                    return;
                }

                setEmail(data.email || '');
                setLobbyData(data.lobby_data || null);

                if (data.upgrade) {
                    setIsUpgradeResult(true);
                    if (data.added_activations) {
                        setAddedActivations(data.added_activations);
                    }
                    if (data.lobby_code) {
                        setUpgradeLobbyCode(data.lobby_code);
                    }
                }

                await checkAuth();
                setPhase('animation');
            } catch (err) {
                console.error('Payment verification error:', err);
                setError('Failed to verify payment. Please try again.');
            }
        };

        verify();
    }, [location.search]);

    // Phase 3: timer during "check-email" (5s for free trial, 30s for paid)
    useEffect(() => {
        if (phase !== 'check-email') return;

        const delay = isFreeTrial ? 5000 : 30000;
        timerRef.current = setTimeout(() => {
            navigate('/create_lobby', { state: { lobbyData } });
        }, delay);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, navigate, lobbyData]);

    const handleAnimationEnd = () => {
        if (isUpgradeResult) {
            if (upgradeLobbyCode) {
                navigate(`/admin_lobby_view?code=${upgradeLobbyCode}`);
            } else {
                navigate('/organizer-account-details');
            }
            return;
        }
        setPhase('check-email');
    };

    // Error state
    if (error) {
        return (
            <div className="oss-container">
                <div className="oss-error-card">
                    <div className="oss-error-icon">!</div>
                    <h2 className="oss-error-title">Something went wrong</h2>
                    <p className="oss-error-message">{error}</p>
                    <button
                        className="oss-error-button"
                        onClick={() => navigate('/plan-selection')}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Phase 1: verifying
    if (phase === 'verifying') {
        return (
            <div className="oss-container">
                <LoadingSpinner size={50} message="Verifying your payment..." />
            </div>
        );
    }

    // Phase 2: success animation
    if (phase === 'animation') {
        const mainText = isFreeTrial
            ? 'You\'re all set!'
            : isUpgradeResult ? 'Plan updated!' : 'Payment successful!';
        const subText = isFreeTrial
            ? 'Welcome to Reuneo!'
            : addedActivations
                ? `Added ${addedActivations} activation${addedActivations === 1 ? '' : 's'} to your plan!`
                : isUpgradeResult
                    ? (upgradeLobbyCode ? 'Redirecting to your lobby...' : 'Redirecting to your account...')
                    : 'Welcome to Reuneo!';

        return (
            <UserIsReadyAnimation
                isVisible={true}
                mainText={mainText}
                subText={subText}
                onAnimationEnd={handleAnimationEnd}
            />
        );
    }

    // Phase 3: check email
    return (
        <div className="oss-container">
            <AnimatePresence>
                <motion.div
                    className="oss-check-email"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="oss-header">
                        Check all your inboxes:
                    </h1>
                    <p className="oss-email">{email}</p>
                    <p className="oss-subheader">You're almost done!</p>

                    <div className="oss-spinner-area">
                        <LoadingSpinner size={50} />
                        <p className="oss-spinner-text">
                            We sent a verification email to set your password
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default OrganizerSignupSuccess;
