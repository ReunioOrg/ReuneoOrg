import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';


//load asset image earthart.jpg
import { returnBase64TestImg } from '../misc/misc';

// Modal component for kick confirmation
const KickConfirmationModal = ({ isOpen, onClose, onConfirm, userName }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center'
            }}>
                <h2>Kick User</h2>
                <p style={{ color: "#144dff" }}>Are you sure you want to kick {userName} from the lobby?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                    <button 
                        onClick={onConfirm}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Yes
                    </button>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminLobbyView = () => {
    const { user, userProfile, checkAuth, permissions } = useContext(AuthContext);

    // const [earthartBase64, setEarthartBase64] = useState('');

    // const loadBase64 = async () => {
    //     setEarthartBase64(await returnBase64TestImg());
    // }
    // loadBase64();

    // useEffect(() => {
    //     setPairedPlayers([
    //         [
    //             {name: "Player 1", image_data: earthartBase64},
    //             {name: "Player 2", image_data: earthartBase64}
    //         ],
    //         [
    //             {name: "Player 3", image_data: earthartBase64},
    //             {name: "Player 4", image_data: earthartBase64}
    //         ],
    //         [
    //             {name: "Player 5", image_data: earthartBase64},
    //             {name: "Player 6", image_data: earthartBase64}
    //         ],
    //         [
    //             {name: "Player 7", image_data: earthartBase64},
    //             {name: "Player 8", image_data: earthartBase64}
    //         ],
    //         [
    //             {name: "Player 9", image_data: earthartBase64},
    //             {name: "Player 10", image_data: earthartBase64}
    //         ]
    //     ]);
    // }, [earthartBase64]);

    // State for kick user modal
    const [isKickModalOpen, setIsKickModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [pairedPlayers, setPairedPlayers] = useState(null);
    const [lobbyData, setLobbyData] = useState(null);
    const [lobbyTimer, setLobbyTimer] = useState(null);
    const [lobbyState, setLobbyState] = useState(null);
    const [profilePictures, setProfilePictures] = useState({}); // Cache for profile pictures

    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();

        if (permissions!="admin"){
            navigate('/');
            return;
        }

        const fetchProfilePicture = async (username) => {
            // Check if we already have this profile picture cached
            if (profilePictures[username]) {
                return profilePictures[username];
            }
            
            try {
                const response = await fetch(`${window.server_url}/pfp_small_icon?username=${encodeURIComponent(username)}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                if (response.ok) {
                    // Get the base64 data from the response
                    let base64Data = await response.text();
                    
                    // Remove any quotes that might be wrapping the data
                    if (base64Data.startsWith('"') && base64Data.endsWith('"')) {
                        base64Data = base64Data.slice(1, -1);
                    }
                    
                    // Make sure the base64 data has the proper image prefix
                    const formattedData = base64Data.startsWith('data:image') 
                        ? base64Data 
                        : `data:image/jpeg;base64,${base64Data}`;
                        
                    // Update the cache
                    setProfilePictures(prev => ({
                        ...prev,
                        [username]: formattedData
                    }));
                    return formattedData;
                }
                return null;
            } catch (error) {
                console.error(`Error fetching profile picture for ${username}:`, error);
                return null;
            }
        };

        const interval = setInterval(async () => {
            try {
                const response = await fetch(window.server_url + '/admin_lobby_data', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Admin lobby data:", data);
                    
                    // Process unpaired players to add profile pictures
                    const unpairedWithPfp = await Promise.all(data.unpaired_players.map(async (player) => {
                        const pfpData = await fetchProfilePicture(player.username);
                        return {
                            ...player,
                            pfp_data: pfpData
                        };
                    }));
                    
                    // Process paired players to add profile pictures
                    const pairsWithPfp = await Promise.all(data.pairs_data.map(async (pair) => {
                        const player1PfpData = await fetchProfilePicture(pair[0].username);
                        const player2PfpData = await fetchProfilePicture(pair[1].username);
                        
                        return [
                            { ...pair[0], pfp_data: player1PfpData },
                            { ...pair[1], pfp_data: player2PfpData }
                        ];
                    }));
                    
                    setLobbyData(unpairedWithPfp);
                    setPairedPlayers(pairsWithPfp);
                    setLobbyTimer(data.round_time_left);
                    setLobbyState(data.lobby_state);
                }
            } catch (error) {
                console.error("Error fetching admin lobby data:", error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [profilePictures]); // Add profilePictures to dependency array

    // Function to handle opening the kick modal
    const handleOpenKickModal = (user) => {
        setSelectedUser(user);
        setIsKickModalOpen(true);
    };

    // Function to handle closing the kick modal
    const handleCloseKickModal = () => {
        setIsKickModalOpen(false);
        setSelectedUser(null);
    };

    // Function to handle kicking a user
    const handleKickUser = () => {
        if (!selectedUser) return;

        fetch(window.server_url + '/kick_user', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: selectedUser.id
            })
        })
        .then(response => {
            if (response.ok) {
                console.log(`User ${selectedUser.name} kicked successfully`);
            } else {
                console.error(`Failed to kick user ${selectedUser.name}`);
            }
        })
        .catch(error => {
            console.error("Error kicking user:", error);
        })
        .finally(() => {
            handleCloseKickModal();
        });
    };

    return (
        <div>
            <h1>Admin Lobby View</h1>
            <button onClick={() => {
                if (window.confirm('Are you sure you want to reset the lobby timer?')) {
                    fetch(window.server_url + '/reset_lobby_timer', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    })
                }
            }}>Reset Lobby Timer</button>

            <button onClick={() => {
                if (window.confirm('Are you sure you want to reset the entire lobby?')) {
                    fetch(window.server_url + '/reset_lobby', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    })
                }
            }}>Reset Lobby</button>

            <button onClick={() => { //start_rounds
                if (window.confirm('Are you sure you want to start the rounds?')) {
                    fetch(window.server_url + '/start_rounds', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    })
                }
            }}>Start Rounds</button>
            

            <button onClick={() => {
                if (window.confirm('Are you sure you want to terminate the rounds?')) {
                    fetch(window.server_url + '/terminate_lobby', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    })
                }
            }}>Terminate Rounds</button>


            <div>
                <h2>Lobby Timer: {Math.floor(lobbyTimer)} for {lobbyState}</h2>
                <div>
                    <h3>Lobby Stats:</h3>
                    {/* <h3>Round: {roundCounter}</h3> */}
                    <h3>Total Players: {(lobbyData?.length || 0) + (pairedPlayers?.length * 2 || 0)}</h3>
                    <h3>Paired Players: {pairedPlayers?.length * 2 || 0}</h3>
                    <h3>Unpaired Players: {lobbyData?.length || 0}</h3>
                </div>
            </div>
            
            {pairedPlayers?
                <div style={{ 
                    width: '100%',
                    maxWidth: 'none',
                    padding: '20px',
                    overflowX: 'hidden'
                }}>
                    <h2>Paired Players</h2>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "20px",
                        width: "100%"
                    }}>
                        {pairedPlayers.map((player, index) => (
                            <div key={index} style={{color: "green", border: "2px solid green", marginBottom: "10px"}}>
                                {lobbyPairedCard(player[0], player[1], handleOpenKickModal)}
                            </div>
                        ))}
                    </div>
                </div>
                :
                null
            }



            
            {lobbyData?
                <div>
                    <h2>Lobby Data</h2>
                    <div className="lobby-profiles" style={{color: "green",}}>
                        {lobbyData.map((profile, index) => (
                            <div 
                                key={index} 
                                className="profile-icon" 
                                style={{
                                    color: "green", 
                                    border: "2px solid green", 
                                    marginBottom: "10px",
                                    cursor: "pointer"
                                }}
                                onClick={() => handleOpenKickModal(profile)}
                            >
                                <div className="avatar">
                                    <img 
                                        src={profile.pfp_data} 
                                        alt={profile.name} 
                                        width="200" 
                                        height="200" 
                                        style={{objectFit: "cover"}} 
                                    />
                                </div>
                                <h3>{profile.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
                :
                null
            }

            {/* Kick Confirmation Modal */}
            <KickConfirmationModal 
                isOpen={isKickModalOpen}
                onClose={handleCloseKickModal}
                onConfirm={handleKickUser}
                userName={selectedUser?.name || "this user"}
            />
        </div>
    );
}


const lobbyPairedCard = (player1, player2, onKickUser) => {
    return (
        <div style={{
            display: "flex", 
            flexDirection: "row",
            border: "2px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
            height: "100%"
        }}>
            <div 
                style={{
                    flex: 1,
                    padding: "8px",
                    background: "rgba(50,80,180,0.5)",
                    borderRight: "2px solid #ccc",
                    cursor: "pointer"
                }}
                onClick={() => onKickUser(player1)}
            >
                <div className="avatar">
                    <img 
                        src={player1.pfp_data} 
                        alt={player1.name} 
                        style={{
                            width: "100%",
                            height: "auto",
                            objectFit: "cover"
                        }} 
                    />
                </div>
                <h3>{player1.name}</h3>
            </div>
            <div 
                style={{
                    flex: 1,
                    padding: "8px",
                    background: "rgba(40,180,180,0.5)",
                    cursor: "pointer"
                }}
                onClick={() => onKickUser(player2)}
            >
                <div className="avatar">
                    <img 
                        src={player2.pfp_data} 
                        alt={player2.name}
                        style={{
                            width: "100%",
                            height: "auto",
                            objectFit: "cover"
                        }}
                    />
                </div>
                <h3>{player2.name}</h3>
            </div>
        </div>
    );
}


export default AdminLobbyView;