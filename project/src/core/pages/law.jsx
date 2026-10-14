import { useEffect } from 'react';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import SiteSocialFooter from '../components/SiteSocialFooter/SiteSocialFooter';
import { PhoneMockup, SARAH_RAMIREZ_PROFILE } from '../components/DesktopPhoneMockups/LandingPhoneMockup.jsx';
import '../components/DesktopPhoneMockups/DesktopPhoneMockups.css';
import './law.css';

const PAGE_TITLE = 'Reuneo for Startup Law Firms';
const PAGE_DESCRIPTION =
  'Sponsor a founder event and we pair your partners 1-on-1 with the best-fit founders in the room. Up to 10 conversations each.';
const PAGE_URL = 'https://reuneo.com/law';
const PAGE_IMAGE = 'https://reuneo.com/assets/reuneo_test_14.png';
const BOOK_URL = 'https://calendly.com/julian-reuneo/30min';

const DEFAULT_TITLE = 'Reuneo - Elevate Your Events';
const DEFAULT_DESCRIPTION = 'The perfect icebreaker';
const DEFAULT_URL = 'https://reuneo.com/';

const META_SPECS = [
  { selector: 'meta[name="title"]', attr: 'content', value: PAGE_TITLE },
  { selector: 'meta[name="description"]', attr: 'content', value: PAGE_DESCRIPTION },
  { selector: 'meta[name="robots"]', attr: 'content', value: 'noindex, nofollow' },
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

const STEPS = [
  {
    n: '01',
    text: 'Tell us who you want to meet. Stage, sector, whatever matters.',
  },
  {
    n: '02',
    text: 'Show up. Founders scan a QR and get paired. Your team gets paired first.',
  },
  {
    n: '03',
    text: 'Leave with the list. Every founder you met, ready for follow-up.',
  },
];

const PILLARS = [
  {
    key: 'meetings',
    label: 'MEETINGS',
    text: 'Up to 10 six-minute 1:1s per partner.',
    tint: true,
  },
  {
    key: 'presence',
    label: 'PRESENCE',
    text: 'Your firm hosts the networking. Name on every screen.',
  },
  {
    key: 'proof',
    label: 'PROOF',
    text: 'A list of every founder you met. No badge scans.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is this an app?',
    answer: 'No. Founders scan a QR code.',
  },
  {
    question: 'Does the organizer agree?',
    answer: 'We handle everything with them and ensure payment.',
  },
  {
    question: "What if the right founders aren't there?",
    answer: "We'll tell you before you spend a dollar, and find a better room.",
  },
];

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

function setMetaContent(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
}

function useLawPageMeta() {
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

function BookCall() {
  return (
    <a
      className="law-book"
      href={BOOK_URL}
      target="_blank"
      rel="noopener"
    >
      Book a call
    </a>
  );
}

const LawPage = () => {
  useLawPageMeta();

  return (
    <div className="law-page">
      <PageNavBar />

      <main className="law-main">
        <section className="law-hero">
          <div className="law-wrap law-hero-grid">
            <div className="law-hero-copy">
              <p className="law-eyebrow">FOR STARTUP LAW FIRMS · AUSTIN</p>
              <h1>Meet the founders before they pick their lawyer.</h1>
              <p className="law-hero-body">
                Sponsor a founder event and we pair your partners 1-on-1 with the best-fit founders in the room. Up to 10 conversations each.
              </p>
              <BookCall />
            </div>
            <div className="law-phone">
              <span className="law-example">Example</span>
              <div aria-hidden="true">
                <PhoneMockup profile={SARAH_RAMIREZ_PROFILE} slotIndex={0} staticScreen />
              </div>
              <span className="law-host-pill">Hosted by Your Firm</span>
            </div>
          </div>
        </section>

        <section className="law-problem" aria-label="The problem">
          <div className="law-wrap">
            <p>You&apos;ve sponsored the pitch night.</p>
            <p>Logo on the slide. Table by the door.</p>
            <p>The right founders were in the room.</p>
            <p>You just never met them.</p>
          </div>
        </section>

        <section className="law-reframe">
          <div className="law-wrap">
            <h2>
              Sponsorship buys you visibility.
              <br />
              Reuneo makes it buy you meetings.
            </h2>
          </div>
        </section>

        <section className="law-how">
          <div className="law-wrap">
            <h2 className="law-eyebrow">HOW IT WORKS</h2>
            <ol className="law-steps">
              {STEPS.map((step) => (
                <li key={step.n}>
                  <span className="law-num">{step.n}</span>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="law-pillars" aria-label="What you get">
          <div className="law-wrap">
            <ul className="law-pillar-grid">
              {PILLARS.map((pillar) => (
                <li
                  key={pillar.key}
                  className={`law-pillar${pillar.tint ? ' law-pillar--meetings' : ''}`}
                >
                  <h3>{pillar.label}</h3>
                  <p>{pillar.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="law-pricing">
          <div className="law-wrap law-pricing-grid">
            <div>
              <h2 className="law-eyebrow">PRICING</h2>
              <p className="law-price">$500</p>
              <p className="law-price-unit">per conversation.</p>
            </div>
            <p className="law-price-note">8 to 10 qualified conversations in 1 hour.</p>
          </div>
        </section>

        <section className="law-faq">
          <div className="law-wrap">
            <h2 className="law-eyebrow">FAQ</h2>
            <dl className="law-faq-list">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question} className="law-faq-row">
                  <dt>{item.question}</dt>
                  <dd>{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="law-close">
          <div className="law-wrap law-close-inner">
            <h2>Tell us which event you&apos;re sponsoring next.</h2>
            <p>We&apos;ll show you what can happen.</p>
            <BookCall />
          </div>
        </section>
      </main>

      <SiteSocialFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
    </div>
  );
};

export default LawPage;
