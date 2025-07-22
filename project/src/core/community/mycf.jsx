import React, { useEffect, useState, useRef, useContext} from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const ProfileCard = ({ profile }) => {
    const linkedinIconSvg="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    const [isExpanded, setIsExpanded] = useState(false);

    const profileCardStyles = {
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '32px',
            margin: '24px',
            transition: 'all 0.3s ease-in-out',
            cursor: 'pointer',
            maxWidth: '400px',
            border: '1px solid rgba(234,234,234,0.5)',
            '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.18)'
            }
        },
        heading: {
            color: '#1a202c',
            fontSize: '1.75rem',
            marginBottom: '16px',
            fontWeight: '700',
            letterSpacing: '-0.5px'
        },
        image: {
            width: '120px',
            height: '120px',
            borderRadius: '60px',
            objectFit: 'cover',
            border: '3px solid #edf2f7',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        },
        description: {
            color: '#4a5568',
            fontSize: '1.1rem',
            lineHeight: '1.7',
            marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: isExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: isExpanded ? 'unset' : 'ellipsis'
        },
        expandButton: {
            background: 'none',
            border: 'none',
            color: '#3182ce',
            cursor: 'pointer',
            padding: '8px 0',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'color 0.2s ease'
        },
        linksContainer: {
            marginTop: '24px',
            padding: '16px 0',
            borderTop: '1px solid #edf2f7'
        },
        linkItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#0077B5',
            textDecoration: 'none',
            padding: '8px 0',
            transition: 'transform 0.2s ease',
            '&:hover': {
                transform: 'translateX(4px)'
            }
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
        <div className="profile-card" style={profileCardStyles.card}>
            <h2 style={profileCardStyles.heading}>{profile.name}</h2>
            <img src={`data:image/jpeg;base64,${profile.small_image_data}`} alt={`${profile.name}'s profile`} style={profileCardStyles.image} />
            
            <div style={{ marginTop: '24px' }}>
                <p ref={descriptionRef} style={profileCardStyles.description}>{profile.description}</p>
                {needsExpansion && (
                    <button 
                        style={profileCardStyles.expandButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        {isExpanded ? '▲ Show less' : '▼ Read more'}
                    </button>
                )}
            </div>
            
            <div style={profileCardStyles.linksContainer}>
                {profile.media_link?.startsWith('https://www.linkedin.com/') ? (
                    <>
                        <a href={profile.media_link} target="_blank" rel="noopener noreferrer" style={profileCardStyles.linkItem}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d={linkedinIconSvg}/>
                            </svg>
                            <span style={{ fontWeight: '600' }}>LinkedIn Profile</span>
                        </a>

                        {profile.other_link && (
                            <a href={profile.other_link} target="_blank" rel="noopener noreferrer" style={profileCardStyles.linkItem}>
                                <span>🌐 {profile.other_link?.length > 35 ? profile.other_link.substring(0, 35) + '...' : profile.other_link}</span>
                            </a>
                        )}
                    </>
                ) : (
                    <>
                        {profile.media_link && (
                            <a href={profile.media_link} target="_blank" rel="noopener noreferrer" style={profileCardStyles.linkItem}>
                                <span>🔗 {profile.media_link?.length > 35 ? profile.media_link.substring(0, 35) + '...' : profile.media_link}</span>
                            </a>
                        )}
                        {profile.other_link && (
                            <a href={profile.other_link} target="_blank" rel="noopener noreferrer" style={profileCardStyles.linkItem}>
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
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${window.server_url}/cofounder_data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
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
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${window.server_url}/delete_community_profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
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

  const deleteButtonStyles = {
    deleteButton: {
      backgroundColor: '#ff4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '1rem',
      cursor: 'pointer',
      marginLeft: '10px',
      transition: 'background-color 0.2s ease',
      fontWeight: '600'
    },
    deletePopup: {
      overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
      },
      popup: {
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      },
      title: {
        color: '#333',
        marginBottom: '1rem',
        fontSize: '1.5rem'
      },
      message: {
        color: '#666',
        marginBottom: '1.5rem',
        fontSize: '1rem'
      },
      buttonContainer: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
      },
      cancelButton: {
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'background-color 0.2s ease'
      },
      confirmButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'background-color 0.2s ease'
      }
    },
    headerContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '30px',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    headerTitle: {
      fontSize: '2.5rem',
      color: '#333',
      marginBottom: '20px',
      fontWeight: '600'
    },
    buttonContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    createButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      fontWeight: '600',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  };

  useEffect(() => {
    fetchProfiles()
  }, [])

  if (error) {
    return <div>Error loading profiles: {error}</div>
  }

  return (
    <div className="profile-page">
        <div style={deleteButtonStyles.headerContainer}>
          <h1 style={deleteButtonStyles.headerTitle}>Co-Founder Profiles</h1>
          <div style={deleteButtonStyles.buttonContainer}>
            <button 
              style={deleteButtonStyles.createButton}
              onMouseOver={e => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={e => e.target.style.backgroundColor = '#4CAF50'}
              onClick={() => setShowCreateProfilePopup(true)}
            >
              Create Profile
            </button>
            <button 
              style={deleteButtonStyles.deleteButton}
              onClick={() => setShowDeletePopup(true)}
              onMouseOver={e => e.target.style.backgroundColor = '#ff0000'}
              onMouseOut={e => e.target.style.backgroundColor = '#ff4444'}
            >
              Delete Profile
            </button>
          </div>
        </div>

        {showCreateProfilePopup && (
            <CreateProfilePopup 
                onClose={() => setShowCreateProfilePopup(false)}
            /> 
        )}

        {showDeletePopup && (
            <div style={deleteButtonStyles.deletePopup.overlay}>
                <div style={deleteButtonStyles.deletePopup.popup}>
                    <h3 style={deleteButtonStyles.deletePopup.title}>Delete Profile</h3>
                    <p style={deleteButtonStyles.deletePopup.message}>
                        Are you sure you want to delete your community profile? This action cannot be undone.
                    </p>
                    <div style={deleteButtonStyles.deletePopup.buttonContainer}>
                        <button 
                            style={deleteButtonStyles.deletePopup.cancelButton}
                            onClick={() => setShowDeletePopup(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button 
                            style={deleteButtonStyles.deletePopup.confirmButton}
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="profile-container">
        <div className="profile-content">       
            {profiles && profiles.map((profile) => (
            <ProfileCard 
                key={profile.id || `profile-${profile.name}-${Math.random()}`} 
                profile={profile} 
            />
            ))}
        </div>
        </div>
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
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000
        }}>
            <h1>You need to login to create a community profile</h1>
        </div>
    )
}

const CreateProfilePopup = ({ onClose }) => {
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
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${window.server_url}/create_community_profile`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
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
            // wait 1 second and then close the popup
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
    const stylingForPopup = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            overflow: 'auto', // Allow scrolling
            padding: '20px', // Add padding for small screens
            boxSizing: 'border-box' // Ensure padding is included in width calculation
        },
        popup: {
            backgroundColor: '#fff',
            padding: '1.5rem', // Reduced padding for small screens
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            width: '95%', // Increased from 90% to use more screen space
            maxWidth: '500px',
            maxHeight: '90vh', // Limit height on small screens
            overflow: 'auto', // Enable scrolling within popup
            margin: '0 auto', // Center popup horizontally
            transform: 'translateX(0)', // Reset any transform that might affect centering
            left: '0', // Reset any left positioning
            right: '0' // Reset any right positioning
        },
        closeButton: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            border: 'none',
            background: 'none',
            fontSize: '1.8rem',
            cursor: 'pointer',
            color: '#ff4444',
            transition: 'color 0.2s ease',
            padding: '5px' // Add padding for touch targets
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem', // Reduced gap
            marginTop: '1rem'
        },
        textarea: {
            padding: '0.8rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            minHeight: '100px', // Reduced height
            fontSize: '16px', // Better for mobile
            resize: 'vertical',
            width: '100%',
            boxSizing: 'border-box'
        },
        input: {
            padding: '0.8rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px', // Better for mobile
            width: '100%',
            boxSizing: 'border-box'
        },
        submitButton: {
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '0.8rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            marginTop: '0.5rem',
            width: '100%',
            boxSizing: 'border-box'
        },
        title: {
            color: '#333',
            marginBottom: '1rem',
            fontSize: '1.5rem', // Reduced font size
            textAlign: 'center',
            wordWrap: 'break-word' // Prevent text overflow
        }
    }

    return (
        <div className="popup-overlay" style={stylingForPopup.overlay}>
            <div className="create-profile-popup" style={stylingForPopup.popup}>
                {errorMessage && <p style={{ color: 'red', textAlign: 'center' }}>{errorMessage}</p>}
                <h2 style={stylingForPopup.title}>Create Community Profile {errorMessage}</h2>
                {profile && (
                    <ProfileCard profile={profile} edit={true}/>
                )}

                <form onSubmit={handleSubmit} style={stylingForPopup.form}>
                    <textarea 
                        name="description" 
                        placeholder="Tell us about yourself..." 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        style={stylingForPopup.textarea}
                    />
                    <input 
                        type="text" 
                        name="media_link" 
                        placeholder="Add your social media link (optional)" 
                        value={media_link} 
                        onChange={(e) => setMediaLink(e.target.value)}
                        style={stylingForPopup.input}
                    />
                    <input 
                        type="text" 
                        name="other_link" 
                        placeholder="Add your website or other link (optional)" 
                        value={other_link} 
                        onChange={(e) => setOtherLink(e.target.value)}
                        style={stylingForPopup.input}
                    />
                    <button 
                        type="submit"
                        style={stylingForPopup.submitButton}
                        onMouseOver={e => e.target.style.backgroundColor = '#45a049'}
                        onMouseOut={e => e.target.style.backgroundColor = '#4CAF50'}
                    >
                        {creatingProfile ? 'Creating...' : 'Create Profile'}
                    </button>
                </form>
                <button 
                    onClick={onClose}
                    style={stylingForPopup.closeButton}
                    onMouseOver={e => e.target.style.color = '#ff0000'}
                    onMouseOut={e => e.target.style.color = '#ff4444'}
                >
                    ×
                </button>
            </div>
        </div>
    )
}



export default MyCF;