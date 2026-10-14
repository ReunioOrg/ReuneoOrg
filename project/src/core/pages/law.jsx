import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import SiteSocialFooter from '../components/SiteSocialFooter/SiteSocialFooter';
import DesktopPhoneMockups from '../components/DesktopPhoneMockups/DesktopPhoneMockups';
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

function IconMeetings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconPresence() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function IconProof() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

const PILLARS = [
  {
    key: 'meetings',
    label: 'MEETINGS',
    text: 'Up to 10 six-minute 1:1s per partner.',
    Icon: IconMeetings,
  },
  {
    key: 'presence',
    label: 'PRESENCE',
    text: 'Your firm hosts the networking. Name on every screen.',
    Icon: IconPresence,
  },
  {
    key: 'proof',
    label: 'PROOF',
    text: 'A list of every founder you met. No badge scans.',
    Icon: IconProof,
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

const EASE = [0.22, 1, 0.36, 1];

function useQuietMotion() {
  const librarySays = useReducedMotion();
  const [reduce] = useState(() => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));
  return Boolean(librarySays) || reduce;
}

const MOTION_TAG = {
  div: motion.div,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  li: motion.li,
  ol: motion.ol,
  ul: motion.ul,
  dl: motion.dl,
};

function Reveal({ as = 'div', className, children, delay = 0, y = 14 }) {
  const reduce = useQuietMotion();
  const Tag = as;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  const MotionTag = MOTION_TAG[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: 0.62, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

const rowVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

function RevealRow({ as = 'div', className, children }) {
  const reduce = useQuietMotion();
  const Tag = as;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  const MotionTag = MOTION_TAG[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={rowVariants}
    >
      {children}
    </MotionTag>
  );
}

function RevealItem({ as = 'div', className, children, lift = false }) {
  const reduce = useQuietMotion();
  const Tag = as;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  const MotionTag = MOTION_TAG[as] || motion.div;
  return (
    <MotionTag
      className={className}
      variants={itemVariants}
      whileHover={lift ? { y: -4, transition: { duration: 0.35, ease: EASE } } : undefined}
    >
      {children}
    </MotionTag>
  );
}

Reveal.propTypes = {
  as: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  delay: PropTypes.number,
  y: PropTypes.number,
};

RevealRow.propTypes = {
  as: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

RevealItem.propTypes = {
  as: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  lift: PropTypes.bool,
};

function LawPhone() {
  const reduce = useQuietMotion();
  return (
    <motion.div
      className="law-phone"
      aria-hidden="true"
      initial={reduce ? false : { opacity: 0, y: 22, scale: 0.965 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: 'spring', stiffness: 230, damping: 26, mass: 0.85, delay: 0.12 }
      }
    >
      <DesktopPhoneMockups singleRotating />
    </motion.div>
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
              <Reveal as="h1">Meet the founders before they pick their lawyer.</Reveal>
              <Reveal as="p" className="law-hero-body" delay={0.08} y={10}>
                Sponsor a founder event and we pair your partners 1-on-1 with the best-fit founders in the room. Up to 10 conversations each.
              </Reveal>
              <Reveal delay={0.14} y={10}>
                <BookCall />
              </Reveal>
            </div>
            <LawPhone />
          </div>
        </section>

        <section className="law-band law-problem" aria-label="The problem">
          <RevealRow className="law-wrap">
            <RevealItem as="p">You&apos;ve sponsored the pitch night.</RevealItem>
            <RevealItem as="p">Logo on the slide. Table by the door.</RevealItem>
            <RevealItem as="p">The right founders were in the room.</RevealItem>
            <RevealItem as="p">You just never met them.</RevealItem>
          </RevealRow>
        </section>

        <section className="law-band law-reframe">
          <div className="law-wrap">
            <Reveal as="h2">
              Sponsorship buys you visibility.
              <br />
              Reuneo makes it buy you meetings.
            </Reveal>
          </div>
        </section>

        <section className="law-band law-how">
          <div className="law-wrap">
            <Reveal as="h2" className="law-eyebrow" y={8}>HOW IT WORKS</Reveal>
            <RevealRow as="ol" className="law-steps">
              {STEPS.map((step, index) => (
                <RevealItem as="li" key={step.n} className="law-card law-step" lift>
                  <div className="law-step-index">
                    <span className="law-num">{step.n}</span>
                    {index < STEPS.length - 1 ? <span className="law-rail" aria-hidden="true" /> : null}
                  </div>
                  <p>{step.text}</p>
                </RevealItem>
              ))}
            </RevealRow>
          </div>
        </section>

        <section className="law-band law-pillars" aria-label="What you get">
          <div className="law-wrap">
            <RevealRow as="ul" className="law-pillar-grid">
              {PILLARS.map((pillar) => (
                <RevealItem as="li" key={pillar.key} className="law-card law-pillar" lift>
                  <span className="law-icon" aria-hidden="true"><pillar.Icon /></span>
                  <h3>{pillar.label}</h3>
                  <p>{pillar.text}</p>
                </RevealItem>
              ))}
            </RevealRow>
          </div>
        </section>

        <section className="law-band law-pricing">
          <Reveal className="law-wrap law-pricing-grid" y={16}>
            <div>
              <h2 className="law-eyebrow">PRICING</h2>
              <p className="law-price">$500</p>
              <p className="law-price-unit">per conversation.</p>
            </div>
            <p className="law-price-note">10 qualified conversations in 1 hour.</p>
          </Reveal>
        </section>

        <section className="law-band law-faq">
          <div className="law-wrap">
            <Reveal as="h2" className="law-eyebrow" y={8}>FAQ</Reveal>
            <RevealRow as="dl" className="law-faq-list">
              {FAQ_ITEMS.map((item) => (
                <RevealItem as="div" key={item.question} className="law-faq-row">
                  <dt>{item.question}</dt>
                  <dd>{item.answer}</dd>
                </RevealItem>
              ))}
            </RevealRow>
          </div>
        </section>

        <section className="law-band law-close">
          <div className="law-wrap law-close-inner">
            <Reveal as="h2">Tell us which event you&apos;re sponsoring next.</Reveal>
            <Reveal as="p" delay={0.08} y={10}>We&apos;ll show you what can happen.</Reveal>
            <Reveal delay={0.14} y={10}>
              <BookCall />
            </Reveal>
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
