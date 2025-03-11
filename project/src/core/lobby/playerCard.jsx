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
          height: '500px',
          margin: '0 auto',
          position: 'relative'
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
          <div style={{ position: 'relative', width: '350px', height: '450px' }}>
            <img
              src={`data:image/jpeg;base64,${player.image_data}`}
              alt={player.name}
              style={{
                width: '350px',
                height: '450px',
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
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              backgroundColor: '#144dff',
              color: 'white',
              padding: '12px 0',
              borderBottomLeftRadius: '50px',
              borderBottomRightRadius: '50px',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '1.2rem',
              fontFamily: 'Helvetica, Arial, sans-serif',
              boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.1)',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
            }}>
              {player.name}
            </div>
          </div>
        ) : (
          <div style={{
            width: '350px',
            height: '450px',
            backgroundColor: '#f0f0f0',
            borderRadius: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            <p style={{ marginBottom: '60px' }}>No image available</p>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              backgroundColor: '#144dff',
              color: 'white',
              padding: '12px 0',
              borderBottomLeftRadius: '50px',
              borderBottomRightRadius: '50px',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '1.2rem',
              fontFamily: 'Helvetica, Arial, sans-serif',
              boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.1)',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
            }}>
              {player.name}
            </div>
          </div>
        )}
      </div>
    );
  };

export default PlayerCard;
