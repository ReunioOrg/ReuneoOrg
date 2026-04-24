import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoolerGeneralMatchEventFlow from '../Tutorials/cooler_general_match_event_flow';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import { AuthContext } from '../Auth/AuthContext';
import './tutorial.css';

const TutorialPage = () => {
  const [showTutorial, setShowTutorial] = useState(true);
  const { permissions, isLegacyOrganizer } = useContext(AuthContext);
  const navigate = useNavigate();

  const isOrganizerOrAdmin =
    permissions === 'admin' ||
    permissions === 'organizer' ||
    isLegacyOrganizer;

  const handleGetStarted = () => {
    if (isOrganizerOrAdmin) {
      navigate('/create_lobby', { state: { fromTutorial: true } });
    } else {
      navigate('/new_organizer', { state: { fromTutorial: true } });
    }
  };

  return (
    <div className="tutorial-page">
      <PageNavBar />
      <div className="tutorial-body">
        <h1 className="tutorial-heading">Real Community Building</h1>
        <p className="tutorial-subheading">
          See how Reuneo connects people in real time at any event
        </p>

        {!showTutorial && (
          <div className="tutorial-cta-group">
            <button
              className="tutorial-replay-btn"
              onClick={() => setShowTutorial(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Replay
            </button>
            <button
              className="tutorial-get-started-btn"
              onClick={handleGetStarted}
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}

        <div className="tutorial-flow-container">
          <CoolerGeneralMatchEventFlow
            isVisible={showTutorial}
            onComplete={() => setShowTutorial(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
