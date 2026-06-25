import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import SiteSocialFooter from '../components/SiteSocialFooter/SiteSocialFooter';
import ClientTestimonialsSection from '../components/ClientTestimonialsSection/ClientTestimonialsSection';
import ResidentialHeroTutorial from '../components/ResidentialHeroTutorial/ResidentialHeroTutorial';
import HoverBorderGlow from '../components/HoverBorderGlow/HoverBorderGlow';
import './speed-friending.css';

const PAGE_TITLE = 'Speed Friending Event Platform - Automate Rotations & Matching | Reuneo';
const PAGE_DESCRIPTION =
  'Running speed friending events manually? Reuneo automates rotations, timing, odd numbers, and match results. Attendees scan a QR code - no app required. Free to try.';
const OG_TITLE = 'Stop Running Your Speed Friending Events Manually';
const OG_DESCRIPTION =
  'Reuneo automates the rotations, timing, and match results for speed friending organizers. Attendees scan a QR code and rounds run themselves. No app, no cards, no post-event admin.';
const PAGE_URL = 'https://reuneo.com/speed-friending';
const PAGE_IMAGE = 'https://reuneo.com/assets/reuneo_test_14.png';

const DEFAULT_TITLE = 'Reuneo - Elevate Your Events';
const DEFAULT_DESCRIPTION = 'The perfect icebreaker';
const DEFAULT_URL = 'https://reuneo.com/';

const META_SPECS = [
  { selector: 'meta[name="title"]', attr: 'content', value: PAGE_TITLE },
  { selector: 'meta[name="description"]', attr: 'content', value: PAGE_DESCRIPTION },
  { selector: 'meta[name="robots"]', attr: 'content', value: 'index, follow' },
  { selector: 'meta[property="og:type"]', attr: 'content', value: 'website' },
  { selector: 'meta[property="og:url"]', attr: 'content', value: PAGE_URL },
  { selector: 'meta[property="og:title"]', attr: 'content', value: OG_TITLE },
  { selector: 'meta[property="og:description"]', attr: 'content', value: OG_DESCRIPTION },
  { selector: 'meta[property="og:image"]', attr: 'content', value: PAGE_IMAGE },
  { selector: 'meta[property="twitter:card"]', attr: 'content', value: 'summary_large_image' },
  { selector: 'meta[property="twitter:url"]', attr: 'content', value: PAGE_URL },
  { selector: 'meta[property="twitter:title"]', attr: 'content', value: OG_TITLE },
  { selector: 'meta[property="twitter:description"]', attr: 'content', value: OG_DESCRIPTION },
  { selector: 'meta[property="twitter:image"]', attr: 'content', value: PAGE_IMAGE },
];

const DEFAULT_META = [
  { selector: 'meta[name="title"]', value: DEFAULT_TITLE },
  { selector: 'meta[name="description"]', value: DEFAULT_DESCRIPTION },
  { selector: 'meta[property="og:url"]', value: DEFAULT_URL },
  { selector: 'meta[property="og:title"]', value: DEFAULT_TITLE },
  { selector: 'meta[property="og:description"]', value: DEFAULT_DESCRIPTION },
  { selector: 'meta[property="twitter:url"]', value: DEFAULT_URL },
  { selector: 'meta[property="twitter:title"]', value: DEFAULT_TITLE },
  { selector: 'meta[property="twitter:description"]', value: DEFAULT_DESCRIPTION },
];

function setMetaContent(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
}

function useSpeedFriendingPageMeta() {
  useEffect(() => {
    document.title = PAGE_TITLE;

    META_SPECS.forEach(({ selector, attr, value }) => {
      let el = document.querySelector(selector);
      if (!el && selector.includes('[name="robots"]')) {
        el = document.createElement('meta');
        el.setAttribute('name', 'robots');
        document.head.appendChild(el);
      }
      if (el) el.setAttribute(attr, value);
    });

    let canonical = document.querySelector('link[rel="canonical"]');
    const hadCanonical = Boolean(canonical);
    const prevCanonical = canonical?.getAttribute('href') ?? null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', PAGE_URL);

    return () => {
      document.title = DEFAULT_TITLE;
      DEFAULT_META.forEach(({ selector, value }) => setMetaContent(selector, value));
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();
      if (canonical) {
        if (hadCanonical && prevCanonical) {
          canonical.setAttribute('href', prevCanonical);
        } else {
          canonical.remove();
        }
      }
    };
  }, []);
}

function ScrollReveal({ as: Tag = 'div', className = '', delay = 0, children, id }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = delay > 0 ? { animationDelay: `${delay}ms` } : undefined;

  return (
    <Tag
      ref={ref}
      id={id}
      className={`sf-reveal${visible ? ' sf-reveal--in' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {children}
    </Tag>
  );
}

function ActivityIcon({ type }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (type) {
    case 'interest':
      return (
        <svg {...props}>
          <path d="M7 7h.01" />
          <path d="M12 7h.01" />
          <path d="M17 7h.01" />
          <path d="M7 12h.01" />
          <path d="M12 12h.01" />
          <path d="M17 12h.01" />
          <path d="M7 17h.01" />
          <path d="M12 17h.01" />
          <path d="M17 17h.01" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 'hobby':
      return (
        <svg {...props}>
          <circle cx="13.5" cy="6.5" r="2.5" />
          <path d="M13.5 9 8 20" />
          <path d="M8 14h11" />
          <path d="M8 17h8" />
        </svg>
      );
    case 'recurring':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="M17 14h-5" />
          <path d="M17 18h-5" />
          <path d="M9.5 16.5 8 18l1.5 1.5" />
        </svg>
      );
    case 'odd-numbers':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="2.5" />
          <path d="M6.5 18v-1.5a2.5 2.5 0 0 1 2.5-2.5h0" />
          <circle cx="16" cy="9" r="2" />
          <path d="M14 18v-1a2 2 0 0 1 2-2h.5" />
          <path d="M19 12v6" />
          <path d="M16.5 14.5H21.5" />
        </svg>
      );
    case 'open-social':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
          <path d="M8 16.5c1.2 1 2.7 1.5 4 1.5s2.8-.5 4-1.5" />
        </svg>
      );
    case 'speed-dating':
      return (
        <svg {...props}>
          <path d="M12 20.5c4.5-3.2 7-6.4 7-9.8a4.8 4.8 0 0 0-9.6 0c0 3.4 2.5 6.6 7 9.8z" />
          <path d="M12 11.5v-1.5" />
        </svg>
      );
    case 'networking':
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <path d="M12 12v2" />
          <circle cx="8.5" cy="13.5" r="1.5" />
          <circle cx="15.5" cy="13.5" r="1.5" />
          <path d="M8.5 13.5h7" />
        </svg>
      );
    default:
      return null;
  }
}

const ACTIVITIES = [
  {
    title: 'Interest-Based Speed Friending',
    copy: 'Ask attendees a few questions before the event. Reuneo pairs them around shared interests instead of defaulting to random pairs. The conversations are better before anyone says a word.',
    icon: 'interest',
  },
  {
    title: 'Hobby-Matched Speed Friending',
    copy: "Pair people around what they're actually into. Reading, fitness, travel, food - whatever fits your crowd. Shared context turns a two-minute round into a real conversation.",
    icon: 'hobby',
  },
  {
    title: 'Monthly Recurring Format',
    copy: 'Same platform, different theme every month. Run it once, learn the setup, and repeat it. Your events get easier to run the more you do them.',
    icon: 'recurring',
  },
  {
    title: 'Odd Numbers and Late Arrivals - Handled',
    copy: "Reuneo manages odd numbers dynamically. Late arrivals get added mid-session. People who step out come back in. You don't intervene - the system adjusts.",
    icon: 'odd-numbers',
  },
  {
    title: 'Speed Friending + Open Social',
    copy: 'Run 20-30 minutes of structured rounds to open, then cut people loose. Mingling lands different when everyone already knows someone in the room.',
    icon: 'open-social',
  },
  {
    title: 'Speed Dating Format',
    copy: 'Same Reuneo platform, different matching logic. Pair by compatibility instead of shared interests. The rotation handles itself either way.',
    icon: 'speed-dating',
  },
  {
    title: 'Speed Networking Format',
    copy: 'Role and industry-based matching for professional communities. Same QR-code setup, same automatic rotations - the questions just change.',
    icon: 'networking',
  },
];

const FAQ_ITEMS = [
  {
    question: "How is this different from what I'm already doing manually?",
    answer:
      "Reuneo automates everything you're currently doing by hand - rotations, timing, round changes, odd numbers, match results, and post-event follow-up. You set it up once before the event and the system runs itself.",
  },
  {
    question: 'Does Reuneo handle odd numbers and late arrivals?',
    answer:
      "Yes. Reuneo handles odd numbers dynamically. Late arrivals get added mid-session. People who step out and return get reinserted. You don't manage any of it live.",
  },
  {
    question: 'Do attendees need to download an app?',
    answer: 'No. Attendees scan a QR code and they\'re in. No app download, no account creation, no forms.',
  },
  {
    question: 'How does interest-based matching work?',
    answer:
      'Before the event, attendees answer a few short questions when they scan in. Reuneo uses their answers to pair them with people who share something in common, instead of defaulting to random pairs.',
  },
  {
    question: 'How long does setup take before an event?',
    answer:
      "In under five minutes. You create a session, set your matching questions if you want them, and display the QR code. That's it.",
  },
];

const GET_STARTED_GLOW_PROPS = {
  borderRadius: 18,
  borderWidth: 1.5,
  bloomBlur: 10,
  bloomInset: 2,
  duration: 2800,
  spread: 42,
  colors: ['#ffffff', '#a5b4fc', '#7c3aed'],
};

function GetStartedButton({ onClick, className = '' }) {
  return (
    <HoverBorderGlow {...GET_STARTED_GLOW_PROPS}>
      <button
        type="button"
        className={`sf-get-started-btn${className ? ` ${className}` : ''}`}
        onClick={onClick}
      >
        <span className="sf-get-started-label">Get Started</span>
      </button>
    </HoverBorderGlow>
  );
}

const DESKTOP_GET_STARTED_FLOAT_TOP_PX = 76;

function getGetStartedFloatTopPx() {
  if (window.innerWidth >= 769) {
    return DESKTOP_GET_STARTED_FLOAT_TOP_PX;
  }

  const navEl = document.querySelector('.speed-friending-page .page-nav-bar-mobile');
  return (navEl?.getBoundingClientRect().bottom ?? 68) + 16;
}

function useFloatingGetStartedTop(anchorRef) {
  const [topPx, setTopPx] = useState(null);

  const measure = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const floatTop = getGetStartedFloatTopPx();
    const naturalTop = anchor.getBoundingClientRect().top;
    setTopPx(Math.max(floatTop, naturalTop));
  }, [anchorRef]);

  useEffect(() => {
    let rafId = null;

    const scheduleMeasure = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        measure();
        rafId = null;
      });
    };

    measure();
    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });

    const anchor = anchorRef.current;
    let ro = null;
    if (anchor && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(scheduleMeasure);
      ro.observe(anchor);
    }

    return () => {
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [anchorRef, measure]);

  return topPx;
}

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
};

const SpeedFriendingPage = () => {
  const navigate = useNavigate();
  useSpeedFriendingPageMeta();
  const getStartedAnchorRef = useRef(null);
  const floatingGetStartedTopPx = useFloatingGetStartedTop(getStartedAnchorRef);

  const handleGetStarted = () => {
    navigate('/new_organizer', { state: { showGeneralTutorial: true } });
  };

  return (
    <div className="speed-friending-page">
      <PageNavBar />

      <main className="speed-friending-content">
        <section className="sf-hero">
          <ScrollReveal as="h1" className="sf-hero-title" delay={0}>
            Stop running your speed friending events manually.
          </ScrollReveal>
          <ScrollReveal as="p" className="sf-hero-sub" delay={80}>
            Most organizers are still handling rotations, timing, match cards, and follow-ups after - It&apos;s way more work than people realize.
          </ScrollReveal>
          <ScrollReveal as="p" className="sf-hero-fix" delay={160}>
            Reuneo automates all of it. Attendees scan a QR code, rounds run themselves, and match results are handled automatically.
          </ScrollReveal>
          <ScrollReveal delay={240}>
            <ResidentialHeroTutorial />
          </ScrollReveal>
        </section>

        <section className="sf-gap">
          <div className="sf-section-inner sf-section-inner--wide">
            <ScrollReveal as="h2" className="sf-section-title sf-section-title--left">
              You built the event. You&apos;re still running it by hand.
            </ScrollReveal>
          </div>
        </section>

        <section className="sf-solution">
          <div className="sf-section-inner sf-section-inner--wide">
            <ScrollReveal as="h2" className="sf-section-title sf-section-title--right">
              Automated rounds. Real connections - on purpose.
            </ScrollReveal>
            <ScrollReveal className="sf-solution-cta">
              <div ref={getStartedAnchorRef} className="sf-solution-cta-anchor">
                <div className="sf-solution-cta-placeholder" aria-hidden="true">
                  <GetStartedButton onClick={handleGetStarted} />
                </div>
              </div>
            </ScrollReveal>
            <div className="sf-solution-points">
              <ScrollReveal className="sf-glass-card sf-solution-point">
                <h3>Attendees scan a QR code</h3>
                <p>No app download, no account required, just their name and a selfie, and they are in!</p>
              </ScrollReveal>
              <ScrollReveal className="sf-glass-card sf-solution-point">
                <h3>Rounds run automatically</h3>
                <p>Pairings, timing, and rotation handled by Reuneo. No printed arrows, no shouting switch.</p>
              </ScrollReveal>
              <ScrollReveal className="sf-glass-card sf-solution-point">
                <h3>Match results sent automatically</h3>
                <p>No cards to collect, cross-reference, or email after. The messy follow-up work disappears.</p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="sf-activities" id="activities">
          <div className="sf-activities-header">
            <ScrollReveal as="h2" className="sf-section-title">
              Speed friending formats your community will keep coming back for.
            </ScrollReveal>
            <ScrollReveal as="p" className="sf-section-sub">
              Pick a format, set interest-based matching in Reuneo, and let the rounds run themselves. People meet based on what they have in common, not just whoever shows up.
            </ScrollReveal>
          </div>
          <div className="sf-activities-grid">
            {ACTIVITIES.map((activity) => (
              <ScrollReveal
                key={activity.title}
                className="sf-glass-card sf-activity-card"
              >
                <div className="sf-activity-icon">
                  <ActivityIcon type={activity.icon} />
                </div>
                <h3>{activity.title}</h3>
                <p>{activity.copy}</p>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal as="p" className="sf-activities-callout">
            Same platform, whatever format you run. You pick the theme, Reuneo handles the pairing.
          </ScrollReveal>
        </section>

        <section className="sf-faq">
          <div className="sf-faq-header sf-section-inner">
            <ScrollReveal as="h2" className="sf-section-title">
              Questions organizers ask
            </ScrollReveal>
          </div>
          <div className="sf-faq-list">
            {FAQ_ITEMS.map((item) => (
              <ScrollReveal key={item.question} as="details" className="sf-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <ClientTestimonialsSection subtitle="Outsource the time, focus, and energy needed to run quality socials at your events" />
      </main>

      <ScrollReveal className="sf-footer-wrap">
        <SiteSocialFooter />
      </ScrollReveal>

      {floatingGetStartedTopPx !== null &&
        createPortal(
          <div
            className="sf-get-started-float"
            style={{ top: `${floatingGetStartedTopPx}px` }}
          >
            <GetStartedButton onClick={handleGetStarted} />
          </div>,
          document.body,
        )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
    </div>
  );
};

export default SpeedFriendingPage;
