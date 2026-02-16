import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../Auth/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import './paired-player-history.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiFetch } from '../utils/api';
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaEnvelope, FaPhone, FaGlobe, FaTiktok, FaSnapchatGhost } from 'react-icons/fa';

// Inline Loading Spinner for list items (uses existing CSS)
const InlineLoadingSpinner = ({ size = 60, className = '' }) => {
    return (
        <div className={`attendees-spinner ${className}`} style={{ width: size, height: size }}>
            <div className="attendees-spinner-inner"></div>
        </div>
    );
};

// Helper function: Format date to MM/DD/YY
const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Date not available';
        
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        
        return `${month}/${day}/${year}`;
    } catch (error) {
        return 'Date not available';
    }
};

// Helper function: Format image data
const formatImageData = (imageData) => {
    if (imageData) {
        return `data:image/jpeg;base64,${imageData}`;
    }
    return '/assets/fakeprofile.png';
};

// Social links platform order (matches post-event-auth.jsx)
const SOCIAL_PLATFORM_ORDER = ['phone', 'email', 'website', 'instagram', 'facebook', 'linkedin', 'tiktok', 'snapchat'];

// Helper function: Get display info for each social platform
const getSocialPlatformInfo = (platform) => {
    const platforms = {
        instagram: { label: 'Instagram', Icon: FaInstagram, color: '#E4405F', displayPrefix: '@' },
        facebook: { label: 'Facebook', Icon: FaFacebookF, color: '#1877F2', displayPrefix: '@' },
        email: { label: 'Email', Icon: FaEnvelope, color: '#4b7ef0', displayPrefix: '' },
        phone: { label: 'Phone', Icon: FaPhone, color: '#25D366', displayPrefix: '' },
        website: { label: 'Website', Icon: FaGlobe, color: '#4b7ef0', displayPrefix: '' },
        linkedin: { label: 'LinkedIn', Icon: FaLinkedinIn, color: '#0A66C2', displayPrefix: '' },
        tiktok: { label: 'TikTok', Icon: FaTiktok, color: '#000000', displayPrefix: '@' },
        snapchat: { label: 'Snapchat', Icon: FaSnapchatGhost, color: '#FFFC00', displayPrefix: '@' }
    };
    return platforms[platform] || { label: platform, Icon: FaGlobe, color: '#4b7ef0', displayPrefix: '' };
};

// Helper function: Build clickable URL for each social platform
const buildSocialLinkUrl = (platform, value) => {
    if (!value) return null;
    
    switch (platform) {
        case 'instagram':
            return `https://instagram.com/${value}`;
        case 'facebook':
            return `https://facebook.com/${value}`;
        case 'tiktok':
            return `https://tiktok.com/@${value}`;
        case 'snapchat':
            return `https://snapchat.com/add/${value}`;
        case 'linkedin':
            return `https://linkedin.com/in/${value}`;
        case 'email':
            return `mailto:${value}`;
        case 'phone':
            // Clean phone number for tel: link (keep only digits and +)
            const cleanPhone = value.replace(/[^\d+]/g, '');
            return `tel:${cleanPhone}`;
        case 'website':
            return value; // Already a full URL
        default:
            return value;
    }
};

// Helper function: Check if partner has any social links to display
const hasAnySocialLinks = (socialLinks) => {
    if (!socialLinks || typeof socialLinks !== 'object') return false;
    return Object.values(socialLinks).some(value => value && typeof value === 'string' && value.trim());
};

// Helper function: Sort interactions by date (descending) then by name (ascending)
const sortInteractions = (interactions) => {
    return [...interactions].sort((a, b) => {
        // Primary sort: by lobby_date (newest first - descending)
        const dateA = a.lobby_date ? new Date(a.lobby_date).getTime() : 0;
        const dateB = b.lobby_date ? new Date(b.lobby_date).getTime() : 0;
        
        if (dateA !== dateB) {
            return dateB - dateA; // Descending order (newest first)
        }
        
        // Secondary sort: by name (alphabetical - ascending)
        const nameA = (a.paired_with?.name || a.paired_with?.username || '').toLowerCase();
        const nameB = (b.paired_with?.name || b.paired_with?.username || '').toLowerCase();
        
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
};

// Helper function: Compare interactions to detect changes
const compareInteractions = (oldList, newList) => {
    if (!oldList || oldList.length === 0) {
        return { hasNew: newList.length > 0, hasUpdated: false };
    }
    
    const oldUsernames = new Set(oldList.map(i => i.paired_with?.username));
    const hasNew = newList.some(i => i.paired_with?.username && !oldUsernames.has(i.paired_with.username));
    
    // Check for updates: see if any existing interaction has different data
    let hasUpdated = false;
    const oldMap = new Map(oldList.map(i => [i.paired_with?.username, i]));
    
    for (const newItem of newList) {
        const username = newItem.paired_with?.username;
        if (!username) continue;
        
        const oldItem = oldMap.get(username);
        if (oldItem) {
            // Simple comparison: check if JSON stringified versions differ
            if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                hasUpdated = true;
                break;
            }
        }
    }
    
    return { hasNew, hasUpdated };
};

// Helper function: Merge interactions intelligently
const mergeInteractions = (current, incoming, isPollingUpdate) => {
    if (!isPollingUpdate) {
        // Initial load or infinite scroll - just return incoming or append
        return incoming;
    }
    
    // Polling update: merge intelligently
    if (!current || current.length === 0) {
        return incoming;
    }
    
    const updatedItems = [...current];
    const newItems = [];
    
    for (const item of incoming) {
        const username = item.paired_with?.username;
        if (!username) continue;
        
        const existingIndex = updatedItems.findIndex(
            i => i.paired_with?.username === username
        );
        
        if (existingIndex >= 0) {
            // Update existing item in place (preserve position)
            updatedItems[existingIndex] = item;
        } else {
            // New item - will add to top
            newItems.push(item);
        }
    }
    
    // Insert new items at top
    return [...newItems, ...updatedItems];
};

// Helper function: Get unique key for interaction
const getInteractionKey = (interaction, index) => {
    const username = interaction.paired_with?.username;
    if (username) return username;
    
    // Fallback to composite key
    const dateKey = `${interaction.lobby_date || ''}-${interaction.interaction_date || ''}`;
    if (dateKey !== '-') return dateKey;
    
    // Final fallback
    return `interaction-${index}`;
};

// Helper function: Find interaction by key using same key generation logic
const findInteractionByKey = (interactions, targetKey) => {
    return interactions.find((interaction, index) => {
        const key = getInteractionKey(interaction, index);
        return key === targetKey;
    }) || null;
};

// Helper function: Update paired interaction via API
const updatePairedInteraction = async (lobbyId, pairedWithUsername, updates, signal) => {
    try {
        const response = await apiFetch('/update-paired-interaction', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lobby_id: lobbyId,
                paired_with_username: pairedWithUsername,
                ...updates
            }),
            signal // AbortSignal support
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return { success: true, data };
    } catch (err) {
        if (err.name === 'AbortError') {
            throw err; // Re-throw abort errors (handled silently)
        }
        return { success: false, error: err.message };
    }
};

// Star Rating Component
const StarRating = ({ rating, onRatingChange, interactionKey }) => {
    const currentRating = rating || 0;
    
    const handleStarClick = (starNumber) => {
        // If clicking the same star, keep it selected (don't deselect)
        // If clicking a different star, update to that rating
        onRatingChange(starNumber);
    };
    
    return (
        <div className="star-rating-container">
            <div className="star-rating-question">How was the chat?</div>
            <div className="star-rating-stars">
                {[1, 2, 3, 4, 5].map((starNumber) => (
                    <button
                        key={starNumber}
                        type="button"
                        className={`star-button ${starNumber <= currentRating ? 'star-filled' : 'star-empty'}`}
                        onClick={() => handleStarClick(starNumber)}
                        aria-label={`Rate ${starNumber} star${starNumber !== 1 ? 's' : ''}`}
                    >
                        ★
                    </button>
                ))}
            </div>
            <div className="star-rating-disclaimer">(Don't worry, your response is hidden)</div>
        </div>
    );
};

// Share Contact Toggle Component
const ShareContactToggle = ({ value, onChange, interactionKey }) => {
    const handleToggle = (newValue) => {
        onChange(newValue);
    };
    
    return (
        <div className="share-contact-container">
            <div className="share-contact-question">Share Your Contact?</div>
            <div className="share-contact-buttons">
                <button
                    type="button"
                    className={`share-contact-button ${value === false ? 'selected' : ''}`}
                    onClick={() => handleToggle(false)}
                >
                    No
                </button>
                <button
                    type="button"
                    className={`share-contact-button ${value === true ? 'selected' : ''}`}
                    onClick={() => handleToggle(true)}
                >
                    Yes
                </button>
            </div>
        </div>
    );
};

const PairedPlayerHistory = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuth, user, isAuthLoading, emailVerified, userProfile } = useContext(AuthContext);
    
    // If user just came from a lobby ending AND hasn't verified their email,
    // let them view the page but redirect to post-event-auth on any interaction
    const requiresEmailSetup = location.state?.fromLobby === true && emailVerified !== true;
    
    // Check if user has zero social links saved
    const hasSocialLinks = userProfile?.social_links && 
        typeof userProfile.social_links === 'object' &&
        Object.values(userProfile.social_links).some(v => v && typeof v === 'string' && v.trim());
    
    // Track interaction count — after 2 actions with no social links, redirect to post-event-auth
    const interactionCountRef = useRef(0);
    
    // State management
    const [interactions, setInteractions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextOffset, setNextOffset] = useState(0);
    const [error, setError] = useState(null);
    const [newInfoIndicator, setNewInfoIndicator] = useState(false);
    
    // State Maps for user interactions (ratings and share contact preferences)
    const [interactionRatings, setInteractionRatings] = useState(new Map());
    const [interactionShareContact, setInteractionShareContact] = useState(new Map());
    
    // Refs for preventing race conditions and unmount issues
    const isFetchingRef = useRef(false);
    const isMountedRef = useRef(true);
    const newInfoTimeoutRef = useRef(null);
    const sentinelRef = useRef(null);
    const interactionsRef = useRef([]);
    const hasInitialLoadRef = useRef(false);
    
    // Refs for debounce and request management
    const debounceTimersRef = useRef(new Map()); // interactionKey -> timeoutId
    const abortControllersRef = useRef(new Map()); // interactionKey -> AbortController
    
    // Original values (separate per field type) - tracks committed value at start of change sequence
    const originalRatingsRef = useRef(new Map()); // interactionKey -> rating value
    const originalShareContactRef = useRef(new Map()); // interactionKey -> shareContact value
    
    // Refs for current state (to avoid stale closures)
    const interactionRatingsRef = useRef(new Map());
    const interactionShareContactRef = useRef(new Map());
    
    // Helper function: Clear pending updates for an interaction
    const clearPendingUpdates = useCallback((interactionKey) => {
        // Clear debounce timer
        const timerId = debounceTimersRef.current.get(interactionKey);
        if (timerId) {
            clearTimeout(timerId);
            debounceTimersRef.current.delete(interactionKey);
        }
        
        // Abort pending request
        const controller = abortControllersRef.current.get(interactionKey);
        if (controller) {
            controller.abort();
            abortControllersRef.current.delete(interactionKey);
        }
    }, []);
    
    // Data fetching function
    const fetchInteractions = useCallback(async (offset, isInitialLoad, isPollingUpdate) => {
        // Prevent race conditions
        if (isFetchingRef.current) {
            return;
        }
        isFetchingRef.current = true;
        
        try {
            const response = await apiFetch(`/paired-player-history?offset=${offset}&limit=30`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Unauthorized - redirect to home
                    if (isMountedRef.current) {
                        navigate('/');
                    }
                    return;
                }
                
                const errorMessage = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorMessage}`);
            }
            
            const data = await response.json();
            
            if (!isMountedRef.current) return;
            
            if (data.status !== 'success' || !Array.isArray(data.interactions)) {
                throw new Error('Invalid response format');
            }
            
            // Sort interactions by date (descending) then by name (ascending)
            const sortedInteractions = sortInteractions(data.interactions);
            
            // Handle polling updates with comparison
            if (isPollingUpdate) {
                const currentInteractions = interactionsRef.current;
                const comparison = compareInteractions(currentInteractions, sortedInteractions);
                const merged = mergeInteractions(currentInteractions, sortedInteractions, true);
                
                // Simple log for polling updates (1-2 per poll max)
                console.log('[PairedHistory] Poll update:', {
                    count: sortedInteractions.length,
                    hasNew: comparison.hasNew,
                    hasUpdated: comparison.hasUpdated
                });
                
                // Re-sort merged interactions to maintain consistent order
                const sortedMerged = sortInteractions(merged);
                setInteractions(sortedMerged);
                interactionsRef.current = sortedMerged;
                setHasMore(data.has_more);
                setNextOffset(data.next_offset || 0);
                
                // Trigger indicator if changes detected
                if (comparison.hasNew || comparison.hasUpdated) {
                    setNewInfoIndicator(true);
                }
            } else if (isInitialLoad) {
                // Initial load - replace entire array
                console.log('[PairedHistory] Initial load:', {
                    count: sortedInteractions.length
                });
                setInteractions(sortedInteractions);
                interactionsRef.current = sortedInteractions;
                setHasMore(data.has_more);
                setNextOffset(data.next_offset || 0);
                setIsLoading(false);
            } else {
                // Infinite scroll - append to array
                setInteractions(prev => {
                    const newInteractions = [...prev, ...sortedInteractions];
                    // Re-sort the entire list to maintain order
                    const sortedNew = sortInteractions(newInteractions);
                    interactionsRef.current = sortedNew;
                    return sortedNew;
                });
                setHasMore(data.has_more);
                setNextOffset(data.next_offset || 0);
                setIsLoadingMore(false);
            }
            
            setError(null);
            
        } catch (err) {
            console.error('[PairedHistory] Error:', {
                message: err.message,
                type: isPollingUpdate ? 'polling' : isInitialLoad ? 'initial' : 'infinite-scroll'
            });
            
            if (!isMountedRef.current) return;
            
            setError(err.message);
            toast.error(`Error: ${err.message}`);
            
            if (isInitialLoad) {
                setIsLoading(false);
            } else if (!isPollingUpdate) {
                setIsLoadingMore(false);
            }
        } finally {
            if (isMountedRef.current) {
                isFetchingRef.current = false;
            }
        }
    }, [navigate]);
    
    // Authentication check
    useEffect(() => {
        isMountedRef.current = true;
        
        // Wait for auth loading to complete
        if (isAuthLoading) return;
        
        // If not authenticated, redirect to home
        if (!user) {
            navigate('/');
            return;
        }
        
        // Only do initial load once
        if (hasInitialLoadRef.current) {
            return;
        }
        
        hasInitialLoadRef.current = true;
        
        // Initial fetch
        fetchInteractions(0, true, false);
        
        return () => {
            isMountedRef.current = false;
        };
    }, [isAuthLoading, user, navigate, fetchInteractions]);
    
    // Polling mechanism
    useEffect(() => {
        const poll = () => {
            if (document.hidden || isFetchingRef.current || !isMountedRef.current) return;
            fetchInteractions(0, false, true);
        };
        
        // Only set up interval if page is visible
        if (document.hidden) return;
        
        const interval = setInterval(poll, 5000);
        
        const handleVisibilityChange = () => {
            // Interval keeps running, poll() checks visibility
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchInteractions]);
    
    // "New Notifications" indicator timeout
    useEffect(() => {
        if (newInfoIndicator) {
            // Clear existing timeout
            if (newInfoTimeoutRef.current) {
                clearTimeout(newInfoTimeoutRef.current);
            }
            
            // Set timeout to hide after 4 seconds
            newInfoTimeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    setNewInfoIndicator(false);
                }
            }, 4000);
        }
        
        return () => {
            if (newInfoTimeoutRef.current) {
                clearTimeout(newInfoTimeoutRef.current);
            }
        };
    }, [newInfoIndicator]);
    
    // Infinite scroll with Intersection Observer
    useEffect(() => {
        if (!hasMore || isLoadingMore || isFetchingRef.current) {
            return;
        }
        
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isFetchingRef.current && isMountedRef.current) {
                    setIsLoadingMore(true);
                    fetchInteractions(nextOffset, false, false);
                }
            },
            {
                root: null, // Use viewport
                rootMargin: '300px',
                threshold: 0.1
            }
        );
        
        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }
        
        return () => {
            observer.disconnect();
        };
    }, [hasMore, isLoadingMore, nextOffset, fetchInteractions]);
    
    // Sync interactionsRef with interactions state
    useEffect(() => {
        interactionsRef.current = interactions;
    }, [interactions]);
    
    // Sync interactionRatings ref
    useEffect(() => {
        interactionRatingsRef.current = interactionRatings;
    }, [interactionRatings]);
    
    // Sync interactionShareContact ref
    useEffect(() => {
        interactionShareContactRef.current = interactionShareContact;
    }, [interactionShareContact]);
    
    // Initialize Maps from interactions data (smart merge: preserve user changes, use backend values when user hasn't changed)
    useEffect(() => {
        if (interactions.length === 0) return;
        
        setInteractionRatings(prevRatings => {
            const newRatings = new Map(prevRatings);
            let hasChanges = false;
            
            interactions.forEach((interaction, index) => {
                const key = getInteractionKey(interaction, index);
                
                // Initialize rating: preserve user's selection if exists, otherwise use backend value
                if (!newRatings.has(key)) {
                    // User hasn't set a rating, use backend value if valid
                    const backendRating = interaction.partner_star_rating;
                    if (backendRating !== null && backendRating >= 1 && backendRating <= 5) {
                        newRatings.set(key, backendRating);
                        hasChanges = true;
                    }
                }
            });
            
            return hasChanges ? newRatings : prevRatings;
        });
        
        setInteractionShareContact(prevShareContact => {
            const newShareContact = new Map(prevShareContact);
            let hasChanges = false;
            
            interactions.forEach((interaction, index) => {
                const key = getInteractionKey(interaction, index);
                
                // Initialize share contact: preserve user's selection if exists, otherwise use backend value
                if (!newShareContact.has(key)) {
                    // User hasn't set a preference, use backend value if it exists
                    const backendShareContact = interaction.user_show_contact;
                    if (backendShareContact !== null && typeof backendShareContact === 'boolean') {
                        newShareContact.set(key, backendShareContact);
                        hasChanges = true;
                    }
                }
            });
            
            return hasChanges ? newShareContact : prevShareContact;
        });
    }, [interactions]); // Only depend on interactions
    
    // Handlers for rating and share contact changes
    const handleRatingChange = useCallback((interactionKey, rating) => {
        // Redirect to post-event-auth if user came from lobby and hasn't verified email
        if (requiresEmailSetup) {
            navigate('/post-event-auth');
            return;
        }
        
        // Nudge users with no social links to set up their profile after 2 actions
        if (!hasSocialLinks) {
            interactionCountRef.current += 1;
            if (interactionCountRef.current >= 2) {
                navigate('/post-event-auth');
                return;
            }
        }
        
        // Use interactionsRef.current to avoid stale closure
        const interaction = findInteractionByKey(interactionsRef.current, interactionKey);
        
        // Validation
        if (!interaction?.lobby_id || !interaction.paired_with?.username) {
            toast.error('Unable to save: interaction not found');
            return;
        }
        
        // Get original value (committed value at start of change sequence)
        let originalRating = originalRatingsRef.current.get(interactionKey);
        if (originalRating === undefined) {
            // First change in sequence - capture current committed value
            const currentRating = interactionRatingsRef.current.get(interactionKey);
            const backendRating = interaction.partner_star_rating;
            const committedRating = currentRating ?? 
                                   (backendRating !== null && backendRating >= 1 && backendRating <= 5 
                                    ? backendRating : null);
            originalRating = committedRating;
            originalRatingsRef.current.set(interactionKey, originalRating);
        }
        
        // Cancel previous operations
        clearPendingUpdates(interactionKey);
        
        // Optimistic update (state + ref)
        setInteractionRatings(prev => {
            const newMap = new Map(prev);
            newMap.set(interactionKey, rating);
            interactionRatingsRef.current = newMap; // Sync ref
            return newMap;
        });
        
        // Set debounce timer (500ms)
        const timerId = setTimeout(async () => {
            // Check mount
            if (!isMountedRef.current) return;
            
            // Re-find interaction (might have changed via polling)
            const currentInteraction = findInteractionByKey(interactionsRef.current, interactionKey);
            if (!currentInteraction?.lobby_id || !currentInteraction.paired_with?.username) {
                // Interaction not found - rollback
                if (!isMountedRef.current) return;
                setInteractionRatings(prev => {
                    const newMap = new Map(prev);
                    if (originalRating !== null && originalRating !== undefined) {
                        newMap.set(interactionKey, originalRating);
                    } else {
                        newMap.delete(interactionKey);
                    }
                    interactionRatingsRef.current = newMap;
                    return newMap;
                });
                originalRatingsRef.current.delete(interactionKey);
                toast.error('Unable to save: interaction not found');
                return;
            }
            
            // Create abort controller
            const controller = new AbortController();
            abortControllersRef.current.set(interactionKey, controller);
            
            const partnerUsername = currentInteraction.paired_with.username;
            const lobbyId = currentInteraction.lobby_id;
            
            console.log('[PairedHistory] Updating rating:', {
                partner_username: partnerUsername,
                lobby_id: lobbyId,
                rating: rating,
                previous_rating: originalRating
            });
            
            try {
                const result = await updatePairedInteraction(
                    lobbyId,
                    partnerUsername,
                    { partner_star_rating: rating },
                    controller.signal
                );
                
                if (!isMountedRef.current) return;
                
                // Clean up
                abortControllersRef.current.delete(interactionKey);
                
                if (result.success) {
                    // Success: clear original value (committed)
                    originalRatingsRef.current.delete(interactionKey);
                    console.log('[PairedHistory] Rating update successful:', {
                        partner_username: partnerUsername,
                        lobby_id: lobbyId,
                        rating: rating,
                        response: result.data
                    });
                    toast.success('Saved', {
                        duration: 1000,
                        style: {
                            background: '#144dff',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }
                    });
                } else {
                    // Error: rollback
                    console.error('[PairedHistory] Rating update failed:', {
                        partner_username: partnerUsername,
                        lobby_id: lobbyId,
                        rating: rating,
                        error: result.error
                    });
                    setInteractionRatings(prev => {
                        const newMap = new Map(prev);
                        if (originalRating !== null && originalRating !== undefined) {
                            newMap.set(interactionKey, originalRating);
                        } else {
                            newMap.delete(interactionKey);
                        }
                        interactionRatingsRef.current = newMap;
                        return newMap;
                    });
                    originalRatingsRef.current.delete(interactionKey);
                    toast.error(result.error || 'Failed to save. Please try again.');
                }
            } catch (err) {
                if (!isMountedRef.current) return;
                abortControllersRef.current.delete(interactionKey);
                
                if (err.name === 'AbortError') {
                    // Silent - new request in progress
                    console.log('[PairedHistory] Rating update aborted:', {
                        partner_username: partnerUsername,
                        lobby_id: lobbyId
                    });
                    return;
                }
                
                // Rollback on error
                console.error('[PairedHistory] Rating update error:', {
                    partner_username: partnerUsername,
                    lobby_id: lobbyId,
                    rating: rating,
                    error: err.message
                });
                setInteractionRatings(prev => {
                    const newMap = new Map(prev);
                    if (originalRating !== null && originalRating !== undefined) {
                        newMap.set(interactionKey, originalRating);
                    } else {
                        newMap.delete(interactionKey);
                    }
                    interactionRatingsRef.current = newMap;
                    return newMap;
                });
                originalRatingsRef.current.delete(interactionKey);
                toast.error(err.message || 'Failed to save. Please try again.');
            }
        }, 500);
        
        debounceTimersRef.current.set(interactionKey, timerId);
    }, [clearPendingUpdates, requiresEmailSetup, hasSocialLinks, navigate]);
    
    const handleShareContactChange = useCallback((interactionKey, value) => {
        // Redirect to post-event-auth if user came from lobby and hasn't verified email
        if (requiresEmailSetup) {
            navigate('/post-event-auth');
            return;
        }
        
        // Nudge users with no social links to set up their profile after 2 actions
        if (!hasSocialLinks) {
            interactionCountRef.current += 1;
            if (interactionCountRef.current >= 2) {
                navigate('/post-event-auth');
                return;
            }
        }
        
        // Use interactionsRef.current to avoid stale closure
        const interaction = findInteractionByKey(interactionsRef.current, interactionKey);
        
        // Validation
        if (!interaction?.lobby_id || !interaction.paired_with?.username) {
            toast.error('Unable to save: interaction not found');
            return;
        }
        
        // Get original value (committed value at start of change sequence)
        let originalShareContact = originalShareContactRef.current.get(interactionKey);
        if (originalShareContact === undefined) {
            // First change in sequence - capture current committed value
            const currentShareContact = interactionShareContactRef.current.get(interactionKey);
            const backendShareContact = interaction.user_show_contact;
            const committedShareContact = currentShareContact ?? 
                                        (backendShareContact !== null && typeof backendShareContact === 'boolean'
                                         ? backendShareContact : null);
            originalShareContact = committedShareContact;
            originalShareContactRef.current.set(interactionKey, originalShareContact);
        }
        
        // Cancel previous operations
        clearPendingUpdates(interactionKey);
        
        // Optimistic update (state + ref)
        setInteractionShareContact(prev => {
            const newMap = new Map(prev);
            newMap.set(interactionKey, value);
            interactionShareContactRef.current = newMap; // Sync ref
            return newMap;
        });
        
        // Set debounce timer (300ms)
        const timerId = setTimeout(async () => {
            // Check mount
            if (!isMountedRef.current) return;
            
            // Re-find interaction (might have changed via polling)
            const currentInteraction = findInteractionByKey(interactionsRef.current, interactionKey);
            if (!currentInteraction?.lobby_id || !currentInteraction.paired_with?.username) {
                // Interaction not found - rollback
                if (!isMountedRef.current) return;
                setInteractionShareContact(prev => {
                    const newMap = new Map(prev);
                    if (originalShareContact !== null && originalShareContact !== undefined) {
                        newMap.set(interactionKey, originalShareContact);
                    } else {
                        newMap.delete(interactionKey);
                    }
                    interactionShareContactRef.current = newMap;
                    return newMap;
                });
                originalShareContactRef.current.delete(interactionKey);
                toast.error('Unable to save: interaction not found');
                return;
            }
            
            // Create abort controller
            const controller = new AbortController();
            abortControllersRef.current.set(interactionKey, controller);
            
            const partnerUsername = currentInteraction.paired_with.username;
            const lobbyId = currentInteraction.lobby_id;
            
            console.log('[PairedHistory] Updating share contact:', {
                partner_username: partnerUsername,
                lobby_id: lobbyId,
                user_show_contact: value,
                previous_value: originalShareContact
            });
            
            try {
                const result = await updatePairedInteraction(
                    lobbyId,
                    partnerUsername,
                    { user_show_contact: value },
                    controller.signal
                );
                
                if (!isMountedRef.current) return;
                
                // Clean up
                abortControllersRef.current.delete(interactionKey);
                
                if (result.success) {
                    // Success: clear original value (committed)
                    originalShareContactRef.current.delete(interactionKey);
                    console.log('[PairedHistory] Share contact update successful:', {
                        partner_username: partnerUsername,
                        lobby_id: lobbyId,
                        user_show_contact: value,
                        response: result.data
                    });
                    toast.success('Saved', {
                        duration: 1000,
                        style: {
                            background: '#144dff',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }
                    });
                } else {
                    // Error: rollback
                    console.error('[PairedHistory] Share contact update failed:', {
                        partner_username: partnerUsername,
                        lobby_id: lobbyId,
                        user_show_contact: value,
                        error: result.error
                    });
                    setInteractionShareContact(prev => {
                        const newMap = new Map(prev);
                        if (originalShareContact !== null && originalShareContact !== undefined) {
                            newMap.set(interactionKey, originalShareContact);
                        } else {
                            newMap.delete(interactionKey);
                        }
                        interactionShareContactRef.current = newMap;
                        return newMap;
                    });
                    originalShareContactRef.current.delete(interactionKey);
                    toast.error(result.error || 'Failed to save. Please try again.');
                }
            } catch (err) {
                if (!isMountedRef.current) return;
                abortControllersRef.current.delete(interactionKey);
                
                if (err.name === 'AbortError') {
                    // Silent - new request in progress
                    console.log('[PairedHistory] Share contact update aborted:', {
                        partner_username: partnerUsername,
                        lobby_id: lobbyId
                    });
                    return;
                }
                
                // Rollback on error
                console.error('[PairedHistory] Share contact update error:', {
                    partner_username: partnerUsername,
                    lobby_id: lobbyId,
                    user_show_contact: value,
                    error: err.message
                });
                setInteractionShareContact(prev => {
                    const newMap = new Map(prev);
                    if (originalShareContact !== null && originalShareContact !== undefined) {
                        newMap.set(interactionKey, originalShareContact);
                    } else {
                        newMap.delete(interactionKey);
                    }
                    interactionShareContactRef.current = newMap;
                    return newMap;
                });
                originalShareContactRef.current.delete(interactionKey);
                toast.error(err.message || 'Failed to save. Please try again.');
            }
        }, 300);
        
        debounceTimersRef.current.set(interactionKey, timerId);
    }, [clearPendingUpdates, requiresEmailSetup, hasSocialLinks, navigate]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            
            // Clear new info timeout
            if (newInfoTimeoutRef.current) {
                clearTimeout(newInfoTimeoutRef.current);
            }
            
            // Abort all pending API requests
            abortControllersRef.current.forEach(controller => {
                controller.abort();
            });
            
            // Clear all debounce timers
            debounceTimersRef.current.forEach(timer => {
                clearTimeout(timer);
            });
            
            // Clear refs
            debounceTimersRef.current.clear();
            abortControllersRef.current.clear();
            originalRatingsRef.current.clear();
            originalShareContactRef.current.clear();
        };
    }, []);
    
    // Show fullscreen spinner while checking auth
    if (isAuthLoading) {
        return <LoadingSpinner fullScreen />;
    }
    
    return (
        <div className="paired-player-history-container">
            <Toaster position="top-center" />
            
            <button 
                onClick={() => navigate('/')} 
                className="history-home-button"
            >
                Home
            </button>
            
            <button 
                onClick={() => navigate('/post-event-auth')} 
                className="history-profile-button"
            >
                <div className="history-profile-avatar">
                    <img 
                        src={userProfile?.image_data ? `data:image/jpeg;base64,${userProfile.image_data}` : '/assets/avatar_3.png'} 
                        alt="Profile" 
                    />
                </div>
                Profile
            </button>
            
            {/* "New Notifications" indicator */}
            {newInfoIndicator && (
                <div className="new-info-indicator">
                    New Notifications
                </div>
            )}
            
            <div className="paired-player-history-content">
                <h1 className="paired-player-history-title">View Your Matches</h1>
                
                {/* Loading state - initial load */}
                {isLoading && (
                    <div className="loading-grid">
                        {Array.from({ length: 30 }).map((_, index) => (
                            <InlineLoadingSpinner key={index} size={60} />
                        ))}
                    </div>
                )}
                
                {/* Empty state */}
                {!isLoading && interactions.length === 0 && (
                    <div className="empty-state">
                        <p>No Past History Available</p>
                    </div>
                )}
                
                {/* Interaction list */}
                {!isLoading && interactions.length > 0 && (
                    <div className="interactions-list">
                        {interactions.map((interaction, index) => {
                            const partner = interaction.paired_with || {};
                            const imageSrc = formatImageData(partner.image_data);
                            const interactionKey = getInteractionKey(interaction, index);
                            
                            // Get current rating and share contact from Maps (fallback to backend values)
                            const currentRating = interactionRatings.get(interactionKey) ?? 
                                                 (interaction.partner_star_rating !== null && 
                                                  interaction.partner_star_rating >= 1 && 
                                                  interaction.partner_star_rating <= 5 
                                                  ? interaction.partner_star_rating : null);
                            
                            const currentShareContact = interactionShareContact.has(interactionKey) 
                                                       ? interactionShareContact.get(interactionKey)
                                                       : (interaction.user_show_contact !== null && 
                                                          typeof interaction.user_show_contact === 'boolean'
                                                          ? interaction.user_show_contact : null);
                            
                            // Check if contact info should be shown
                            const shouldShowContact = interaction.partner_show_contact === true;
                            const hasSocialLinks = shouldShowContact && hasAnySocialLinks(partner.social_links);
                            const hasLegacyContactUrl = shouldShowContact && partner.contact_url && !hasSocialLinks;
                            
                            return (
                                <div key={interactionKey} className="interaction-card">
                                    <div className="interaction-card-main">
                                        {/* Left Column: Profile Image and Name */}
                                        <div className="interaction-card-left">
                                            <div className="interaction-card-image">
                                                <img 
                                                    src={imageSrc} 
                                                    alt={partner.name || 'Partner'} 
                                                    onError={(e) => {
                                                        e.target.src = '/assets/fakeprofile.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="interaction-card-name">
                                                {partner.name || partner.username || 'Unknown'}
                                            </div>
                                        </div>
                                        
                                        {/* Right Column: Star Rating and Share Contact */}
                                        <div className="interaction-card-right">
                                            <StarRating
                                                rating={currentRating}
                                                onRatingChange={(rating) => handleRatingChange(interactionKey, rating)}
                                                interactionKey={interactionKey}
                                            />
                                            <ShareContactToggle
                                                value={currentShareContact}
                                                onChange={(value) => handleShareContactChange(interactionKey, value)}
                                                interactionKey={interactionKey}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Contact Info Section - Shows for both social links and legacy contact_url */}
                                    {(hasSocialLinks || hasLegacyContactUrl) && (
                                        <div className="contact-info-section">
                                            <div className="social-links-header">
                                                {partner.name ? `${partner.name}'s contact info` : 'Contact info'}
                                            </div>
                                            
                                            {/* Social Links */}
                                            {hasSocialLinks && (
                                                <div className="social-links-display">
                                                    {SOCIAL_PLATFORM_ORDER.map((platform) => {
                                                        const value = partner.social_links?.[platform];
                                                        if (!value || !value.trim()) return null;
                                                        
                                                        const { label, Icon, color, displayPrefix } = getSocialPlatformInfo(platform);
                                                        const url = buildSocialLinkUrl(platform, value);
                                                        const displayValue = displayPrefix + value;
                                                        
                                                        return (
                                                            <a 
                                                                key={platform}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="social-link-item"
                                                                title={label}
                                                            >
                                                                <span className="social-link-icon">
                                                                    <Icon size={16} color={color} />
                                                                </span>
                                                                <span className="social-link-value">{displayValue}</span>
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            {/* Legacy Contact URL - Fallback for old users without social_links */}
                                            {hasLegacyContactUrl && (
                                                <div className="interaction-card-contact-row">
                                                    <img 
                                                        src="/assets/contact_url_asset.png" 
                                                        alt="Contact" 
                                                        className="contact-url-icon"
                                                    />
                                                    <a 
                                                        href={partner.contact_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="contact-url-link"
                                                        title={partner.contact_url}
                                                    >
                                                        {partner.contact_url}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        {/* Infinite scroll sentinel */}
                        {hasMore && (
                            <div 
                                ref={sentinelRef}
                                data-sentinel="true"
                                className="infinite-scroll-sentinel"
                            >
                                {isLoadingMore && <InlineLoadingSpinner size={40} />}
                            </div>
                        )}
                        
                        {/* No more interactions message */}
                        {!hasMore && (
                            <div className="no-more-interactions">
                                No more interactions
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PairedPlayerHistory;
