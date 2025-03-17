import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Auth/AuthContext';
import './product-selection.css';

const ProductSelection = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handlePurchase = () => {
    // Redirect to the Reunio organizer signup page
    window.location.href = "https://reunio.app/become-an-organizer";
  };

  return (
    <div className="product-selection-container">
      {/* Background Video (reused from App.jsx) */}
      <video className="background-video" autoPlay loop muted playsInline>
        <source src="/assets/purchase_plan_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Main Content */}
      <div className="product-selection-content">
        <div className="product-selection-header">
          <h1>Product Selection</h1>
        </div>

        <div className="plans-section">
          <h2>Available Plans</h2>
          
          <div className="plan-card">
            <h3>Organizer Plan</h3>
            {/* <div className="plan-price">$20/mo</div> */}
            <div className="plan-description">
              <p>Create experiences for your community with our beta plan.</p>
              <ul>
                <li>Create unlimited experiences</li>
                <li>Access to organizer dashboard</li>
                <li>Priority customer support</li>
              </ul>
            </div>
            <button 
              className="purchase-button"
              onClick={handlePurchase}
            >
              Contact Us
            </button>
          </div>
        </div>

        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          Home
        </button>
      </div>
    </div>
  );
};

export default ProductSelection;
