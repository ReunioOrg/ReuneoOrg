import React, { useEffect, useState, useRef } from 'react';
import './user_is_ready_animation.css';

const UserIsReadyAnimation = ({ isVisible, onAnimationEnd }) => {
    const [active, setActive] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (isVisible) {    
            setActive(true);

            timerRef.current = setTimeout(() => {
                setActive(false);
                if (onAnimationEnd) {
                    onAnimationEnd();
                }
            }, 1800);
        } else {
            setActive(false);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isVisible, onAnimationEnd]);

    if (!active) return null;

    return (
        <div className="ready-overlay">
            <div className="confetti-container">
                {/* First burst */}
                {[...Array(50)].map((_, i) => (
                    <div 
                        key={`first-${i}`} 
                        className={`confetti confetti-${i % 5}`}
                        style={{
                            '--rand-x': Math.random(),
                            '--rand-y': Math.random(),
                            '--rand-rotation': Math.random() * 720,
                            '--rand-delay': Math.random() * 0.2
                        }}
                    />
                ))}
                {/* Second burst */}
                {[...Array(50)].map((_, i) => (
                    <div 
                        key={`second-${i}`} 
                        className={`confetti confetti-${i % 5}`}
                        style={{
                            '--rand-x': Math.random(),
                            '--rand-y': Math.random(),
                            '--rand-rotation': Math.random() * 720,
                            '--rand-delay': `${0.6 + Math.random() * 0.2}s`
                        }}
                    />
                ))}
            </div>
            <div className="ready-text">You're ready!</div>
        </div>
    );
};

export default UserIsReadyAnimation;
