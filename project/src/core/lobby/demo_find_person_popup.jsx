import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './user_is_ready_animation.css';
import './demo_find_person_popup.css';

const PersonIcon = ({ color = '#3b82f6' }) => (
    <svg viewBox="0 0 32 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="10" r="9" fill={color} />
        <rect x="5" y="26" width="22" height="48" rx="11" fill={color} />
    </svg>
);

const GreetingPhone = ({ imageSrc, fallbackSrc = '/assets/avatar_3.png' }) => (
    <div className="dfp-phone">
        <div className="dfp-phone-speaker" />
        <div className="dfp-phone-screen">
            <img src={imageSrc || fallbackSrc} alt="" className="dfp-phone-photo" />
        </div>
        <div className="dfp-phone-home" />
    </div>
);

const GreetingConfetti = () => (
    <div className="dfp-confetti-burst">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <span key={n} className={`dfp-conf dfp-c${n}`} />
        ))}
    </div>
);

export const getFirstName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return null;
    const trimmed = fullName.trim();
    if (!trimmed) return null;
    return trimmed.split(/\s+/)[0];
};

export const formatNiceToMeetYou = (fullName) => {
    const first = getFirstName(fullName);
    return first ? `Nice to meet you, ${first}!` : 'Nice to meet you!';
};

const HOP_DURATION_MS = 1875;
const GREET_DELAY_AFTER_PHONES_MS = 313;
const POPUP_DURATION_MS = 6000;

const PairGreetingAnimation = ({ organizerGreeting, opponentGreeting, organizerPhoto, opponentPhoto, active }) => {
    const [showPhones, setShowPhones] = useState(false);
    const [showGreet, setShowGreet] = useState(false);

    useEffect(() => {
        if (!active) {
            setShowPhones(false);
            setShowGreet(false);
            return;
        }

        const phoneTimer = setTimeout(() => setShowPhones(true), HOP_DURATION_MS);
        const greetTimer = setTimeout(
            () => setShowGreet(true),
            HOP_DURATION_MS + GREET_DELAY_AFTER_PHONES_MS
        );

        return () => {
            clearTimeout(phoneTimer);
            clearTimeout(greetTimer);
        };
    }, [active]);

    return (
        <div className="dfp-greeting-stage">
            <div className="dfp-person dfp-person-left">
                <div className="dfp-person-hop">
                    <PersonIcon />
                </div>
            </div>
            <div className="dfp-person dfp-person-right">
                <div className="dfp-person-hop">
                    <PersonIcon />
                </div>
            </div>
            {showPhones && (
                <>
                    <div className="dfp-float-phone dfp-float-left dfp-float-snug">
                        <div className="dfp-float-pop">
                            <GreetingPhone imageSrc={organizerPhoto} />
                        </div>
                    </div>
                    <div className="dfp-float-phone dfp-float-right dfp-float-snug">
                        <div className="dfp-float-pop">
                            <GreetingPhone imageSrc={opponentPhoto} />
                        </div>
                    </div>
                </>
            )}
            {showGreet && (
                <>
                    <div className="dfp-greet dfp-greet-left">
                        <span className="dfp-greet-text">{organizerGreeting}</span>
                        <GreetingConfetti />
                    </div>
                    <div className="dfp-greet dfp-greet-right">
                        <span className="dfp-greet-text">{opponentGreeting}</span>
                        <GreetingConfetti />
                    </div>
                </>
            )}
        </div>
    );
};

const DemoFindPersonPopup = ({
    isVisible,
    onClose,
    organizerName,
    opponentName,
    organizerPhoto,
    opponentPhoto,
}) => {
    const [active, setActive] = useState(false);
    const timerRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const organizerGreeting = formatNiceToMeetYou(organizerName);
    const opponentGreeting = formatNiceToMeetYou(opponentName);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (isVisible) {
            setActive(true);
            timerRef.current = setTimeout(() => {
                setActive(false);
                onCloseRef.current?.();
            }, POPUP_DURATION_MS);
        } else {
            setActive(false);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isVisible]);

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    className="ready-overlay demo-find-person-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="ready-backdrop" />
                    <motion.div
                        className="ready-card demo-find-person-card"
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
                        <h2 className="demo-find-person-title">This is how you find your person</h2>
                        <p className="demo-find-person-subtitle">
                            You get paired on screen. Then go find them in the room.
                        </p>
                        <PairGreetingAnimation
                            active={active}
                            organizerGreeting={organizerGreeting}
                            opponentGreeting={opponentGreeting}
                            organizerPhoto={organizerPhoto}
                            opponentPhoto={opponentPhoto}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DemoFindPersonPopup;
