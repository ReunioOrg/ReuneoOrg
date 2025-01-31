import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';


//load asset image earthart.jpg
import { returnBase64TestImg } from '../misc/misc';

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



    const [pairedPlayers, setPairedPlayers] = useState(null);
    const [lobbyData, setLobbyData] = useState(null);
    const [lobbyTimer, setLobbyTimer] = useState(null);
    const [lobbyState, setLobbyState] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();

        if (permissions!="admin"){
            navigate('/');
            return;
        }

        const interval = setInterval(() => {
            fetch(window.server_url + '/admin_lobby_data', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log("Admin lobby data:", data);
                setLobbyData(data.unpaired_players);
                setPairedPlayers(data.pairs_data);
                setLobbyTimer(data.round_time_left);
                setLobbyState(data.lobby_state);
                //setPairedPlayers(pairedPlayers_test_data);
            })
            .catch(error => {
                console.error("Error fetching admin lobby data:", error);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <h1>Admin Lobby View</h1>
            <button onClick={() => {
                fetch(window.server_url + '/reset_lobby_timer', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                })
            }}>Reset Lobby Timer</button>
            
            <div>
                <h2>Lobby Timer: {lobbyTimer} for {lobbyState}</h2>
                <div>
                    <h3>Lobby Stats:</h3>
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
                                {lobbyPairedCard(player[0], player[1])}
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
                            <div key={index} className="profile-icon" style={{color: "green", border: "2px solid green", marginBottom: "10px"}}>
                                <div className="avatar">
                                    <img src={`data:image/jpeg;base64,${profile.image_data}`} alt={profile.name} width="200" height="200" style={{objectFit: "cover"}} />
                                </div>
                                <h3>{profile.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
                :
                null
            }
        </div>
    );
}


const lobbyPairedCard = (player1, player2) => {
    return (
        <div style={{
            display: "flex", 
            flexDirection: "row",
            border: "2px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
            height: "100%"
        }}>
            <div style={{
                flex: 1,
                padding: "8px",
                background: "rgba(50,80,180,0.5)",
                borderRight: "2px solid #ccc"
            }}>
                <div className="avatar">
                    <img 
                        src={`data:image/jpeg;base64,${player1.image_data}`} 
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
            <div style={{
                flex: 1,
                padding: "8px",
                background: "rgba(40,180,180,0.5)"
            }}>
                <div className="avatar">
                    <img 
                        src={`data:image/jpeg;base64,${player2.image_data}`} 
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