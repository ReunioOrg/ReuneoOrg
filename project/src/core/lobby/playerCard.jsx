import { QRCodeSVG } from 'qrcode.react';

const PlayerCard = ({ player }) => {
    // Add console log to debug the incoming data
    // console.log("PlayerCard received player data:", player);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '350px',
          height: '350px',
          margin: '0 auto'
        }}
      >
        {/* <h2
          style={{
            color: 'white',
            marginBottom: '15px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '1.5rem', // Larger, more readable text
            textAlign: 'center', // Ensures alignment for long names
          }}
        >
          {player.name}
        </h2> */}
        {player?.image_data ? (
          <img
            src={`data:image/jpeg;base64,${player.image_data}`}
            alt={player.name}
            style={{
              width: '350px',
              height: '900px', // Changed from 900px to maintain aspect ratio
              objectFit: 'cover',
              borderRadius: '50px',
              boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
              margin: 'auto',
              display: 'block',
            }}
            onError={(e) => {
              console.error("Image failed to load:", e);
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{
            width: '350px',
            height: '350px',
            backgroundColor: '#f0f0f0',
            borderRadius: '50px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <p>No image available</p>
          </div>
        )}
      </div>
    );
  };

export default PlayerCard;
