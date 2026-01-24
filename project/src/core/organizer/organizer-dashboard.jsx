import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './organizer-dashboard.css';
import { apiFetch } from '../utils/api';

// Loading Spinner Component
const LoadingSpinner = ({ size = 60, className = '' }) => {
    return (
        <div className={`attendees-spinner ${className}`} style={{ width: size, height: size }}>
            <div className="attendees-spinner-inner"></div>
        </div>
    );
};

// Tag Color Palette - predefined colors with good contrast for white text
const TAG_COLORS = [
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ef4444', // red
    '#14b8a6', // teal
    '#f97316', // orange
    '#a855f7', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
];

// Get tag color based on tag string hash (consistent color for same tag)
const getTagColor = (tag) => {
    if (!tag) return TAG_COLORS[0];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TAG_COLORS.length;
    return TAG_COLORS[index];
};

// Tag Pill Component
const TagPill = React.memo(({ tag }) => {
    const color = getTagColor(tag);
    return (
        <span
            className="attendee-modal-tag-pill"
            style={{ background: color }}
        >
            {tag}
        </span>
    );
});
TagPill.displayName = 'TagPill';

// Format date to "Dec 14, 2025" format
const formatDate = (dateValue) => {
    if (!dateValue) return 'Date not available';
    
    let date;
    if (typeof dateValue === 'number') {
        // If timestamp (seconds), convert to milliseconds
        date = dateValue < 10000000000 ? new Date(dateValue * 1000) : new Date(dateValue);
    } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    } else {
        return 'Date not available';
    }
    
    if (isNaN(date.getTime())) {
        return 'Date not available';
    }
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Community Attendees Carousel Component
const CommunityAttendeesCarousel = ({ attendees = [] }) => {
    const scrollerRef = useRef(null);
    const rootRef = useRef(null);
    const observerRef = useRef(null);
    const [activeUsername, setActiveUsername] = useState(null);
    const [isCoarsePointer, setIsCoarsePointer] = useState(false);
    const [loadedImages, setLoadedImages] = useState({});
    const [loadingImages, setLoadingImages] = useState(false);
    const [imageLoadingState, setImageLoadingState] = useState({}); // Track which images are loading
    const lastLoadedIndexRef = useRef(-1);
    const debounceTimerRef = useRef(null);
    
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);
    const [attendeeDetails, setAttendeeDetails] = useState({}); // Cache: username -> details
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [isInitialOpen, setIsInitialOpen] = useState(false);
    const currentFetchRef = useRef(null); // Track current fetch to prevent race conditions
    const closeTimeoutRef = useRef(null); // Track setTimeout for cleanup
    const detailsCacheRef = useRef({}); // Ref to track cache for synchronous access
    const swipeTimeoutRef = useRef(null); // Track swipe animation timeout

    // Detect coarse pointer (touch devices)
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

    // Tap/click outside to deselect
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

    // Scroll by amount
    const scrollByAmount = useCallback((dir = 1) => {
        const el = scrollerRef.current;
        if (!el) return;
        const amount = Math.round(el.clientWidth * 0.75) * dir;
        el.scrollBy({ left: amount, behavior: "smooth" });
    }, []);

    // Check if we can scroll left/right
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

    // Update scroll buttons state
    useEffect(() => {
        const updateScrollButtons = () => {
            setCanScroll({
                left: canScrollLeft(),
                right: canScrollRight()
            });
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

    // Load images batch
    const loadImageBatch = useCallback(async (usernames) => {
        if (loadingImages || usernames.length === 0) return;

        // Filter out already loaded or currently loading images
        const usernamesToLoad = usernames.filter(
            username => !loadedImages[username] && !imageLoadingState[username]
        );

        if (usernamesToLoad.length === 0) return;

        setLoadingImages(true);

        // Mark as loading
        const newLoadingState = { ...imageLoadingState };
        usernamesToLoad.forEach(username => {
            newLoadingState[username] = true;
        });
        setImageLoadingState(newLoadingState);

        try {
            const response = await apiFetch('/organizer_attendees/images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usernames: usernamesToLoad })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired - will be handled by parent component
                    throw new Error('Unauthorized');
                }
                throw new Error('Failed to load images');
            }

            const data = await response.json();
            if (data.status === 'success' && data.images) {
                // Update loaded images cache
                const newLoadedImages = { ...loadedImages };
                usernamesToLoad.forEach(username => {
                    if (data.images[username]) {
                        // Add data URI prefix
                        newLoadedImages[username] = `data:image/jpeg;base64,${data.images[username]}`;
                    } else {
                        // Image not found - will use placeholder
                        newLoadedImages[username] = null;
                    }
                });
                setLoadedImages(newLoadedImages);
            }
        } catch (error) {
            console.error('Error loading images:', error);
            // Fail silently - will show placeholder
        } finally {
            setLoadingImages(false);
            // Clear loading state
            const newLoadingState = { ...imageLoadingState };
            usernamesToLoad.forEach(username => {
                delete newLoadingState[username];
            });
            setImageLoadingState(newLoadingState);
        }
    }, [loadingImages, loadedImages, imageLoadingState]);

    // Load initial batch
    useEffect(() => {
        if (attendees.length === 0 || lastLoadedIndexRef.current >= 0) return;

        // Load first 30 images immediately
        const firstBatch = attendees.slice(0, 30).map(a => a.username);
        if (firstBatch.length > 0) {
            loadImageBatch(firstBatch);
            lastLoadedIndexRef.current = Math.min(29, attendees.length - 1);
        }
    }, [attendees.length, loadImageBatch]); // Only on initial load

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (attendees.length === 0 || !scrollerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Debounce the loading trigger
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }

                debounceTimerRef.current = setTimeout(() => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const index = parseInt(entry.target.dataset.index);
                            const lastLoaded = lastLoadedIndexRef.current;
                            // Load next 30 if we're near the last loaded index
                            if (index >= lastLoaded - 5 && index < attendees.length && lastLoaded < attendees.length - 1) {
                                const nextBatchStart = lastLoaded + 1;
                                const nextBatchEnd = Math.min(nextBatchStart + 30, attendees.length);
                                if (nextBatchStart < attendees.length) {
                                    const nextBatch = attendees.slice(nextBatchStart, nextBatchEnd).map(a => a.username);
                                    loadImageBatch(nextBatch);
                                    lastLoadedIndexRef.current = nextBatchEnd - 1;
                                }
                            }
                        }
                    });
                }, 150);
            },
            {
                root: scrollerRef.current,
                rootMargin: '200px',
                threshold: 0.5
            }
        );

        // Observe tiles
        const tiles = scrollerRef.current.querySelectorAll('[data-index]');
        tiles.forEach(tile => observer.observe(tile));

        observerRef.current = observer;

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [attendees.length, loadImageBatch]);

    // Get current attendee index
    const getCurrentIndex = useCallback(() => {
        if (!selectedUsername || attendees.length === 0) return -1;
        return attendees.findIndex(a => a.username === selectedUsername);
    }, [selectedUsername, attendees]);

    // Get next/previous username with wrap-around
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

    // Navigate to adjacent attendee
    const navigateToAttendee = useCallback(async (direction) => {
        const nextUsername = getAdjacentUsername(direction);
        if (!nextUsername) return;

        // Set swipe direction for animation
        setSwipeDirection(direction === 'next' ? 'left' : 'right');
        
        // Clear swipe direction after animation
        if (swipeTimeoutRef.current) {
            clearTimeout(swipeTimeoutRef.current);
        }
        swipeTimeoutRef.current = setTimeout(() => {
            setSwipeDirection(null);
            swipeTimeoutRef.current = null;
        }, 400);

        // Navigate (will check cache and fetch if needed)
        await fetchAttendeeDetails(nextUsername, false); // false = not initial open
    }, [getAdjacentUsername]);

    // Check if navigation arrows should be disabled
    const canNavigateLeft = useMemo(() => {
        if (attendees.length <= 1) return false;
        // For wrap-around, always enabled, but you can change this logic
        return true;
    }, [attendees.length]);

    const canNavigateRight = useMemo(() => {
        if (attendees.length <= 1) return false;
        return true;
    }, [attendees.length]);

    // Fetch attendee details
    const fetchAttendeeDetails = useCallback(async (username, isInitial = true) => {
        // Check cache first using ref for synchronous access
        if (detailsCacheRef.current[username]) {
            // Found in cache, open modal immediately
            setSelectedUsername(username);
            setModalOpen(true);
            setDetailsError(null);
            setIsInitialOpen(isInitial);
            return;
        }

        // Cancel any ongoing fetch for a different user
        if (currentFetchRef.current && currentFetchRef.current !== username) {
            // Let previous fetch complete but ignore its result if it's for different user
        }
        currentFetchRef.current = username;

        setLoadingDetails(true);
        setDetailsError(null);
        setModalOpen(true); // Open modal immediately to show loading state
        setSelectedUsername(username);
        setIsInitialOpen(isInitial);

        try {
            const response = await apiFetch(`/organizer_attendees/${username}/details`);

            // Check if this fetch is still relevant
            if (currentFetchRef.current !== username) {
                return; // User clicked another attendee, ignore this result
            }

            if (response.status === 401) {
                localStorage.removeItem('access_token');
                throw new Error('Session expired. Please log in again.');
            }

            if (response.status === 403) {
                throw new Error('Access denied. Organizer permissions required.');
            }

            if (response.status === 404) {
                throw new Error('Attendee details not found.');
            }

            if (!response.ok) {
                throw new Error('Failed to load attendee details');
            }

            const data = await response.json();
            if (data.status === 'success' && data.attendee) {
                // Process the data
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

                // Cache the details using functional update and ref
                setAttendeeDetails(prev => {
                    const updated = {
                        ...prev,
                        [username]: processedDetails
                    };
                    detailsCacheRef.current = updated; // Keep ref in sync
                    return updated;
                });

                // Only update if this is still the current fetch
                if (currentFetchRef.current === username) {
                    setSelectedUsername(username);
                    // Modal is already open from above
                }
            } else {
                throw new Error(data.error || 'Failed to load attendee details');
            }
        } catch (err) {
            // Only show error if this is still the current fetch
            if (currentFetchRef.current === username) {
                console.error('Error fetching attendee details:', err);
                setDetailsError(err.message || 'An error occurred while loading details.');
            }
        } finally {
            // Only clear loading if this is still the current fetch
            if (currentFetchRef.current === username) {
                setLoadingDetails(false);
                currentFetchRef.current = null;
            }
        }
    }, []); // Remove attendeeDetails dependency - use functional updates instead

    // Handle modal close
    const handleCloseModal = useCallback(() => {
        // Clear any pending timeouts
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        if (swipeTimeoutRef.current) {
            clearTimeout(swipeTimeoutRef.current);
        }
        
        setModalOpen(false);
        setDetailsError(null);
        setSwipeDirection(null);
        setIsInitialOpen(false);
        // Don't clear selectedUsername immediately to allow for smooth transitions
        closeTimeoutRef.current = setTimeout(() => {
            setSelectedUsername(null);
            closeTimeoutRef.current = null;
        }, 300);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    // Handle Escape key - modal takes precedence over carousel
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && modalOpen) {
                e.stopPropagation(); // Prevent carousel from handling it
                handleCloseModal();
            }
        };
        document.addEventListener('keydown', handleEscape, true); // Use capture phase
        return () => document.removeEventListener('keydown', handleEscape, true);
    }, [modalOpen, handleCloseModal]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (modalOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [modalOpen]);

    // Cleanup swipe timeout on unmount
    useEffect(() => {
        return () => {
            if (swipeTimeoutRef.current) {
                clearTimeout(swipeTimeoutRef.current);
            }
        };
    }, []);

    // Normalize attendees with fallbacks
    const normalizedAttendees = useMemo(
        () =>
            attendees.map((attendee, idx) => ({
                username: attendee.username || `temp-${idx}`,
                name: attendee.name || attendee.username || `User ${idx + 1}`,
                small_image_data: attendee.small_image_data || null
            })),
        [attendees]
    );

    return (
        <section 
            className={`attendees-root ${modalOpen && isInitialOpen ? 'attendees-root-modal-open' : ''}`}
            ref={rootRef}
            aria-label="Your Community"
        >
            <div className="attendees-card">
                <header className="attendees-header">
                    <h2 className="attendees-title">Your Community</h2>
                </header>

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
                            const isLoadingImage = imageLoadingState[attendee.username];

                            return (
                                <div
                                    key={attendee.username}
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
                                        fetchAttendeeDetails(attendee.username, true); // true = initial open
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
                                        {isLoadingImage ? (
                                            <LoadingSpinner size={30} className="attendees-tile-spinner" />
                                        ) : imageUrl ? (
                                            <img
                                                className="attendees-avatarImg"
                                                src={imageUrl}
                                                alt=""
                                                onError={(e) => {
                                                    e.target.src = "/assets/fakeprofile.png";
                                                }}
                                            />
                                        ) : (
                                            <img
                                                className="attendees-avatarImg"
                                                src="/assets/fakeprofile.png"
                                                alt=""
                                            />
                                        )}
                                    </div>

                                    <div className="attendees-name" title={attendee.name}>
                                        {attendee.name}
                                    </div>
                                </div>
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

                {/* Optional dots for "premium" cue (static for now) */}
                <div className="attendees-dots" aria-hidden="true">
                    <span className="attendees-dot is-on" />
                    <span className="attendees-dot" />
                    <span className="attendees-dot" />
                    <span className="attendees-dot" />
                </div>
            </div>

            {/* Attendee Details Modal */}
            {modalOpen && (
                <>
                    {/* Navigation Arrows */}
                    {attendees.length > 1 && (
                        <>
                            <button
                                type="button"
                                className="attendee-modal-nav-arrow attendee-modal-nav-left"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToAttendee('prev');
                                }}
                                disabled={!canNavigateLeft}
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                className="attendee-modal-nav-arrow attendee-modal-nav-right"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToAttendee('next');
                                }}
                                disabled={!canNavigateRight}
                            >
                                ›
                            </button>
                        </>
                    )}

                    <div 
                        className="attendee-modal-overlay"
                        onClick={handleCloseModal}
                    >
                        <div 
                            className={`attendee-modal-content ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
                            onClick={(e) => e.stopPropagation()}
                        >
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
                                                {/* Header */}
                                                <h2 className="attendee-modal-header" id="attendee-modal-title">
                                                    {details.name}
                                                </h2>

                                                {/* Main Content Grid */}
                                                <div className="attendee-modal-grid">
                                                    {/* Left Column */}
                                                    <div className="attendee-modal-left">
                                                        {/* Date Stamp */}
                                                        <div className="attendee-modal-date">
                                                            {formatDate(details.last_joined_date)}
                                                        </div>

                                                        {/* Profile Image Card */}
                                                        <div className="attendee-modal-profile-card">
                                                            <div className="attendee-modal-profile-img-wrapper">
                                                                {details.image_data ? (
                                                                    <img
                                                                        className="attendee-modal-profile-img"
                                                                        src={details.image_data}
                                                                        alt={details.name}
                                                                        onError={(e) => {
                                                                            e.target.src = "/assets/fakeprofile.png";
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <img
                                                                        className="attendee-modal-profile-img"
                                                                        src="/assets/fakeprofile.png"
                                                                        alt={details.name}
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="attendee-modal-profile-footer">
                                                                {details.name}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Column */}
                                                    <div className="attendee-modal-right">
                                                        {/* Events Attended */}
                                                        <div className="attendee-modal-stat">
                                                            <span className="attendee-modal-stat-label">events attended</span>
                                                            <span className="attendee-modal-stat-value">{details.lobbies_attended}</span>
                                                        </div>

                                                        {/* Real Connections */}
                                                        <div className="attendee-modal-stat">
                                                            <span className="attendee-modal-stat-label">real connections</span>
                                                            <div className="attendee-modal-stat-value-with-icons">
                                                                <span className="attendee-modal-stat-value">{details.rounds_paired}</span>
                                                                <div className="attendee-modal-staggered-icons">
                                                                    {[...Array(4)].map((_, i) => (
                                                                        <img
                                                                            key={i}
                                                                            className="attendee-modal-staggered-icon"
                                                                            src="/assets/fakeprofile.png"
                                                                            alt=""
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Who I Am Tags */}
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

                                                        {/* Looking For Tags */}
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

// Main Organizer Dashboard Component
const OrganizerDashboard = () => {
    const { user, permissions, checkAuth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [attendees, setAttendees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check permissions on mount
    useEffect(() => {
        if (permissions !== null) {
            if (permissions !== 'admin' && permissions !== 'organizer') {
                navigate('/organizer-signup');
            }
        }
    }, [permissions, navigate]);

    // Ensure auth is checked
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Fetch attendees
    const fetchAttendees = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiFetch('/organizer_attendees');

            if (response.status === 401) {
                // Token expired - redirect to login
                localStorage.removeItem('access_token');
                navigate('/organizer-signup');
                return;
            }

            if (response.status === 403) {
                setError('Access denied. Organizer permissions required.');
                setIsLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load attendees');
            }

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

    // Fetch on mount
    useEffect(() => {
        if (permissions === 'organizer' || permissions === 'admin') {
            fetchAttendees();
        }
    }, [permissions, fetchAttendees]);

    return (
        <div className="organizer-dashboard">
            <div className="dashboard-header">
                <h1>Organizer Dashboard</h1>
                <button 
                    onClick={() => navigate('/')}
                    className="dashboard-home-button"
                >
                    Home
                </button>
            </div>
            
            {isLoading ? (
                <div className="attendees-loading-container">
                    <LoadingSpinner size={60} />
                </div>
            ) : error ? (
                <div className="attendees-error-container">
                    <div className="attendees-error-message">{error}</div>
                    <button 
                        className="attendees-retry-button"
                        onClick={fetchAttendees}
                    >
                        Retry
                    </button>
                </div>
            ) : attendees.length === 0 ? (
                <div className="attendees-empty-container">
                    <div className="attendees-empty-message">No attendees yet</div>
                </div>
            ) : (
                <CommunityAttendeesCarousel attendees={attendees} />
            )}
        </div>
    );
};

export default OrganizerDashboard;

