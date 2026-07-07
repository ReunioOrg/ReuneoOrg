import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import AttendeesHistoryTutorial, { MatchHistoryPitchHeader } from './attendees_history_tutorial';
import './demo_match_history_outro.css';

export const DEMO_MATCH_HISTORY_OUTRO_MS = 8500;
export const DEMO_MATCH_HISTORY_OUTRO_FADE_MS = 400;

const DemoMatchHistoryOutroContext = createContext(null);

const lockBodyScroll = () => {
    document.body.style.overflow = 'hidden';
};

const unlockBodyScroll = () => {
    document.body.style.overflow = '';
};

export const DemoMatchHistoryOutroProvider = ({ children }) => {
    const location = useLocation();
    const [visible, setVisible] = useState(false);
    const [fading, setFading] = useState(false);

    const outroInFlightRef = useRef(false);
    const startedAtRef = useRef(null);
    const plannedNavigationPathRef = useRef(null);
    const fadeTimerRef = useRef(null);
    const hideTimerRef = useRef(null);
    const prevPathRef = useRef(location.pathname);

    const clearTimers = useCallback(() => {
        if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = null;
        }
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const finishOutro = useCallback(() => {
        clearTimers();
        outroInFlightRef.current = false;
        startedAtRef.current = null;
        plannedNavigationPathRef.current = null;
        setFading(false);
        setVisible(false);
        unlockBodyScroll();
    }, [clearTimers]);

    const cancelDemoMatchHistoryOutro = useCallback(() => {
        if (!outroInFlightRef.current) return;
        finishOutro();
    }, [finishOutro]);

    const scheduleFadeOut = useCallback(() => {
        clearTimers();

        const startedAt = startedAtRef.current ?? Date.now();
        const minEndAt = startedAt + DEMO_MATCH_HISTORY_OUTRO_MS;
        const delay = Math.max(0, minEndAt - Date.now());

        fadeTimerRef.current = setTimeout(() => {
            setFading(true);
            hideTimerRef.current = setTimeout(() => {
                finishOutro();
            }, DEMO_MATCH_HISTORY_OUTRO_FADE_MS);
        }, delay);
    }, [clearTimers, finishOutro]);

    const startDemoMatchHistoryOutro = useCallback(() => {
        if (outroInFlightRef.current) return false;

        clearTimers();
        outroInFlightRef.current = true;
        plannedNavigationPathRef.current = null;
        startedAtRef.current = Date.now();
        setFading(false);
        setVisible(true);
        lockBodyScroll();
        return true;
    }, [clearTimers]);

    const completeDemoMatchHistoryOutroNavigation = useCallback((navigateFn, expectedPath = '/plan-selection') => {
        if (!outroInFlightRef.current) return;

        plannedNavigationPathRef.current = expectedPath;
        navigateFn();
        scheduleFadeOut();
    }, [scheduleFadeOut]);

    useEffect(() => {
        if (!outroInFlightRef.current) {
            prevPathRef.current = location.pathname;
            return;
        }

        if (location.pathname === prevPathRef.current) return;

        if (plannedNavigationPathRef.current && location.pathname === plannedNavigationPathRef.current) {
            plannedNavigationPathRef.current = null;
            prevPathRef.current = location.pathname;
            return;
        }

        finishOutro();
        prevPathRef.current = location.pathname;
    }, [location.pathname, finishOutro]);

    useEffect(() => {
        const handlePopState = () => {
            if (!outroInFlightRef.current || plannedNavigationPathRef.current) return;
            finishOutro();
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [finishOutro]);

    useEffect(() => () => {
        clearTimers();
        unlockBodyScroll();
    }, [clearTimers]);

    const value = {
        startDemoMatchHistoryOutro,
        cancelDemoMatchHistoryOutro,
        completeDemoMatchHistoryOutroNavigation,
    };

    return (
        <DemoMatchHistoryOutroContext.Provider value={value}>
            {children}
            {visible && (
                <div
                    className={`dmho-overlay${fading ? ' dmho-overlay-fading' : ''}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Match history preview"
                >
                    <div className="dmho-content">
                        <div className="dmho-header">
                            <MatchHistoryPitchHeader variant="outro" />
                        </div>
                        <div className="dmho-scene">
                            <AttendeesHistoryTutorial variant="outro" />
                        </div>
                    </div>
                </div>
            )}
        </DemoMatchHistoryOutroContext.Provider>
    );
};

export const useDemoMatchHistoryOutro = () => {
    const context = useContext(DemoMatchHistoryOutroContext);
    if (!context) {
        throw new Error('useDemoMatchHistoryOutro must be used within DemoMatchHistoryOutroProvider');
    }
    return context;
};

export default DemoMatchHistoryOutroProvider;
