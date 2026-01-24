import React, { useEffect, useState, useRef, useContext} from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const ProfileCard = ({ profile }) => {
    const linkedinIconSvg="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    const [isExpanded, setIsExpanded] = useState(false);

    const profileCardStyles = {
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(20, 77, 255, 0.15)',
            padding: '1.5rem', // Reduced from 2rem to 1.5rem
            margin: '0.5rem', // Reduced from 1rem to 0.5rem
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            maxWidth: '420px',
            border: '1px solid rgba(20, 77, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
        },
        heading: {
            color: '#144dff',
            fontSize: '1.8rem',
            marginBottom: '1rem', // Reduced from 1.5rem to 1rem
            fontWeight: '700',
            letterSpacing: '-0.5px',
            textAlign: 'center'
        },
        imageContainer: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1rem', // Reduced from 1.5rem to 1rem
            position: 'relative'
        },
        image: {
            width: '120px',
            height: '120px',
            borderRadius: '60px',
            objectFit: 'cover',
            border: '4px solid #144dff',
            boxShadow: '0 8px 24px rgba(20, 77, 255, 0.3)',
            transition: 'transform 0.3s ease'
        },
        description: {
            color: '#4a5568',
            fontSize: '1.1rem',
            lineHeight: '1.7',
            marginBottom: '0.75rem', // Reduced from 1rem to 0.75rem
            display: '-webkit-box',
            WebkitLineClamp: isExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: isExpanded ? 'unset' : 'ellipsis',
            textAlign: 'center'
        },
        expandButton: {
            background: 'linear-gradient(135deg, #144dff, #3b82f6)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '8px 16px',
            fontSize: '0.9rem',
            fontWeight: '600',
            borderRadius: '20px',
            transition: 'all 0.2s ease',
            display: 'block',
            margin: '0 auto 0.75rem', // Reduced from 1rem to 0.75rem
            boxShadow: '0 4px 12px rgba(20, 77, 255, 0.3)'
        },
        linksContainer: {
            marginTop: '1rem', // Reduced from 1.5rem to 1rem
            padding: '1rem 0 0', // Reduced from 1.5rem to 1rem
            borderTop: '2px solid rgba(20, 77, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem' // Reduced from 0.75rem to 0.5rem
        },
        linkItem: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: '#144dff',
            textDecoration: 'none',
            padding: '10px 16px', // Reduced from 12px to 10px
            borderRadius: '12px',
            background: 'rgba(20, 77, 255, 0.05)',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            border: '1px solid rgba(20, 77, 255, 0.1)'
        }
    };

    const descriptionRef = useRef(null);
    const [needsExpansion, setNeedsExpansion] = useState(false);

    useEffect(() => {
        if (descriptionRef.current) {
            const element = descriptionRef.current;
            setNeedsExpansion(element.scrollHeight > element.clientHeight);
        }
    }, [profile.description]);

    return (
        <div 
            className="profile-card" 
            style={profileCardStyles.card}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(20, 77, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(20, 77, 255, 0.15)';
            }}
        >
            <h2 style={profileCardStyles.heading}>{profile.name}</h2>
            <div style={profileCardStyles.imageContainer}>
                <img 
                    src={`data:image/jpeg;base64,${profile.small_image_data}`} 
                    alt={`${profile.name}'s profile`} 
                    style={profileCardStyles.image}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
            </div>
            
            <div>
                <p ref={descriptionRef} style={profileCardStyles.description}>{profile.description}</p>
                {needsExpansion && (
                    <button 
                        style={profileCardStyles.expandButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(20, 77, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(20, 77, 255, 0.3)';
                        }}
                    >
                        {isExpanded ? '▲ Show less' : '▼ Read more'}
                    </button>
                )}
            </div>
            
            <div style={profileCardStyles.linksContainer}>
                {profile.media_link?.startsWith('https://www.linkedin.com/') ? (
                    <>
                        <a 
                            href={profile.media_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={profileCardStyles.linkItem}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(20, 77, 255, 0.1)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(20, 77, 255, 0.05)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d={linkedinIconSvg}/>
                            </svg>
                            <span style={{ fontWeight: '600' }}>LinkedIn Profile</span>
                        </a>

                        {profile.other_link && (
                            <a 
                                href={profile.other_link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={profileCardStyles.linkItem}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(20, 77, 255, 0.1)';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(20, 77, 255, 0.05)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <span>🌐 {profile.other_link?.length > 35 ? profile.other_link.substring(0, 35) + '...' : profile.other_link}</span>
                            </a>
                        )}
                    </>
                ) : (
                    <>
                        {profile.media_link && (
                            <a 
                                href={profile.media_link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={profileCardStyles.linkItem}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(20, 77, 255, 0.1)';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(20, 77, 255, 0.05)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <span>🔗 {profile.media_link?.length > 35 ? profile.media_link.substring(0, 35) + '...' : profile.media_link}</span>
                            </a>
                        )}
                        {profile.other_link && (
                            <a 
                                href={profile.other_link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={profileCardStyles.linkItem}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(20, 77, 255, 0.1)';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(20, 77, 255, 0.05)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <span>🌐 {profile.other_link?.length > 35 ? profile.other_link.substring(0, 35) + '...' : profile.other_link}</span>
                            </a>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function MyCF() {
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState(null)
  const [showCreateProfilePopup, setShowCreateProfilePopup] = useState(false)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)


  const fetchProfiles = async () => {
    try {
      const response = await apiFetch('/cofounder_data')
      if (!response.ok) throw new Error('Failed to fetch profiles')
      const data = await response.json()
      setProfiles(data)
      console.log("PROFILE DATA", data)
    } catch (err) {
      console.error('Error fetching profiles:', err)
      setError(err.message)
    }
  }

  // delete community profile
  const deleteCommunityProfile = async () => {
    const response = await apiFetch('/delete_community_profile', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to delete community profile')
    const data = await response.json()
    console.log(data)
    // Fetch updated profiles after successful deletion
    await fetchProfiles()
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Find the user's own profile to delete
      await deleteCommunityProfile();
      setShowDeletePopup(false);
      // Wait 1 second before closing
      setTimeout(() => {
        setIsDeleting(false);
      }, 1000);
    } catch (error) {
      console.error('Error deleting profile:', error);
      setIsDeleting(false);
    }
  }

  const handleProfileCreated = async () => {
    try {
      await fetchProfiles();
    } catch (error) {
      console.error('Error fetching profiles after creation:', error);
      // Retry once after 1 second
      setTimeout(async () => {
        try {
          await fetchProfiles();
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          // Show user-friendly message: "Profile created! Please refresh to see it."
          setError("Profile created successfully! Please refresh the page to see your new profile.");
        }
      }, 1000);
    }
  }

  const pageStyles = {
    container: {
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #f5f7ff 0%, #e8ecf7 100%)',
      padding: '1rem 0', // Reduced from 2rem to 1rem
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      margin: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    headerContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '1.5rem', // Reduced from 3rem to 1.5rem
      width: '100%',
      maxWidth: '1200px',
      position: 'relative',
      padding: '0 1rem'
    },
    logoContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '-3.0rem', // Added small margin back
      marginTop: '-1rem'
    },
    logo: {
      maxWidth: '85px',
      height: 'auto',
      objectFit: 'contain'
    },
    headerTitle: {
      fontSize: '2.0rem',
      color: '#144dff',
      marginBottom: '1.2rem',
      fontWeight: '800',
      textAlign: 'center',
      textShadow: '2px 2px 8px rgba(20, 77, 255, 0.15)',
      lineHeight: '1.2', 
      letterSpacing: '-0.02em',
      background: 'linear-gradient(135deg, #144dff 0%, #3b82f6 100%, #144dff 200%)',
      backgroundSize: '200% 100%',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    buttonContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #144dff, #3b82f6)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      padding: '14px 28px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontWeight: '600',
      boxShadow: '0 8px 24px rgba(20, 77, 255, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    },
    deleteButton: {
      background: 'linear-gradient(135deg, #ff4444, #dc2626)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      padding: '14px 28px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontWeight: '600',
      boxShadow: '0 8px 24px rgba(255, 68, 68, 0.3)'
    },
    backButton: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      padding: '14px 28px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontWeight: '600',
      boxShadow: '0 8px 24px rgba(107, 114, 128, 0.3)',
      zIndex: 1000
    },
    profilesWrapper: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      padding: '0 1rem'
    },
    profilesContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '1rem', // Reduced from 2rem to 1rem
      maxWidth: '1400px',
      width: '100%'
    },
    loadingState: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      fontSize: '1.2rem',
      color: '#144dff',
      width: '100%'
    },
    errorState: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      fontSize: '1.2rem',
      color: '#dc2626',
      background: 'rgba(220, 38, 38, 0.1)',
      borderRadius: '16px',
      padding: '2rem',
      margin: '2rem auto',
      maxWidth: '600px'
    }
  };

  const popupStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(20, 77, 255, 0.15)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.3s ease-out'
    },
    popup: {
      backgroundColor: '#fff',
      padding: '2.5rem',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(20, 77, 255, 0.3)',
      textAlign: 'center',
      maxWidth: '450px',
      width: '90%',
      border: '1px solid rgba(20, 77, 255, 0.1)',
      animation: 'slideUp 0.3s ease-out'
    },
    title: {
      color: '#144dff',
      marginBottom: '1.5rem',
      fontSize: '1.8rem',
      fontWeight: '700'
    },
    message: {
      color: '#4b5563',
      marginBottom: '2rem',
      fontSize: '1.1rem',
      lineHeight: '1.6'
    },
    buttonContainer: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center'
    },
    cancelButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      transition: 'all 0.2s ease'
    },
    confirmButton: {
      backgroundColor: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      transition: 'all 0.2s ease'
    }
  };

  useEffect(() => {
    fetchProfiles()
  }, [])

  if (error) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.errorState}>
          Error loading profiles: {error}
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyles.container}>
      {/* Header Section */}
      <div style={pageStyles.headerContainer}>
        <div style={pageStyles.logoContainer}>
          <img 
            src="/assets/reuneo_test_8.png"
            alt="Reunio Logo"
            style={pageStyles.logo}
          />
        </div>
        
        <h1 style={pageStyles.headerTitle}>
          Co-Founder<br/>Network
        </h1>
        
        <div style={pageStyles.buttonContainer}>
          <button 
            style={pageStyles.primaryButton}
            onClick={() => setShowCreateProfilePopup(true)}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 32px rgba(20, 77, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 24px rgba(20, 77, 255, 0.3)';
            }}
          >
            Create Profile
          </button>
          
          <button 
            style={pageStyles.deleteButton}
            onClick={() => setShowDeletePopup(true)}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 32px rgba(255, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 24px rgba(255, 68, 68, 0.3)';
            }}
          >
            Delete Profile
          </button>
        </div>
      </div>

      {/* Back Button */}
      <button
        style={pageStyles.backButton}
        onClick={() => window.history.back()}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-3px)';
          e.target.style.boxShadow = '0 12px 32px rgba(107, 114, 128, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 8px 24px rgba(107, 114, 128, 0.3)';
        }}
      >
        Back
      </button>

      {/* Profiles Section */}
      {profiles.length === 0 ? (
        <div style={pageStyles.loadingState}>
          Loading amazing co-founders...
        </div>
      ) : (
        <div style={pageStyles.profilesWrapper}>
          <div style={pageStyles.profilesContainer}>
            {profiles.map((profile) => (
              <ProfileCard 
                key={profile.id || `profile-${profile.name}-${Math.random()}`} 
                profile={profile} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Popups */}
      {showCreateProfilePopup && (
        <CreateProfilePopup 
          onClose={() => setShowCreateProfilePopup(false)}
          onProfileCreated={handleProfileCreated}
        /> 
      )}

      {showDeletePopup && (
        <div style={popupStyles.overlay}>
          <div style={popupStyles.popup}>
            <h3 style={popupStyles.title}>Delete Profile</h3>
            <p style={popupStyles.message}>
              Are you sure you want to delete your community profile? This action cannot be undone.
            </p>
            <div style={popupStyles.buttonContainer}>
              <button 
                style={popupStyles.cancelButton}
                onClick={() => setShowDeletePopup(false)}
                disabled={isDeleting}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
              >
                Cancel
              </button>
              <button 
                style={popupStyles.confirmButton}
                onClick={handleDelete}
                disabled={isDeleting}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const YouNeedToLoginPopup = ({ onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 1000);
        
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(20, 77, 255, 0.3)',
            zIndex: 1000,
            textAlign: 'center',
            border: '1px solid rgba(20, 77, 255, 0.1)'
        }}>
            <h1 style={{ color: '#144dff', fontSize: '1.5rem', margin: 0 }}>
                You need to login to create a community profile
            </h1>
        </div>
    )
}

const CreateProfilePopup = ({ onClose, onProfileCreated }) => {
    const { user, userProfile, checkAuth, permissions } = useContext(AuthContext);
    if (!userProfile) {
        return <YouNeedToLoginPopup onClose={onClose} />
    }
    const [description, setDescription] = useState('')
    const [media_link, setMediaLink] = useState('')
    const [other_link, setOtherLink] = useState('')
    const [creatingProfile, setCreatingProfile] = useState(false)
    const [profile, setProfile] = useState(null)
    const [error, setError] = useState(null)
    const [errorMessage, setErrorMessage] = useState()

    const makeCommunityProfile = async (name, description, media_link, other_link) => {
        const response = await apiFetch('/create_community_profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                description: description,
                small_image_data: userProfile.small_image_data,
                media_link: media_link,
                other_link: other_link
            })
        })
        
        if (!response.ok) {
            const errorData = await response.json()
            console.log("ERROR DATA", errorData)
            setErrorMessage(errorData.detail)
            return false
        }else{
            const data = await response.json()
            return true
        }
  }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setCreatingProfile(true)
        const success = await makeCommunityProfile(profile.name, profile.description, profile.media_link, profile.other_link)
        if (success) {
            setErrorMessage(null)
            setCreatingProfile(false)
            // Update the profiles list to show the new profile immediately
            if (onProfileCreated) {
                await onProfileCreated()
            }
            setTimeout(() => {
                onClose()
            }, 1000)
        }
    }

    useEffect(() => {
        setProfile({
            name: userProfile.name,
            small_image_data: userProfile.small_image_data,
            description: description,
            media_link: media_link,
            other_link: other_link
        });
    }, [description, media_link, other_link, userProfile]);
    
    const popupStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(20, 77, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            overflow: 'auto',
            padding: '20px',
            boxSizing: 'border-box'
        },
        popup: {
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(20, 77, 255, 0.3)',
            position: 'relative',
            width: '95%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: '0 auto',
            border: '1px solid rgba(20, 77, 255, 0.1)'
        },
        closeButton: {
            position: 'absolute',
            top: '15px',
            right: '15px',
            border: 'none',
            background: 'none',
            fontSize: '2rem',
            cursor: 'pointer',
            color: '#144dff',
            transition: 'all 0.2s ease',
            padding: '5px',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            marginTop: '1rem'
        },
        textarea: {
            padding: '1rem',
            borderRadius: '12px',
            border: '2px solid rgba(20, 77, 255, 0.2)',
            minHeight: '120px',
            fontSize: '16px',
            resize: 'vertical',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s ease',
            backgroundColor: '#f9fafb'
        },
        input: {
            padding: '1rem',
            borderRadius: '12px',
            border: '2px solid rgba(20, 77, 255, 0.2)',
            fontSize: '16px',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s ease',
            backgroundColor: '#f9fafb'
        },
        submitButton: {
            background: 'linear-gradient(135deg, #144dff, #3b82f6)',
            color: 'white',
            padding: '1rem',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: '0.5rem',
            width: '100%',
            boxSizing: 'border-box',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(20, 77, 255, 0.3)'
        },
        title: {
            color: '#144dff',
            marginBottom: '1.5rem',
            fontSize: '2rem',
            textAlign: 'center',
            wordWrap: 'break-word',
            fontWeight: '700'
        },
        errorMessage: {
            color: '#dc2626',
            textAlign: 'center',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            border: '1px solid rgba(220, 38, 38, 0.2)'
        }
    };

    return (
        <div className="popup-overlay" style={popupStyles.overlay}>
            <div className="create-profile-popup" style={popupStyles.popup}>
                {errorMessage && (
                    <div style={popupStyles.errorMessage}>
                        {errorMessage}
                    </div>
                )}
                
                <h2 style={popupStyles.title}>Create Community Profile</h2>
                
                {profile && (
                    <ProfileCard profile={profile} edit={true}/>
                )}

                <form onSubmit={handleSubmit} style={popupStyles.form}>
                    <textarea 
                        name="description" 
                        placeholder="Tell us about yourself..." 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        style={popupStyles.textarea}
                        onFocus={(e) => e.target.style.borderColor = '#144dff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(20, 77, 255, 0.2)'}
                    />
                    <input 
                        type="text" 
                        name="media_link" 
                        placeholder="Add your social media link (optional)" 
                        value={media_link} 
                        onChange={(e) => setMediaLink(e.target.value)}
                        style={popupStyles.input}
                        onFocus={(e) => e.target.style.borderColor = '#144dff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(20, 77, 255, 0.2)'}
                    />
                    <input 
                        type="text" 
                        name="other_link" 
                        placeholder="Add your website or other link (optional)" 
                        value={other_link} 
                        onChange={(e) => setOtherLink(e.target.value)}
                        style={popupStyles.input}
                        onFocus={(e) => e.target.style.borderColor = '#144dff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(20, 77, 255, 0.2)'}
                    />
                    <button 
                        type="submit"
                        style={popupStyles.submitButton}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 12px 32px rgba(20, 77, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 8px 24px rgba(20, 77, 255, 0.3)';
                        }}
                        disabled={creatingProfile}
                    >
                        {creatingProfile ? 'Creating...' : 'Create Profile'}
                    </button>
                </form>
                
                <button 
                    onClick={onClose}
                    style={popupStyles.closeButton}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(20, 77, 255, 0.1)';
                        e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    )
}

const CommunityPageButton = ({left_position="50%", top_position="20px", position="fixed"}) => {
    const navigate = useNavigate();

    const buttonStyles = {
        position: position,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        top: top_position,
        left: left_position,
        transform: 'translateX(-50%)',
        zIndex: 100,
        borderRadius: '14px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontFamily: 'Helvetica, sans-serif',
        fontSize: '0.9rem',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
        transition: 'all 0.3s ease',
        color: '#f5f7ff',
        boxShadow: '0 7px 4px rgba(0, 0, 0, 0.1)',
        background: 'linear-gradient(135deg, #144dff, #3b82f6)',
        padding: '12px 20px'
    };
    
    return (
        <button 
            onClick={() => navigate('/cofounders')}
            style={buttonStyles}
            onMouseEnter={(e) => {
                e.target.style.transform = 'translateX(-50%) translateY(-2px)';
                e.target.style.boxShadow = '0 12px 24px rgba(20, 77, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
                e.target.style.transform = 'translateX(-50%) translateY(0)';
                e.target.style.boxShadow = '0 7px 4px rgba(0, 0, 0, 0.1)';
            }}
        >
            Co-Founders<br/>Network
        </button>
    )
}

export { CommunityPageButton };
export default MyCF;