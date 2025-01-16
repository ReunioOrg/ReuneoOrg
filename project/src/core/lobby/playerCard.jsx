const PlayerCard = ({player}) => {
    return (
        <div style={{
            backgroundColor: '#1a2b4d',
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <h2 style={{
                color: 'white',
                marginBottom: '15px',
                fontFamily: 'Arial, sans-serif'
            }}>{player.name}</h2>
            <img 
                src={`data:image/jpeg;base64,${player.image_data}`} 
                alt={player.name} 
                width="200" 
                height="200" 
                style={{
                    objectFit: "cover",
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    marginBottom: '15px'
                }} 
            />
        </div>
    )
}

export default PlayerCard;
