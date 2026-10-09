import React from 'react';
import { FaInstagram, FaLinkedinIn, FaEnvelope, FaFacebookF, FaPhone } from 'react-icons/fa';
import './attendees_history_tutorial.css';
import { getSocialIconColor, palette } from '../../styles/colors';

const PersonIcon = ({ color = palette.accent }) => (
    <svg viewBox="0 0 32 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="10" r="9" fill={color} />
        <rect x="5" y="26" width="22" height="48" rx="11" fill={color} />
    </svg>
);

export const MatchHistoryPitchHeader = ({ variant = 'inline' }) => {
    const titleClass = variant === 'outro' ? 'aht-pitch-title-outro' : 'step-title';
    const subtitleClass = variant === 'outro' ? 'aht-pitch-subtitle-outro' : 'step-subtitle';
    const subtitleStyle = variant === 'inline' ? { fontWeight: 600, fontStyle: 'normal' } : undefined;

    if (variant === 'outro') {
        return (
            <>
                <h1 className={titleClass}>Connections, saved automatically</h1>
                <p className={subtitleClass}>
                    Attendees simply save their email to{' '}
                    <strong className="aht-outro-emphasis">unlock everyone</strong> they met after the
                    event. No match cards, no follow-up emails, no manual work for you.
                </p>
            </>
        );
    }

    return (
        <>
            <h1 className={titleClass}>History of Connections</h1>
            <p className={subtitleClass} style={subtitleStyle}>
                They just <strong className="aht-header-green">save their email</strong> to
                access their connections at the end of the session. Your{' '}
                <strong className="aht-header-green">organizer dashboard</strong> will have insights
                and analytics about your attendees!
            </p>
        </>
    );
};

const MOCK_TILES = [
    {
        name: 'Sofia Cortez',
        image: '/assets/sofia_cortez.png',
        date: '04/02/26',
        stars: 5,
        socials: [
            { Icon: FaInstagram, color: getSocialIconColor('instagram') },
            { Icon: FaLinkedinIn, color: getSocialIconColor('linkedin') },
        ],
    },
    {
        name: 'Ken Johnson',
        image: '/assets/ken_johnson.png',
        date: '04/02/26',
        stars: 4,
        socials: [
            { Icon: FaEnvelope, color: getSocialIconColor('email') },
            { Icon: FaFacebookF, color: getSocialIconColor('facebook') },
        ],
    },
    {
        name: 'Sarah Ramirez',
        image: '/assets/sarah_ramirez.png',
        date: '03/28/26',
        stars: 5,
        socials: [
            { Icon: FaPhone, color: getSocialIconColor('phone') },
            { Icon: FaInstagram, color: getSocialIconColor('instagram') },
        ],
    },
    {
        name: 'Tony Chopper',
        image: '/assets/tony_chopper.jpg',
        date: '03/28/26',
        stars: 4,
        socials: [
            { Icon: FaLinkedinIn, color: getSocialIconColor('linkedin') },
            { Icon: FaEnvelope, color: getSocialIconColor('email') },
        ],
    },
    {
        name: 'Kate Rodriguez',
        image: '/assets/kate_rodriguez.png',
        date: '03/21/26',
        stars: 5,
        socials: [
            { Icon: FaInstagram, color: getSocialIconColor('instagram') },
            { Icon: FaFacebookF, color: getSocialIconColor('facebook') },
        ],
    },
];

const AttendeesHistoryTutorial = ({ variant = 'inline' }) => (
    <div className={`aht-wrapper${variant === 'outro' ? ' aht-outro' : ''}`}>
        {/* Left: Blue person icon with label */}
        <div className="aht-person-section">
            <div className="aht-person-label">attendee POV</div>
            <div className="aht-person-icon">
                <PersonIcon />
            </div>
        </div>

        {/* Right: Phone frame with scrolling content */}
        <div className="aht-phone-area">
            <div className="aht-phone">
                <div className="aht-notch" />
                <div className="aht-screen">
                    <div className="aht-scroll-track">
                        <div className="aht-scroll-content">
                            <div className="aht-screen-header">
                                <div className="aht-screen-logo">
                                    <img src="/assets/reuneo_test_14.png" alt="Reuneo" />
                                </div>
                                <h2 className="aht-screen-title">Your Connections</h2>
                            </div>
                            {[0, 1].map((copy) =>
                                MOCK_TILES.map((tile) => (
                                    <div key={`${copy}-${tile.name}`} className="aht-tile">
                                        <div className="aht-tile-profile">
                                            <div className="aht-tile-img">
                                                <img src={tile.image} alt={tile.name} />
                                            </div>
                                            <div className="aht-tile-name">{tile.name}</div>
                                            <div className="aht-tile-date">{tile.date}</div>
                                            <div className="aht-tile-socials">
                                                {tile.socials.map(({ Icon, color }, i) => (
                                                    <span key={i} className="aht-tile-social-icon">
                                                        <Icon size={12} color={color} />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="aht-tile-actions">
                                            <div className="aht-tile-rating-label">Would you talk to this person again?</div>
                                            <div className="aht-tile-stars">
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <span
                                                        key={n}
                                                        className={`aht-star ${n <= tile.stars ? 'aht-star-filled' : ''}`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="aht-tile-disclaimer">(Don't worry, your response is hidden)</div>

                                            <div className="aht-tile-share-label">Share Your Contact?</div>
                                            <div className="aht-tile-share-btns">
                                                <span className="aht-share-btn">No</span>
                                                <span className="aht-share-btn aht-share-yes">Yes</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="aht-home-indicator" />
            </div>
        </div>
    </div>
);

export default AttendeesHistoryTutorial;
