import { QRCodeSVG } from 'qrcode.react';

const PlayerCard = ({ player }) => {
    return (
      <div
        style={{
        display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',width:'350px',height:'350px',
        margin:'0 auto'}}
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
        <img
          src={`data:image/jpeg;base64,${player.image_data}`}
          alt={player.name}
          style={{
            width: '300px', // Larger square size
            height: '700px', // Ensures a square aspect ratio
            objectFit: 'cover', // Makes sure the image fills the space without distortion
            borderRadius: '50px', // Rounded corners for a sleek look
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)', // Depth for the image
            margin: 'auto', // Center horizontally and vertically
            display: 'block', // Needed for margin auto to work
          }}
        />
      </div>
    );
  };

export default PlayerCard;
