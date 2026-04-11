import React from 'react';
import './tutorial-attendees-phone.css';

const TIMER_RADIUS = 42;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;
const TIMER_PROGRESS = 308 / 360;
const TIMER_DASH_OFFSET = TIMER_CIRCUMFERENCE * (1 - TIMER_PROGRESS);

const TutorialAttendeesPhone = ({ variant = 'table' }) => {
    const isProfile = variant === 'profile';

    return (
        <div className="tap-wrapper">
            <div className="tap-phone">
                <div className="tap-notch" />

                <div className="tap-screen">
                    <p className="tap-info-text">
                        {isProfile
                            ? 'People find each other by looking at the selfie of the person they\'re paired with'
                            : 'Providing table numbers will help people find each other in large events'
                        }
                    </p>

                    <div className={`tap-match-name ${isProfile ? 'tap-match-name-visible' : ''}`}>Go find Kate!</div>

                    {!isProfile && (
                        <div className="tap-table-section">
                            <div className="tap-table-value">at table: 1</div>
                            <span className="tap-ring tap-ring-1" />
                            <span className="tap-ring tap-ring-2" />
                        </div>
                    )}

                    <div className="tap-timer">
                        <svg className="tap-timer-svg" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r={TIMER_RADIUS} className="tap-timer-track" />
                            <circle
                                cx="50" cy="50" r={TIMER_RADIUS}
                                className="tap-timer-fill"
                                strokeDasharray={TIMER_CIRCUMFERENCE}
                                strokeDashoffset={TIMER_DASH_OFFSET}
                            />
                        </svg>
                        <div className="tap-timer-label">
                            <span className="tap-timer-digits">5:08</span>
                            <span className="tap-timer-sub">time left</span>
                        </div>
                    </div>

                    <div className={`tap-profile-card ${isProfile ? 'tap-profile-focused' : ''}`}>
                        <img
                            src="/assets/kate_rodriguez.png"
                            alt="Kate Rodriguez"
                            className="tap-profile-img"
                        />
                        {isProfile && (
                            <>
                                <span className="tap-profile-ring tap-profile-ring-1" />
                                <span className="tap-profile-ring tap-profile-ring-2" />
                            </>
                        )}
                    </div>

                    <div className="tap-screen-overlay" />
                </div>

                <div className="tap-home-indicator" />
            </div>
        </div>
    );
};

export default TutorialAttendeesPhone;
