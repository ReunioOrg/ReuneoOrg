import './SiteSocialFooter.css';

const INSTAGRAM_URL = 'https://www.instagram.com/reuneo.app/';
const LINKEDIN_URL = 'https://www.linkedin.com/in/julianvazquezjimenez/';

function IconInstagram({ className }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="6.5" r="1.35" fill="currentColor" />
    </svg>
  );
}

function IconLinkedIn({ className }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
    </svg>
  );
}

function SiteSocialFooter() {
  return (
    <footer className="site-social-footer" role="contentinfo">
      <div className="site-social-footer-inner">
        <a
          className="site-social-footer-link"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Reuneo on Instagram"
        >
          <IconInstagram className="site-social-footer-svg" />
        </a>
        <a
          className="site-social-footer-link"
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Julian Vazquez Jimenez on LinkedIn"
        >
          <IconLinkedIn className="site-social-footer-svg" />
        </a>
      </div>
    </footer>
  );
}

export default SiteSocialFooter;
