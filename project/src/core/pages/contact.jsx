import React from 'react';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import './contact.css';

const ContactPage = () => {
  return (
    <div className="contact-page">
      <PageNavBar />
      <div className="contact-body">
        <img
          src="/assets/reuneo_test_14.png"
          alt="Reuneo Logo"
          className="contact-logo"
        />
        <h1 className="contact-heading">Contact Us</h1>
        <p className="contact-subheading">Coming soon</p>
      </div>
    </div>
  );
};

export default ContactPage;
