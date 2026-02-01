// show_match_animation.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './show_match_animation.css';

// Generate particles that converge to center
const generateParticles = (count) => {
    return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 300 + Math.random() * 200;
        return {
            id: i,
            startX: Math.cos(angle) * distance,
            startY: Math.sin(angle) * distance,
            delay: Math.random() * 0.5,
            duration: 0.8 + Math.random() * 0.4,
            size: 4 + Math.random() * 6
        };
    });
};

// Generate falling stars
const generateStars = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 1 + Math.random() * 1,
        size: 2 + Math.random() * 3
    }));
};

const ShowMatchAnimation = ({ isVisible, onAnimationEnd }) => {
    const [active, setActive] = useState(false);
    const [showText, setShowText] = useState(false);
    const timerRef = useRef(null);
    
    const particles = useMemo(() => generateParticles(30), []);
    const stars = useMemo(() => generateStars(20), []);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (isVisible) {
            setActive(true);
            setShowText(false);
            
            // Show text after particles converge
            setTimeout(() => setShowText(true), 600);

            timerRef.current = setTimeout(() => {
                setActive(false);
                setShowText(false);
                if (onAnimationEnd) {
                    onAnimationEnd();
                }
            }, 3500);
        } else {
            setActive(false);
            setShowText(false);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isVisible, onAnimationEnd]);

    return (
        <AnimatePresence>
            {active && (
                <motion.div 
                    className="match-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Dark background with radial spotlight */}
                    <div className="match-spotlight-bg" />
                    
                    {/* Animated spotlight rays */}
                    <div className="spotlight-rays">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="ray"
                                style={{ 
                                    transform: `rotate(${i * 45}deg)`,
                                }}
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 0.15, scaleY: 1 }}
                                transition={{ 
                                    delay: 0.3 + i * 0.05,
                                    duration: 0.6,
                                    ease: "easeOut"
                                }}
                            />
                        ))}
                    </div>

                    {/* Converging particles */}
                    <div className="particles-container">
                        {particles.map((particle) => (
                            <motion.div
                                key={particle.id}
                                className="converge-particle"
                                style={{ width: particle.size, height: particle.size }}
                                initial={{ 
                                    x: particle.startX, 
                                    y: particle.startY,
                                    opacity: 0,
                                    scale: 0
                                }}
                                animate={{ 
                                    x: 0, 
                                    y: 0,
                                    opacity: [0, 1, 1, 0],
                                    scale: [0, 1.5, 1, 0]
                                }}
                                transition={{
                                    duration: particle.duration,
                                    delay: particle.delay,
                                    ease: [0.25, 0.1, 0.25, 1]
                                }}
                            />
                        ))}
                    </div>

                    {/* Central burst when particles arrive */}
                    <motion.div
                        className="central-burst"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                            scale: [0, 1.5, 1],
                            opacity: [0, 1, 0.8]
                        }}
                        transition={{ 
                            delay: 0.5,
                            duration: 0.6,
                            ease: "easeOut"
                        }}
                    />

                    {/* Falling stars background */}
                    <div className="falling-stars">
                        {stars.map((star) => (
                            <motion.div
                                key={star.id}
                                className="falling-star"
                                style={{ 
                                    left: `${star.left}%`,
                                    width: star.size,
                                    height: star.size
                                }}
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ 
                                    y: [null, window.innerHeight + 20],
                                    opacity: [0, 1, 1, 0]
                                }}
                                transition={{
                                    duration: star.duration,
                                    delay: star.delay,
                                    repeat: 1,
                                    ease: "linear"
                                }}
                            />
                        ))}
                    </div>

                    {/* Main text with neon glow */}
                    <AnimatePresence>
                        {showText && (
                            <motion.div 
                                className="match-text-container"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.2, opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20
                                }}
                            >
                                <motion.div 
                                    className="match-text-glow"
                                    animate={{ 
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    It's a Match!
                                </motion.div>
                                <div className="match-text">
                                    It's a Match!
                                </div>
                                <motion.div 
                                    className="match-subtext"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.4 }}
                                >
                                    Get ready to connect
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Ring pulse on text appear */}
                    {showText && (
                        <motion.div
                            className="ring-pulse"
                            initial={{ scale: 0.2, opacity: 1 }}
                            animate={{ scale: 3, opacity: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ShowMatchAnimation;
