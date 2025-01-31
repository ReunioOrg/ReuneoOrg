import { QRCodeSVG } from 'qrcode.react';

const PlayerCard = ({ player }) => {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #007FFF 0%, #00308F 100%)',
          padding: '20px',
          borderRadius: '16px', // Smooth rounded corners for the card
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '350px', // Wider card for better layout
          height: '500px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)', // Added depth to the card
          margin: '20px auto', // Center the card
        }}
      >
        <h2
          style={{
            color: 'white',
            marginBottom: '15px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '1.5rem', // Larger, more readable text
            textAlign: 'center', // Ensures alignment for long names
          }}
        >
          {player.name}
        </h2>
        <img
          src={`data:image/jpeg;base64,${player.image_data}`}
          alt={player.name}
          style={{
            width: '300px', // Larger square size
            height: '300px', // Ensures a square aspect ratio
            objectFit: 'cover', // Makes sure the image fills the space without distortion
            borderRadius: '12px', // Rounded corners for a sleek look
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)', // Depth for the image
            marginBottom: '15px',
          }}
        />
      </div>
    );
  };

export default PlayerCard;
