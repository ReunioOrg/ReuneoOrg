import React, { useEffect, useState } from 'react';
import './AnimationProgressFooter.css';

/**
 * Determinate progress footer — fills proportionally over durationMs.
 * Used where total wait time is known (e.g. organizer onboarding animation).
 */
const AnimationProgressFooter = ({ durationMs, message, isActive = true }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isActive || !durationMs) {
            setProgress(0);
            return undefined;
        }

        const start = performance.now();
        let rafId;

        const tick = (now) => {
            const elapsed = now - start;
            const next = Math.min(elapsed / durationMs, 1);
            setProgress(next);
            if (next < 1) {
                rafId = requestAnimationFrame(tick);
            }
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isActive, durationMs]);

    const progressPercent = Math.round(progress * 100);

    return (
        <div className="animation-progress-footer">
            {message && (
                <p className="animation-progress-footer-message">{message}</p>
            )}
            <div
                className="animation-progress-footer-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercent}
                aria-label={message || 'Loading progress'}
            >
                <div
                    className="animation-progress-footer-fill"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
};

export default AnimationProgressFooter;
