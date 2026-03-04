import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './organizer-dashboard.css';
import { apiFetch } from '../utils/api';

const LoadingSpinner = ({ size = 60, className = '' }) => {
    return (
        <div className={`attendees-spinner ${className}`} style={{ width: size, height: size }}>
            <div className="attendees-spinner-inner"></div>
        </div>
    );
};

const TAG_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#ef4444', '#14b8a6', '#f97316', '#a855f7', '#06b6d4', '#84cc16',
];

const getTagColor = (tag) => {
    if (!tag) return TAG_COLORS[0];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

const TagPill = React.memo(({ tag }) => {
    const color = getTagColor(tag);
    return (
        <span className="attendee-modal-tag-pill" style={{ background: color }}>
            {tag}
        </span>
    );
});
TagPill.displayName = 'TagPill';

const formatDate = (dateValue) => {
    if (!dateValue) return 'Date not available';
    let date;
    if (typeof dateValue === 'number') {
        date = dateValue < 10000000000 ? new Date(dateValue * 1000) : new Date(dateValue);
    } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    } else {
        return 'Date not available';
    }
    if (isNaN(date.getTime())) return 'Date not available';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CommunityAttendeesCarousel = ({ attendees = [], navigate }) => {
    const scrollerRef = useRef(null);
    const rootRef = useRef(null);
    const observerRef = useRef(null);
    const [activeUsername, setActiveUsername] = useState(null);
    const [isCoarsePointer, setIsCoarsePointer] = useState(false);
    const [loadedImages, setLoadedImages] = useState({});
    const debounceTimerRef = useRef(null);

    const loadingImagesRef = useRef(false);
    const pendingQueueRef = useRef(new Set());
    const loadedImagesRef = useRef(new Set());
    const pendingObserverRef = useRef(new Set());

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);
    const [attendeeDetails, setAttendeeDetails] = useState({});
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [isInitialOpen, setIsInitialOpen] = useState(false);
    const currentFetchRef = useRef(null);
    const closeTimeoutRef = useRef(null);
    const detailsCacheRef = useRef({});
    const swipeTimeoutRef = useRef(null);

    useEffect(() => {
        const mql = window.matchMedia("(pointer: coarse)");
        const update = () => setIsCoarsePointer(!!mql.matches);
        update();
        if (mql.addEventListener) {
            mql.addEventListener("change", update);
        } else {
            mql.addListener(update);
        }
        return () => {
            if (mql.removeEventListener) {
                mql.removeEventListener("change", update);
            } else {
                mql.removeListener(update);
            }
        };
    }, []);

    useEffect(() => {
        const onPointerDown = (e) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target)) {
                setActiveUsername(null);
            }
        };
        document.addEventListener("pointerdown", onPointerDown, { capture: true });
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, { capture: true });
        };
    }, []);

    const scrollByAmount = useCallback((dir = 1) => {
        const el = scrollerRef.current;
        if (!el) return;
        const amount = Math.round(el.clientWidth * 0.75) * dir;
        el.scrollBy({ left: amount, behavior: "smooth" });
    }, []);

    const canScrollLeft = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return false;
        return el.scrollLeft > 0;
    }, []);

    const canScrollRight = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return false;
        return el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    }, []);

    const [canScroll, setCanScroll] = useState({ left: false, right: true });

    useEffect(() => {
        const updateScrollButtons = () => {
            setCanScroll({ left: canScrollLeft(), right: canScrollRight() });
        };
        const el = scrollerRef.current;
        if (el) {
            updateScrollButtons();
            el.addEventListener('scroll', updateScrollButtons);
            window.addEventListener('resize', updateScrollButtons);
        }
        return () => {
            if (el) {
                el.removeEventListener('scroll', updateScrollButtons);
                window.removeEventListener('resize', updateScrollButtons);
            }
        };
    }, [attendees.length, canScrollLeft, canScrollRight]);

    const loadImageBatch = useCallback(async (usernames) => {
        for (const u of usernames) {
            if (!loadedImagesRef.current.has(u)) {
                pendingQueueRef.current.add(u);
            }
        }

        if (loadingImagesRef.current) return;

        while (pendingQueueRef.current.size > 0) {
            const batch = [...pendingQueueRef.current].filter(
                u => !loadedImagesRef.current.has(u)
            );
            pendingQueueRef.current.clear();

            if (batch.length === 0) break;

            loadingImagesRef.current = true;

            try {
                const response = await apiFetch('/organizer_attendees/images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usernames: batch })
                });

                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    navigate('/organizer-signup');
                    return;
                }

                if (!response.ok) throw new Error('Failed to load images');

                const data = await response.json();
                if (data.status === 'success' && data.images) {
                    setLoadedImages(prev => {
                        const updated = { ...prev };
                        batch.forEach(username => {
                            if (data.images[username]) {
                                updated[username] = `data:image/jpeg;base64,${data.images[username]}`;
                            } else {
                                updated[username] = null;
                            }
                            loadedImagesRef.current.add(username);
                        });
                        return updated;
                    });
                }
            } catch (error) {
                console.error('Error loading images:', error);
                batch.forEach(u => pendingQueueRef.current.delete(u));
                break;
            } finally {
                loadingImagesRef.current = false;
            }
        }
    }, [navigate]);

    // Load initial batch on mount
    useEffect(() => {
        if (attendees.length === 0) return;
        const firstBatch = attendees.slice(0, 30).map(a => a.username);
        if (firstBatch.length > 0) {
            loadImageBatch(firstBatch);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendees.length]);

    useEffect(() => {
        if (attendees.length === 0 || !scrollerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.dataset.index);
                        const rangeStart = Math.max(0, index - 5);
                        const rangeEnd = Math.min(attendees.length, index + 15);
                        for (let i = rangeStart; i < rangeEnd; i++) {
                            const username = attendees[i]?.username;
                            if (username) {
                                pendingObserverRef.current.add(username);
                            }
                        }
                    }
                });

                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                    const usernames = [...pendingObserverRef.current];
                    pendingObserverRef.current.clear();
                    if (usernames.length > 0) {
                        loadImageBatch(usernames);
                    }
                }, 200);
            },
            {
                root: scrollerRef.current,
                rootMargin: '300px',
                threshold: 0.1
            }
        );

        const tiles = scrollerRef.current.querySelectorAll('[data-index]');
        tiles.forEach(tile => observer.observe(tile));
        observerRef.current = observer;

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            if (observerRef.current) observerRef.current.disconnect();
            pendingObserverRef.current.clear();
        };
    }, [attendees, loadImageBatch]);

    const getCurrentIndex = useCallback(() => {
        if (!selectedUsername || attendees.length === 0) return -1;
        return attendees.findIndex(a => a.username === selectedUsername);
    }, [selectedUsername, attendees]);

    const getAdjacentUsername = useCallback((direction) => {
        const currentIndex = getCurrentIndex();
        if (currentIndex === -1 || attendees.length === 0) return null;
        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % attendees.length;
        } else {
            nextIndex = currentIndex === 0 ? attendees.length - 1 : currentIndex - 1;
        }
        return attendees[nextIndex]?.username || null;
    }, [getCurrentIndex, attendees]);

    const navigateToAttendee = useCallback(async (direction) => {
        const nextUsername = getAdjacentUsername(direction);
        if (!nextUsername) return;
        setSwipeDirection(direction === 'next' ? 'left' : 'right');
        if (swipeTimeoutRef.current) clearTimeout(swipeTimeoutRef.current);
        swipeTimeoutRef.current = setTimeout(() => {
            setSwipeDirection(null);
            swipeTimeoutRef.current = null;
        }, 400);
        await fetchAttendeeDetails(nextUsername, false);
    }, [getAdjacentUsername]);

    const canNavigateLeft = useMemo(() => attendees.length > 1, [attendees.length]);
    const canNavigateRight = useMemo(() => attendees.length > 1, [attendees.length]);

    // Consistent 401 handling: redirect to organizer-signup
    const fetchAttendeeDetails = useCallback(async (username, isInitial = true) => {
        if (detailsCacheRef.current[username]) {
            setSelectedUsername(username);
            setModalOpen(true);
            setDetailsError(null);
            setIsInitialOpen(isInitial);
            return;
        }

        currentFetchRef.current = username;
        setLoadingDetails(true);
        setDetailsError(null);
        setModalOpen(true);
        setSelectedUsername(username);
        setIsInitialOpen(isInitial);

        try {
            const response = await apiFetch(`/organizer_attendees/${username}/details`);
            if (currentFetchRef.current !== username) return;

            if (response.status === 401) {
                localStorage.removeItem('access_token');
                navigate('/organizer-signup');
                return;
            }
            if (response.status === 403) throw new Error('Access denied. Organizer permissions required.');
            if (response.status === 404) throw new Error('Attendee details not found.');
            if (!response.ok) throw new Error('Failed to load attendee details');

            const data = await response.json();
            if (data.status === 'success' && data.attendee) {
                const processedDetails = {
                    username: data.attendee.username,
                    name: data.attendee.name || data.attendee.username,
                    image_data: data.attendee.image_data
                        ? `data:image/jpeg;base64,${data.attendee.image_data}`
                        : null,
                    last_joined_date: data.attendee.last_joined_date,
                    self_tags: data.attendee.tags?.tags_work || [],
                    desiring_tags: data.attendee.tags?.desiring_tags_work || [],
                    lobbies_attended: data.attendee.stats?.lobbies_attended || 0,
                    rounds_paired: data.attendee.stats?.rounds_paired || 0
                };

                setAttendeeDetails(prev => {
                    const updated = { ...prev, [username]: processedDetails };
                    detailsCacheRef.current = updated;
                    return updated;
                });

                if (currentFetchRef.current === username) {
                    setSelectedUsername(username);
                }
            } else {
                throw new Error(data.error || 'Failed to load attendee details');
            }
        } catch (err) {
            if (currentFetchRef.current === username) {
                console.error('Error fetching attendee details:', err);
                setDetailsError(err.message || 'An error occurred while loading details.');
            }
        } finally {
            if (currentFetchRef.current === username) {
                setLoadingDetails(false);
                currentFetchRef.current = null;
            }
        }
    }, [navigate]);

    const handleCloseModal = useCallback(() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        if (swipeTimeoutRef.current) clearTimeout(swipeTimeoutRef.current);
        setModalOpen(false);
        setDetailsError(null);
        setSwipeDirection(null);
        setIsInitialOpen(false);
        closeTimeoutRef.current = setTimeout(() => {
            setSelectedUsername(null);
            closeTimeoutRef.current = null;
        }, 300);
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && modalOpen) {
                e.stopPropagation();
                handleCloseModal();
            }
        };
        document.addEventListener('keydown', handleEscape, true);
        return () => document.removeEventListener('keydown', handleEscape, true);
    }, [modalOpen, handleCloseModal]);

    useEffect(() => {
        if (modalOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = originalStyle; };
        }
    }, [modalOpen]);

    useEffect(() => {
        return () => {
            if (swipeTimeoutRef.current) clearTimeout(swipeTimeoutRef.current);
        };
    }, []);

    const normalizedAttendees = useMemo(
        () =>
            attendees.map((attendee, idx) => ({
                username: attendee.username || `temp-${idx}`,
                name: attendee.name || attendee.username || `User ${idx + 1}`,
                small_image_data: attendee.small_image_data || null,
                last_joined_date: attendee.last_joined_date || null
            })),
        [attendees]
    );

    const lobbyGroupCounts = useMemo(() => {
        const counts = {};
        for (const a of normalizedAttendees) {
            const key = a.last_joined_date || 'unknown';
            counts[key] = (counts[key] || 0) + 1;
        }
        return counts;
    }, [normalizedAttendees]);

    return (
        <section
            className={`attendees-root ${modalOpen && isInitialOpen ? 'attendees-root-modal-open' : ''}`}
            ref={rootRef}
            aria-label="Your Community"
        >
            <div className="attendees-card">
                <div className="attendees-lifetime-header">
                    Lifetime Attendees: <strong>{normalizedAttendees.length}</strong>
                </div>
                <div className="attendees-carouselWrap">
                    <button
                        type="button"
                        className="attendees-arrow attendees-arrowLeft"
                        aria-label="Scroll left"
                        onClick={() => scrollByAmount(-1)}
                        disabled={!canScroll.left || isCoarsePointer}
                    >
                        ‹
                    </button>

                    <div
                        ref={scrollerRef}
                        className="attendees-scroller"
                        role="list"
                        aria-label="Community attendees list"
                        onMouseLeave={() => {
                            if (!isCoarsePointer) setActiveUsername(null);
                        }}
                    >
                        {normalizedAttendees.map((attendee, index) => {
                            const isActive = activeUsername === attendee.username;
                            const hasAnyActive = activeUsername !== null;
                            const imageUrl = loadedImages[attendee.username];
                            const prevDate = index > 0 ? normalizedAttendees[index - 1].last_joined_date : null;
                            const isNewGroup = index === 0 || attendee.last_joined_date !== prevDate;
                            const groupKey = attendee.last_joined_date || 'unknown';
                            const groupCount = lobbyGroupCounts[groupKey] || 0;

                            return (
                                <React.Fragment key={attendee.username}>
                                    {isNewGroup && (
                                        <div className="attendees-divider" aria-hidden="true">
                                            <span className="attendees-divider-count">
                                                attendees: <strong>{groupCount}</strong>
                                            </span>
                                            <div className="attendees-divider-line" />
                                            <span className="attendees-divider-label">
                                                {formatDate(attendee.last_joined_date)}
                                            </span>
                                            <div className="attendees-divider-line" />
                                        </div>
                                    )}
                                    <div
                                        data-index={index}
                                        className={[
                                            "attendees-item",
                                            isActive ? "is-active" : "",
                                            hasAnyActive && !isActive ? "is-dimmed" : "",
                                            isCoarsePointer ? "is-touch" : "is-mouse",
                                        ].join(" ")}
                                        role="listitem"
                                        tabIndex={0}
                                        onMouseEnter={() => {
                                            if (!isCoarsePointer) setActiveUsername(attendee.username);
                                        }}
                                        onFocus={() => setActiveUsername(attendee.username)}
                                        onClick={() => {
                                            if (isCoarsePointer) setActiveUsername(attendee.username);
                                            fetchAttendeeDetails(attendee.username, true);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setActiveUsername(attendee.username);
                                            }
                                            if (e.key === "Escape") setActiveUsername(null);
                                        }}
                                    >
                                        <div className="attendees-avatarWrap" aria-hidden="true">
                                            <img
                                                className="attendees-avatarImg"
                                                src={imageUrl || "/assets/fallback_image_avatar_11.png"}
                                                alt=""
                                                onError={(e) => { e.target.src = "/assets/fallback_image_avatar_11.png"; }}
                                            />
                                        </div>
                                        <div className="attendees-name" title={attendee.name}>
                                            {attendee.name}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        className="attendees-arrow attendees-arrowRight"
                        aria-label="Scroll right"
                        onClick={() => scrollByAmount(1)}
                        disabled={!canScroll.right || isCoarsePointer}
                    >
                        ›
                    </button>
                </div>

            </div>

            {modalOpen && (
                <>
                    <div className="attendee-modal-overlay" onClick={handleCloseModal}>
                        {attendees.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="attendee-modal-nav-arrow attendee-modal-nav-left"
                                    onClick={(e) => { e.stopPropagation(); navigateToAttendee('prev'); }}
                                    disabled={!canNavigateLeft}
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    className="attendee-modal-nav-arrow attendee-modal-nav-right"
                                    onClick={(e) => { e.stopPropagation(); navigateToAttendee('next'); }}
                                    disabled={!canNavigateRight}
                                >
                                    ›
                                </button>
                            </>
                        )}
                        <div
                            className={`attendee-modal-content ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="attendee-modal-close-btn"
                                onClick={handleCloseModal}
                                aria-label="Close"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                            {loadingDetails ? (
                                <div className="attendee-modal-loading">
                                    <LoadingSpinner size={60} />
                                    <p>Loading attendee details...</p>
                                </div>
                            ) : detailsError ? (
                                <div className="attendee-modal-error">
                                    <p className="attendee-modal-error-message">{detailsError}</p>
                                </div>
                            ) : selectedUsername && attendeeDetails[selectedUsername] ? (
                                <div className="attendee-modal-inner">
                                    {(() => {
                                        const details = attendeeDetails[selectedUsername];
                                        return (
                                            <>
                                                <h2 className="attendee-modal-header" id="attendee-modal-title">
                                                    {details.name}
                                                </h2>
                                                <div className="attendee-modal-grid">
                                                    <div className="attendee-modal-left">
                                                        <div className="attendee-modal-date">
                                                            {formatDate(details.last_joined_date)}
                                                        </div>
                                                        <div className="attendee-modal-profile-card">
                                                            <div className="attendee-modal-profile-img-wrapper">
                                                                <img
                                                                    className="attendee-modal-profile-img"
                                                                    src={details.image_data || "/assets/fallback_image_avatar_11.png"}
                                                                    alt={details.name}
                                                                    onError={(e) => { e.target.src = "/assets/fallback_image_avatar_11.png"; }}
                                                                />
                                                            </div>
                                                            <div className="attendee-modal-profile-footer">
                                                                {details.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="attendee-modal-right">
                                                        <div className="attendee-modal-stat">
                                                            <span className="attendee-modal-stat-label">events attended</span>
                                                            <span className="attendee-modal-stat-value">{details.lobbies_attended}</span>
                                                        </div>
                                                        <div className="attendee-modal-stat">
                                                            <span className="attendee-modal-stat-label">real connections</span>
                                                            <div className="attendee-modal-stat-value-with-icons">
                                                                <span className="attendee-modal-stat-value">{details.rounds_paired}</span>
                                                                <div className="attendee-modal-staggered-icons">
                                                                    {[...Array(4)].map((_, i) => (
                                                                        <img key={i} className="attendee-modal-staggered-icon" src="/assets/fallback_image_avatar_11.png" alt="" />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="attendee-modal-tags-section">
                                                            <h3 className="attendee-modal-tags-label">who I am:</h3>
                                                            <div className="attendee-modal-tags-container">
                                                                {details.self_tags && details.self_tags.length > 0 ? (
                                                                    details.self_tags.map((tag, index) => (
                                                                        <TagPill key={`self-${index}-${tag}`} tag={tag} />
                                                                    ))
                                                                ) : (
                                                                    <span className="attendee-modal-empty-state">No tags</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="attendee-modal-tags-section">
                                                            <h3 className="attendee-modal-tags-label">looking for:</h3>
                                                            <div className="attendee-modal-tags-container">
                                                                {details.desiring_tags && details.desiring_tags.length > 0 ? (
                                                                    details.desiring_tags.map((tag, index) => (
                                                                        <TagPill key={`desiring-${index}-${tag}`} tag={tag} />
                                                                    ))
                                                                ) : (
                                                                    <span className="attendee-modal-empty-state">No tags</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

const OrganizerDashboard = () => {
    const { user, userProfile, permissions, checkAuth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [attendees, setAttendees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (permissions !== null) {
            if (permissions !== 'admin' && permissions !== 'organizer') {
                navigate('/organizer-signup');
            }
        }
    }, [permissions, navigate]);

    useEffect(() => {
        checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAttendees = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiFetch('/organizer_attendees');
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                navigate('/organizer-signup');
                return;
            }
            if (response.status === 403) {
                setError('Access denied. Organizer permissions required.');
                setIsLoading(false);
                return;
            }
            if (!response.ok) throw new Error('Failed to load attendees');
            const data = await response.json();
            if (data.status === 'success') {
                setAttendees(data.attendees || []);
            } else {
                throw new Error(data.error || 'Failed to load attendees');
            }
        } catch (err) {
            console.error('Error fetching attendees:', err);
            if (err.message === 'Failed to fetch' || err.message.includes('network')) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError(err.message || 'An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (permissions === 'organizer' || permissions === 'admin') {
            fetchAttendees();
        }
    }, [permissions, fetchAttendees]);

    return (
        <div className="organizer-dashboard">
            <div className="dashboard-nav-bar">
                <button className="dashboard-nav-back" onClick={() => navigate('/')} aria-label="Back">
                    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="17" stroke="#374151" strokeWidth="1.5" fill="rgba(255,255,255,0.8)"/>
                        <path d="M21 12L15 18L21 24" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <img
                    src="/assets/reuneo_test_11.png"
                    alt="Reuneo Logo"
                    className="dashboard-logo-img"
                />
                <div className="dashboard-nav-placeholder" />
            </div>

            <h1 className="dashboard-title">
                {(userProfile?.name || user || 'Your')}&apos;s Dashboard
            </h1>

            {isLoading ? (
                <div className="attendees-loading-container">
                    <LoadingSpinner size={60} />
                </div>
            ) : error ? (
                <div className="attendees-error-container">
                    <div className="attendees-error-message">{error}</div>
                    <button className="attendees-retry-button" onClick={fetchAttendees}>
                        Retry
                    </button>
                </div>
            ) : attendees.length === 0 ? (
                <div className="attendees-empty-container">
                    <div className="attendees-empty-message">No attendees yet</div>
                </div>
            ) : (
                <CommunityAttendeesCarousel attendees={attendees} navigate={navigate} />
            )}
        </div>
    );
};

export default OrganizerDashboard;
