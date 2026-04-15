import React from 'react';
import CoolerGeneralMatchEventFlow from '../Tutorials/cooler_general_match_event_flow';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import './tutorial.css';

const TutorialPage = () => {
  return (
    <div className="tutorial-page">
      <PageNavBar />
      <div className="tutorial-body">
        <h1 className="tutorial-heading">Real Community Building</h1>
        <p className="tutorial-subheading">
          See how Reuneo connects people in real time at any event
        </p>

        <div className="tutorial-flow-container">
          <CoolerGeneralMatchEventFlow />
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
