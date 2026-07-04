import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './user_is_ready_animation.css';

const circleTransition = {
    duration: 0.5,
    delay: 0.2,
    ease: 'easeOut',
};

const pulseTransition = {
    duration: 0.8,
    delay: 0.9,
    ease: 'easeOut',
};

const CheckmarkIcon = () => (
    <div className="checkmark-container">
        <svg className="checkmark-svg" viewBox="0 0 100 100">
            <motion.circle
                className="checkmark-circle"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={circleTransition}
            />
            <motion.path
                className="checkmark-check"
                d="M30 50 L45 65 L70 35"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    duration: 0.4,
                    delay: 0.6,
                    ease: 'easeOut',
                }}
            />
        </svg>
        <motion.div
            className="success-pulse"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={pulseTransition}
        />
    </div>
);

const FastForwardIcon = () => (
    <div className="checkmark-container">
        <svg className="checkmark-svg" viewBox="0 0 100 100">
            <motion.circle
                className="checkmark-circle"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={circleTransition}
            />
            <motion.path
                className="fast-forward-icon-stroke"
                d="M26 32 L26 68"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    duration: 0.25,
                    delay: 0.55,
                    ease: 'easeOut',
                }}
            />
            <motion.path
                className="fast-forward-icon-stroke"
                d="M38 32 L56 50 L38 68"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    duration: 0.3,
                    delay: 0.62,
                    ease: 'easeOut',
                }}
            />
            <motion.path
                className="fast-forward-icon-stroke"
                d="M58 32 L76 50 L58 68"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    duration: 0.3,
                    delay: 0.72,
                    ease: 'easeOut',
                }}
            />
        </svg>
        <motion.div
            className="success-pulse"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={pulseTransition}
        />
    </div>
);

const HostReturnIcon = () => (
    <div className="checkmark-container">
        <svg className="checkmark-svg" viewBox="0 0 100 100">
            <motion.circle
                className="checkmark-circle"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={circleTransition}
            />
            <motion.path
                className="host-return-icon-stroke"
                d="M34 34 H46 V46 H34 Z"
                fill="none"
                strokeWidth="4"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.22, delay: 0.55, ease: 'easeOut' }}
            />
            <motion.path
                className="host-return-icon-stroke"
                d="M54 34 H66 V46 H54 Z"
                fill="none"
                strokeWidth="4"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.22, delay: 0.62, ease: 'easeOut' }}
            />
            <motion.path
                className="host-return-icon-stroke"
                d="M34 54 H46 V66 H34 Z"
                fill="none"
                strokeWidth="4"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.22, delay: 0.69, ease: 'easeOut' }}
            />
            <motion.path
                className="host-return-icon-stroke"
                d="M54 54 H66 V66 H54 Z"
                fill="none"
                strokeWidth="4"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.22, delay: 0.76, ease: 'easeOut' }}
            />
        </svg>
        <motion.div
            className="success-pulse"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={pulseTransition}
        />
    </div>
);

const UserIsReadyAnimation = ({
    isVisible,
    onAnimationEnd,
    mainText = "You're ready!",
    subText = "You will be paired up soon.",
    duration = 2200,
    variant = 'checkmark',
}) => {
    const [active, setActive] = useState(false);
    const timerRef = useRef(null);
    const callbackRef = useRef(onAnimationEnd);
    callbackRef.current = onAnimationEnd;

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (isVisible) {
            setActive(true);

            timerRef.current = setTimeout(() => {
                setActive(false);
                callbackRef.current?.();
            }, duration);
        } else {
            setActive(false);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isVisible, duration]);

    const renderIcon = () => {
        if (variant === 'fastForward') return <FastForwardIcon />;
        if (variant === 'hostReturn') return <HostReturnIcon />;
        return <CheckmarkIcon />;
    };

    const useWideSubtext = variant === 'fastForward' || variant === 'hostReturn';

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    className="ready-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="ready-backdrop" />

                    <motion.div
                        className="ready-card"
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -10 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                            delay: 0.1,
                        }}
                    >
                        {renderIcon()}

                        <motion.div
                            className="ready-text"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.3 }}
                        >
                            {mainText}
                        </motion.div>

                        <motion.div
                            className={`ready-subtext${useWideSubtext ? ' ready-subtext-wide' : ''}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.3 }}
                        >
                            {subText}
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UserIsReadyAnimation;
