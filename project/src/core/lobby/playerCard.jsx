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
                borderRadius: '28px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
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
              bottom: '0',
              left: '0',
              right: '0',
              background: 'linear-gradient(135deg, #42A5F5 0%, #2196F3 30%, #1976D2 70%, #1565C0 100%)',
              color: 'white',
              padding: '16px 24px',
              borderBottomLeftRadius: '28px',
              borderBottomRightRadius: '28px',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '1.2rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              boxShadow: '0 -4px 20px rgba(33, 150, 243, 0.3)',
              letterSpacing: '0.02em'
            }}>
              {player.name}
            </div>
          </div>
        ) : (
          <div style={{
            width: '350px',
            height: '450px',
            backgroundColor: '#f0f1f4',
            borderRadius: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ marginBottom: '60px', color: '#6b7280' }}>No image available</p>
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              background: 'linear-gradient(135deg, #42A5F5 0%, #2196F3 30%, #1976D2 70%, #1565C0 100%)',
              color: 'white',
              padding: '16px 24px',
              borderBottomLeftRadius: '28px',
              borderBottomRightRadius: '28px',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '1.2rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              boxShadow: '0 -4px 20px rgba(33, 150, 243, 0.3)',
              letterSpacing: '0.02em'
            }}>
              {player.name}
            </div>
          </div>
        )}
      </div>
    );
  };

export default PlayerCard;
