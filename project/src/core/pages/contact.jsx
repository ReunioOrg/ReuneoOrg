import React, { useState } from 'react';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import FloatingLinesBackground from '../organizer/FloatingLinesBackground';
import './contact.css';

const PRIVACY_SECTIONS = [
  {
    number: '1',
    title: 'Introduction',
    content: (
      <p>
        Reuneo values user privacy and is committed to protecting personal information
        collected through our platform. This Privacy Policy outlines the types of data
        we collect, how it is used, and the steps we take to keep it secure.
      </p>
    ),
  },
  {
    number: '2',
    title: 'Information We Collect',
    content: (
      <ul>
        <li><strong>Account Data:</strong> Usernames and securely hashed passwords are collected when organizers or participants create accounts or log in.</li>
        <li><strong>Session Data:</strong> Temporary session tokens are generated for authentication and are automatically purged after the session ends.</li>
        <li><strong>Images:</strong> Users may upload or capture images for icebreaker activities during networking sessions. These images are not stored permanently and are erased immediately after the session ends.</li>
        <li><strong>Usage Data:</strong> We may collect non-identifiable technical information (e.g., browser type, device type) to help improve the platform.</li>
      </ul>
    ),
  },
  {
    number: '3',
    title: 'How We Use Information',
    content: (
      <ul>
        <li>To authenticate users and manage access to the platform.</li>
        <li>To facilitate event sessions and participant matching.</li>
        <li>To maintain platform security and detect unauthorized access.</li>
        <li>To improve user experience and service performance.</li>
      </ul>
    ),
  },
  {
    number: '4',
    title: 'Data Retention',
    content: (
      <ul>
        <li>Account information is retained only as long as the account remains active.</li>
        <li>Session data and images used for events are deleted immediately after the session ends.</li>
        <li>No payment or PCI DSS-regulated data is stored within the platform.</li>
      </ul>
    ),
  },
  {
    number: '5',
    title: 'Data Security',
    content: (
      <ul>
        <li>All account data is stored in an encrypted database (MongoDB Atlas) and transmitted securely.</li>
        <li>Passwords are hashed and never stored in plain text.</li>
        <li>Access controls are role-based to restrict unauthorized access.</li>
        <li>Infrastructure is hosted on DigitalOcean, which maintains strict physical and network security standards.</li>
      </ul>
    ),
  },
  {
    number: '6',
    title: 'Third-Party Services',
    content: (
      <ul>
        <li>We use DigitalOcean for cloud hosting and MongoDB Atlas for database services.</li>
        <li>These providers are responsible for maintaining physical and infrastructure-level security.</li>
      </ul>
    ),
  },
  {
    number: '7',
    title: 'User Rights',
    content: (
      <p>
        Users may request account deletion or data export of their minimal account
        information at any time by contacting the support team.
      </p>
    ),
  },
  {
    number: '8',
    title: 'Updates to This Policy',
    content: (
      <p>
        This Privacy Policy may be updated periodically. Users will be notified of
        any significant changes.
      </p>
    ),
  },
  {
    number: '9',
    title: 'Contact Information',
    content: (
      <p>
        For questions about this Privacy Policy or to request data deletion, please
        contact: <a href="mailto:julian@reuneo.com">julian@reuneo.com</a>
      </p>
    ),
  },
];

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  subject: '',
  message: '',
};

const ContactPage = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${window.server_url}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Something went wrong. Please try again.');
      }

      setStatus('success');
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="contact-page">
      <FloatingLinesBackground />
      <PageNavBar />

      {/* ── Hero ── */}
      <section className="contact-hero">
        <h1 className="contact-hero-title">Get in touch.</h1>
        <p className="contact-hero-sub">We respond to every inquiry - usually within 24 hours.</p>
      </section>

      {/* ── Form ── */}
      <section className="contact-main">
        <div className="contact-form-col">
          <div className="contact-form-card">
            <h2 className="contact-form-heading">Send us a message</h2>

            {status === 'success' ? (
              <div className="contact-success">
                <div className="contact-success-icon">✓</div>
                <p className="contact-success-title">Message sent!</p>
                <p className="contact-success-sub">
                  We got your message and will get back to you soon.
                </p>
                <button
                  className="contact-send-another"
                  onClick={() => setStatus('idle')}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-row">
                  <div className="contact-field">
                    <label className="contact-label" htmlFor="first_name">
                      First Name <span className="contact-required">*</span>
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      className="contact-input"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="Jane"
                      required
                    />
                  </div>
                  <div className="contact-field">
                    <label className="contact-label" htmlFor="last_name">
                      Last Name <span className="contact-required">*</span>
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      className="contact-input"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="contact-field">
                  <label className="contact-label" htmlFor="email">
                    Email <span className="contact-required">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="contact-input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label className="contact-label" htmlFor="subject">
                    Subject <span className="contact-required">*</span>
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    className="contact-input"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label className="contact-label" htmlFor="message">
                    Message <span className="contact-required">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="contact-textarea"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    required
                  />
                </div>

                {status === 'error' && (
                  <div className="contact-error">{errorMsg}</div>
                )}

                <button
                  type="submit"
                  className="contact-submit"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Info strip ── */}
      <section className="contact-info-strip">
        <div className="contact-info-card">
          <span className="contact-info-icon">✉</span>
          <div>
            <div className="contact-info-label">Email us</div>
            <a className="contact-info-value" href="mailto:julian.reuneo@gmail.com">
              julian.reuneo@gmail.com
            </a>
          </div>
        </div>
        <div className="contact-info-card">
          <span className="contact-info-icon">📍</span>
          <div>
            <div className="contact-info-label">Location</div>
            <div className="contact-info-value">Austin, TX</div>
          </div>
        </div>
        <div className="contact-info-card">
          <span className="contact-info-icon">⚡</span>
          <div>
            <div className="contact-info-label">Response time</div>
            <div className="contact-info-value">Within 24 hours</div>
          </div>
        </div>
      </section>

      {/* ── Privacy Policy ── */}
      <section className="contact-privacy">
        <div className="contact-privacy-inner">
          <h2 className="contact-privacy-title">Privacy Policy</h2>
          <p className="contact-privacy-updated">Last updated: April 2025</p>
          <div className="contact-privacy-sections">
            {PRIVACY_SECTIONS.map((section) => (
              <div key={section.number} className="contact-privacy-section">
                <h3 className="contact-privacy-section-heading">
                  <span className="contact-privacy-num">{section.number}.</span>{' '}
                  {section.title}
                </h3>
                <div className="contact-privacy-body">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
