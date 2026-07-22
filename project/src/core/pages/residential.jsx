import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import SiteSocialFooter from '../components/SiteSocialFooter/SiteSocialFooter';
import ClientTestimonialsSection from '../components/ClientTestimonialsSection/ClientTestimonialsSection';
import ResidentialHeroTutorial from '../components/ResidentialHeroTutorial/ResidentialHeroTutorial';
import HoverBorderGlow from '../components/HoverBorderGlow/HoverBorderGlow';
import './residential.css';

const PAGE_TITLE = 'Resident Events & Icebreakers for Apartment Communities | Reuneo';
const PAGE_DESCRIPTION =
  'Help residents actually meet at your next apartment event. Reuneo pairs neighbors into quick 1-on-1 conversations - no app, no awkward mingling. Try free.';
const PAGE_URL = 'https://reuneo.com/residential';
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
  { selector: 'meta[property="og:title"]', attr: 'content', value: PAGE_TITLE },
  { selector: 'meta[property="og:description"]', attr: 'content', value: PAGE_DESCRIPTION },
  { selector: 'meta[property="og:image"]', attr: 'content', value: PAGE_IMAGE },
  { selector: 'meta[property="twitter:card"]', attr: 'content', value: 'summary_large_image' },
  { selector: 'meta[property="twitter:url"]', attr: 'content', value: PAGE_URL },
  { selector: 'meta[property="twitter:title"]', attr: 'content', value: PAGE_TITLE },
  { selector: 'meta[property="twitter:description"]', attr: 'content', value: PAGE_DESCRIPTION },
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

function useResidentialPageMeta() {
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
      className={`res-reveal${visible ? ' res-reveal--in' : ''}${className ? ` ${className}` : ''}`}
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
    case 'girls':
      return (
        <svg {...props}>
          <circle cx="8.5" cy="7" r="2.5" />
          <path d="M5.5 19v-1.5a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3V19" />
          <circle cx="15.5" cy="7" r="2.5" />
          <path d="M12.5 19v-1.5a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3V19" />
        </svg>
      );
    case 'pet':
      return (
        <svg {...props}>
          <ellipse cx="12" cy="16" rx="3.2" ry="2.8" />
          <circle cx="7.5" cy="11" r="1.6" />
          <circle cx="10.5" cy="8.5" r="1.6" />
          <circle cx="13.5" cy="8.5" r="1.6" />
          <circle cx="16.5" cy="11" r="1.6" />
        </svg>
      );
    case 'moms':
      return (
        <svg {...props}>
          <circle cx="7.5" cy="8" r="2.2" />
          <path d="M5 18.5v-1.2a2.5 2.5 0 0 1 2.5-2.5h0" />
          <circle cx="16.5" cy="8" r="2.2" />
          <path d="M19 18.5v-1.2a2.5 2.5 0 0 0-2.5-2.5h0" />
          <path d="M12 14.8c-1.45 0-2.55-.73-3.1-1.78.35-.5.95-.82 1.55-.82.65 0 1.2.32 1.55.82.35-.5.9-.82 1.55-.82.6 0 1.2.27 1.55.72-.55 1.05-1.65 1.78-3.1 1.78z" />
        </svg>
      );
    case 'fitness':
      return (
        <svg {...props}>
          <path d="M6 10v4" />
          <path d="M18 10v4" />
          <rect x="4" y="9" width="3" height="6" rx="1" />
          <rect x="17" y="9" width="3" height="6" rx="1" />
          <path d="M7 12h10" />
        </svg>
      );
    case 'happy-hour':
      return (
        <svg {...props}>
          <path d="M9 4h6l-2.2 8H11.2L9 4z" />
          <path d="M11.2 12h1.6" />
          <path d="M12 12v5.5" />
          <path d="M9.5 17.5h5" />
        </svg>
      );
    case 'astrology':
      return (
        <svg {...props}>
          <path d="M16.5 6.5a6.5 6.5 0 1 0-2.2 4.8" />
          <path d="M16.5 6.5 19 4" />
          <path d="M16.5 6.5V4" />
          <path d="M16.5 6.5H19" />
        </svg>
      );
    case 'book':
      return (
        <svg {...props}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H12v18H7.5A2.5 2.5 0 0 1 5 18.5V5.5z" />
          <path d="M12 3h4.5A2.5 2.5 0 0 1 19 5.5v13A2.5 2.5 0 0 1 16.5 21H12V3z" />
          <path d="M8 7h2.5" />
          <path d="M8 10h2.5" />
          <path d="M13.5 7H16" />
          <path d="M13.5 10H16" />
        </svg>
      );
    default:
      return null;
  }
}

const PROPERTY_VALUE_POINTS = [
  {
    title: 'Retention, not just events',
    copy: 'Resident events are supposed to build loyalty. Reuneo turns one-off mixers into a reason residents renew - real connections, not just another flyer on the door.',
  },
  {
    title: 'Zero lift for your team',
    copy: 'No extra staff time, no setup headaches. Your team creates the event, hits start, and Reuneo runs the room - freeing your leasing team to focus on residents, not logistics.',
  },
  {
    title: 'One platform, every property',
    copy: "Whether it's one community or your whole portfolio, Reuneo scales the same way - one login, consistent experience, easy to roll out property by property.",
  },
];

const ACTIVITIES = [
  {
    title: 'Girls Speed Friending',
    copy: "Women in the building meet women they've never talked to. Quick rounds, easy conversation, no awkward standing around hoping someone approaches.",
    icon: 'girls',
  },
  {
    title: 'Pet Parent Speed Friending',
    copy: 'Dog people meet dog people. Cat people meet cat people. Give residents an easy reason to say hello before the small talk runs out.',
    icon: 'pet',
  },
  {
    title: 'Moms Speed Friending',
    copy: 'Parents at the same stage of life meet each other on purpose — not just whoever happens to be at the playground. Light matching keeps it relevant.',
    icon: 'moms',
  },
  {
    title: 'Fitness Pal Speed Friending',
    copy: 'Pair residents around gym, running, yoga, or wellness interests. A natural fit for events near the fitness center, pool, or studio.',
    icon: 'fitness',
  },
  {
    title: 'Happy Hour Speed Friending',
    copy: 'Start with structured introductions for the first 20-30 minutes, then open it up. Mingling lands different when people already know someone in the room.',
    icon: 'happy-hour',
  },
  {
    title: 'Astrology Speed Friending',
    copy: 'Low-stakes, high-personality theme night. Residents meet neighbors through quick rounds before the group opens up. Signs optional, vibes required.',
    icon: 'astrology',
  },
  {
    title: 'Book Worm Speed Friending',
    copy: "Match readers by genre or what they're into right now. Works anywhere residents already slow down — the lounge, library, or co-working space.",
    icon: 'book',
    highlight: true,
  },
];

const FAQ_ITEMS = [
  {
    question: 'What are good icebreaker activities for apartment resident events?',
    answer:
      'Themed speed friending nights work especially well: Girls Speed Friending, Pet Parent Speed Friending, Moms Speed Friending, Fitness Pal, Happy Hour, Astrology, or Book Worm events. Reuneo runs timed 1-on-1 pairing rounds with optional light interest matching. No app download.',
  },
  {
    question: 'How does speed networking work at a luxury apartment community event?',
    answer:
      'Reuneo runs quick pairing rounds in the first 30 minutes so the room connects before open mingling. No app download required.',
  },
  {
    question: 'Do residents need to download an app?',
    answer: 'No. QR scan, name, photo. Done.',
  },
  {
    question: 'How do you help new residents meet neighbors at a building mixer?',
    answer:
      'Random pairing gets everyone included. Optional light matching can pair new residents with longtime residents.',
  },
  {
    question: 'How long does setup take for property staff?',
    answer:
      'Organizer creates a lobby, displays QR. Minutes, not hours. No extra work during the event.',
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
        className={`res-get-started-btn${className ? ` ${className}` : ''}`}
        onClick={onClick}
      >
        <span className="res-get-started-label">Get Started</span>
      </button>
    </HoverBorderGlow>
  );
}

/** Desktop: lock below 60px PageNavBar — same as App.jsx CREATE_BTN_FLOATING_TOP. */
const DESKTOP_GET_STARTED_FLOAT_TOP_PX = 76;

function getGetStartedFloatTopPx() {
  if (window.innerWidth >= 769) {
    return DESKTOP_GET_STARTED_FLOAT_TOP_PX;
  }

  const navEl = document.querySelector('.residential-page .page-nav-bar-mobile');
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

const ResidentialPage = () => {
  const navigate = useNavigate();
  useResidentialPageMeta();
  const getStartedAnchorRef = useRef(null);
  const floatingGetStartedTopPx = useFloatingGetStartedTop(getStartedAnchorRef);

  const handleGetStarted = () => {
    navigate('/new_organizer', { state: { fromResidential: true } });
  };

  return (
    <div className="residential-page">
      <PageNavBar />

      <main className="residential-content">
        {/* Hero */}
        <section className="res-hero">
          <ScrollReveal as="h1" className="res-hero-title" delay={0}>
            Help every resident feel like they belong.
          </ScrollReveal>
          <ScrollReveal as="p" className="res-hero-sub" delay={80}>
            Most resident events look good on the calendar, but once people show up, they often just grab a drink and stick with whoever they already know.
          </ScrollReveal>
          <ScrollReveal as="p" className="res-hero-fix" delay={160}>
            Reuneo fixes that. We pair people into engaging 1-on-1 conversations. No app, no awkwardness.
          </ScrollReveal>
          <ScrollReveal delay={240}>
            <ResidentialHeroTutorial />
          </ScrollReveal>
        </section>

        {/* Gap */}
        <section className="res-gap">
          <div className="res-section-inner res-section-inner--wide">
            <ScrollReveal as="h2" className="res-section-title res-section-title--left">
              You nail the setup. Connection is still left to chance.
            </ScrollReveal>
          </div>
        </section>

        {/* Solution */}
        <section className="res-solution">
          <div className="res-section-inner res-section-inner--wide">
            <ScrollReveal as="h2" className="res-section-title res-section-title--right">
              Quick pairings. Real neighbor introductions.
            </ScrollReveal>
            <ScrollReveal className="res-solution-cta">
              <div ref={getStartedAnchorRef} className="res-solution-cta-anchor">
                <div className="res-solution-cta-placeholder" aria-hidden="true">
                  <GetStartedButton onClick={handleGetStarted} />
                </div>
              </div>
            </ScrollReveal>
            <div className="res-solution-points">
              <ScrollReveal className="res-glass-card res-solution-point">
                <h3>Residents scan a QR code</h3>
                <p>No app download, no account required.</p>
              </ScrollReveal>
              <ScrollReveal className="res-glass-card res-solution-point">
                <h3>Quick 1-on-1 pairings</h3>
                <p>Timed rounds, low pressure, no awkward mingling.</p>
              </ScrollReveal>
              <ScrollReveal className="res-glass-card res-solution-point">
                <h3>Everyone meets someone new</h3>
                <p>Neighbor introductions on purpose, not left to chance.</p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Property Value */}
        <section className="res-property-value">
          <div className="res-section-inner res-section-inner--wide">
            <ScrollReveal as="h2" className="res-section-title res-section-title--left">
              Built for property teams, not just residents
            </ScrollReveal>
            <div className="res-solution-points res-property-value-points">
              {PROPERTY_VALUE_POINTS.map((point) => (
                <ScrollReveal key={point.title} className="res-glass-card res-solution-point">
                  <h3>{point.title}</h3>
                  <p>{point.copy}</p>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Activities */}
        <section className="res-activities" id="activities">
          <div className="res-activities-header">
            <ScrollReveal as="h2" className="res-section-title">
              Speed friending ideas your residents will actually show up for.
            </ScrollReveal>
            <ScrollReveal as="p" className="res-section-sub">
              Pick a theme, set light interest matching in Reuneo, and run quick 1-on-1 rounds so neighbors meet people who share something in common - not just whoever they came with.
            </ScrollReveal>
          </div>
          <div className="res-activities-grid">
            {ACTIVITIES.map((activity) => (
              <ScrollReveal
                key={activity.title}
                className={`res-glass-card res-activity-card${activity.highlight ? ' res-activity-card--highlight' : ''}`}
              >
                <div className="res-activity-icon">
                  <ActivityIcon type={activity.icon} />
                </div>
                <h3>{activity.title}</h3>
                <p>{activity.copy}</p>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal as="p" className="res-activities-callout">
            Same platform, different theme every month. Your team picks the event, Reuneo handles the pairing.
          </ScrollReveal>
        </section>

        {/* FAQ */}
        <section className="res-faq">
          <div className="res-faq-header res-section-inner">
            <ScrollReveal as="h2" className="res-section-title">
              Questions property teams ask
            </ScrollReveal>
          </div>
          <div className="res-faq-list">
            {FAQ_ITEMS.map((item) => (
              <ScrollReveal key={item.question} as="details" className="res-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <ClientTestimonialsSection subtitle="Outsource the time, focus, and energy needed to run quality socials at your events" />
      </main>

      <ScrollReveal className="res-footer-wrap">
        <SiteSocialFooter />
      </ScrollReveal>

      {floatingGetStartedTopPx !== null &&
        createPortal(
          <div
            className="res-get-started-float"
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

export default ResidentialPage;
