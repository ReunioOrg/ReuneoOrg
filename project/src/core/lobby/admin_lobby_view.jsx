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
                            <div key={index}>
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
                    <div className="lobby-profiles">
                        {lobbyData.map((profile, index) => (
                            <div key={index} className="profile-icon">
                                <div className="avatar">
                                    <img src={`data:image/jpeg;base64,${profile.image_data}`} alt={profile.name} width="200" height="200" style={{objectFit: "cover"}} />
                                </div>
                                <p>{profile.name}</p>
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
                <p>{player1.name}</p>
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
                <p>{player2.name}</p>
            </div>
        </div>
    );
}


export default AdminLobbyView;