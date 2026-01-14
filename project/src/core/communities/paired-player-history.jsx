import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Auth/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import './paired-player-history.css';

// Loading Spinner Component
const LoadingSpinner = ({ size = 60, className = '' }) => {
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
    const { checkAuth, user } = useContext(AuthContext);
    
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
    
    // Data fetching function
    const fetchInteractions = useCallback(async (offset, isInitialLoad, isPollingUpdate) => {
        // Prevent race conditions
        if (isFetchingRef.current) {
            return;
        }
        isFetchingRef.current = true;
        
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                if (isMountedRef.current) {
                    navigate('/');
                }
                return;
            }
            
            const url = `${window.server_url}/paired-player-history?offset=${offset}&limit=30`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
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
        
        // Only do initial load once
        if (hasInitialLoadRef.current) {
            return;
        }
        
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/');
            return;
        }
        
        hasInitialLoadRef.current = true;
        
        // Call checkAuth but don't wait for it
        checkAuth();
        
        // Initial fetch - check token exists, then fetch immediately
        fetchInteractions(0, true, false);
        
        return () => {
            isMountedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount
    
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
        setInteractionRatings(prev => {
            const newMap = new Map(prev);
            newMap.set(interactionKey, rating);
            return newMap;
        });
    }, []);
    
    const handleShareContactChange = useCallback((interactionKey, value) => {
        setInteractionShareContact(prev => {
            const newMap = new Map(prev);
            newMap.set(interactionKey, value);
            return newMap;
        });
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (newInfoTimeoutRef.current) {
                clearTimeout(newInfoTimeoutRef.current);
            }
        };
    }, []);
    
    return (
        <div className="paired-player-history-container">
            <Toaster position="top-center" />
            
            {/* "New Notifications" indicator */}
            {newInfoIndicator && (
                <div className="new-info-indicator">
                    New Notifications
                </div>
            )}
            
            <div className="paired-player-history-content">
                <h1 className="paired-player-history-title">Paired Player History</h1>
                
                {/* Loading state - initial load */}
                {isLoading && (
                    <div className="loading-grid">
                        {Array.from({ length: 30 }).map((_, index) => (
                            <LoadingSpinner key={index} size={60} />
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
                            
                            // Check if contact URL should be shown
                            const showContactUrl = partner.contact_url && interaction.partner_show_contact === true;
                            
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
                                    
                                    {/* Contact URL Row - Full Width */}
                                    {showContactUrl && (
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
                            );
                        })}
                        
                        {/* Infinite scroll sentinel */}
                        {hasMore && (
                            <div 
                                ref={sentinelRef}
                                data-sentinel="true"
                                className="infinite-scroll-sentinel"
                            >
                                {isLoadingMore && <LoadingSpinner size={40} />}
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
