import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageNavBar from '../components/PageNavBar/PageNavBar';
import SiteSocialFooter from '../components/SiteSocialFooter/SiteSocialFooter';
import CoolerGeneralMatchEventFlow from '../Tutorials/cooler_general_match_event_flow';
import ClientTestimonialsSection from '../components/ClientTestimonialsSection/ClientTestimonialsSection';
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

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const ACTIVITIES = [
  {
    title: 'Girls Speed Friending',
    copy: 'A low-pressure mixer for women in the building to meet neighbors outside their usual circle. Strong fit for new residents who want to expand their social circle fast.',
    tag: 'Light matching recommended',
  },
  {
    title: 'Pet Parent Speed Friending',
    copy: 'Dog owners meet dog owners, cat people meet cat people. An easy conversation starter before anyone falls into awkward small talk.',
    tag: 'Light matching recommended',
  },
  {
    title: 'Moms Speed Friending',
    copy: 'Connect parents navigating the same stage of life. Use light matching so moms meet other moms in the building, not just whoever is standing nearby.',
    tag: 'Light matching recommended',
  },
  {
    title: 'Fitness Pal Speed Friending',
    copy: 'Pair residents around gym, yoga, running, or wellness interests. Perfect for amenity socials near the fitness center, pool, or studio space.',
    tag: 'Great for rooftop / lounge',
  },
  {
    title: 'Happy Hour Speed Friending',
    copy: 'Run structured neighbor introductions in the first 30 minutes of a rooftop or lounge event, then let open mingling build on real connections.',
    tag: 'Great for rooftop / lounge',
  },
  {
    title: 'Astrology Speed Friending',
    copy: 'A fun, low-stakes theme night. Residents share signs or interests and meet neighbors through quick 1-on-1 rounds before the group mingles.',
    tag: null,
  },
  {
    title: 'Book Worm Speed Friending',
    copy: 'Match readers by genre or what they are reading now. Ideal for lounge, library, or co-working amenity spaces.',
    tag: 'Light matching recommended',
    highlight: true,
  },
];

const RESIDENT_STEPS = [
  {
    number: '1',
    title: 'Scan the QR code in the lobby or event space',
    description: 'Guests point their phone camera at the room\'s QR code - no app download, no sign-up.',
  },
  {
    number: '2',
    title: 'Enter a name (seconds, no sign-up)',
    description: 'Any name they choose, typed in seconds. That\'s the only info required.',
  },
  {
    number: '3',
    title: 'Take a quick photo so their match can find them in the room',
    description: 'So their paired match can spot them across the room. Done - they\'re in.',
  },
];

const TRUST_CARDS = [
  {
    title: 'No extra work',
    copy: 'Hit Start and Reuneo runs the room. Your team keeps doing what they already do.',
  },
  {
    title: 'No app download',
    copy: 'QR scan, name, photo. Residents are in. No app, no awkwardness.',
  },
  {
    title: 'Works in the first 30 min',
    copy: 'Perfect window before open mingling. The room feels connected early.',
  },
  {
    title: 'Real neighbor introductions',
    copy: 'Quick 1-on-1 pairings so residents meet new people, not just familiar faces.',
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
  const [showTutorial, setShowTutorial] = useState(true);
  const navigate = useNavigate();
  useResidentialPageMeta();

  const handleTryFree = () => {
    navigate('/new_organizer', { state: { fromTutorial: true } });
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
          <ScrollReveal className="res-hero-ctas" delay={240}>
            <button type="button" className="res-primary-btn" onClick={handleTryFree}>
              Try Reuneo Free
            </button>
            <div className="res-hero-cta-links">
              <button type="button" className="res-text-link" onClick={() => scrollToId('activities')}>
                See event ideas
              </button>
              <span className="res-hero-cta-sep" aria-hidden="true">|</span>
              <button type="button" className="res-text-link" onClick={() => scrollToId('demo')}>
                See it in action
              </button>
            </div>
          </ScrollReveal>
        </section>

        {/* Gap */}
        <section className="res-gap">
          <div className="res-section-inner">
            <ScrollReveal as="h2" className="res-section-title">
              You nail the setup. Connection is still left to chance.
            </ScrollReveal>
            <ScrollReveal as="p" className="res-gap-intro">
              Most resident events nail the setup - food, drinks, good turnout. Whether residents actually meet new neighbors is still usually left to chance.
            </ScrollReveal>
            <ScrollReveal as="ul" className="res-gap-bullets">
              <li>Residents grab a drink and stick with people they already know</li>
              <li>New neighbors leave having met no one new</li>
              <li>The event looked great on the calendar, but the room never fully connected</li>
            </ScrollReveal>
            <ScrollReveal as="blockquote" className="res-pull-quote">
              Meet new people, not just whoever they rode the elevator with.
            </ScrollReveal>
            <ScrollReveal as="p" className="res-gap-close">
              That&apos;s the gap Reuneo fills.
            </ScrollReveal>
          </div>
        </section>

        {/* Solution */}
        <section className="res-solution">
          <div className="res-section-inner">
            <ScrollReveal as="h2" className="res-section-title">
              Quick pairings. Real neighbor introductions.
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
            <ScrollReveal as="p" className="res-solution-callout">
              Random pairing works best for inclusion. You can also match new residents with longtime residents, or group by shared interests when it fits the event.
            </ScrollReveal>
          </div>
        </section>

        {/* First 30 min */}
        <section className="res-timing">
          <div className="res-section-inner">
            <ScrollReveal as="h2" className="res-section-title">
              The first 30 minutes are usually the hardest part.
            </ScrollReveal>
            <ScrollReveal as="p" className="res-timing-body">
              That&apos;s actually the perfect window for Reuneo. Residents scan a QR code, get paired into quick 1-on-1 conversations, and the room starts feeling connected before everyone settles into open mingling.
            </ScrollReveal>
            <div className="res-before-after">
              <ScrollReveal className="res-glass-card res-ba-card">
                <h3>Without Reuneo</h3>
                <ul className="res-ba-list">
                  <li>Awkward first half-hour</li>
                  <li>People cluster by who they know</li>
                  <li>Open mingling never quite clicks</li>
                </ul>
              </ScrollReveal>
              <ScrollReveal className="res-glass-card res-ba-card res-ba-card--with">
                <h3>With Reuneo</h3>
                <ul className="res-ba-list">
                  <li>Room feels connected early</li>
                  <li>Everyone meets someone new first</li>
                  <li>Mingling builds on real introductions</li>
                </ul>
              </ScrollReveal>
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
          <ScrollReveal as="p" className="res-activities-intro">
            Reuneo works like speed networking built for apartment communities. Each idea below is a resident event you can launch with a QR code, timed pairing rounds, and no app download.
          </ScrollReveal>
          <div className="res-activities-grid">
            {ACTIVITIES.map((activity) => (
              <ScrollReveal
                key={activity.title}
                className={`res-glass-card res-activity-card${activity.highlight ? ' res-activity-card--highlight' : ''}`}
              >
                <h3>{activity.title}</h3>
                <p>{activity.copy}</p>
                {activity.tag && <span className="res-activity-tag">{activity.tag}</span>}
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal as="p" className="res-activities-callout">
            Same platform, different theme every month. Your team picks the event, Reuneo handles the pairing.
          </ScrollReveal>
          <ScrollReveal className="res-activities-cta">
            <button type="button" className="res-primary-btn" onClick={handleTryFree}>
              Try an activity free
            </button>
          </ScrollReveal>
        </section>

        {/* Steps */}
        <section className="res-steps">
          <div className="res-section-inner res-section-inner--wide">
            <div className="res-steps-header">
              <ScrollReveal as="h2" className="res-section-title">
                How residents join in 3 simple steps
              </ScrollReveal>
              <ScrollReveal as="p" className="res-section-sub">
                Convert a room of strangers into a community of engaged, connected residents.
              </ScrollReveal>
            </div>
            <div className="res-steps-container">
              {RESIDENT_STEPS.map((step) => (
                <ScrollReveal key={step.number} className="res-glass-card res-step-item">
                  <div className="res-step-number">{step.number}</div>
                  <div className="res-step-content">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Demo */}
        <section className="res-demo" id="demo">
          <div className="res-demo-header">
            <ScrollReveal as="h2" className="res-section-title">
              See what your residents experience
            </ScrollReveal>
            <ScrollReveal as="p" className="res-section-sub">
              Watch how Reuneo guides attendees through live pairing - the same flow your residents would use at your next event.
            </ScrollReveal>
          </div>

          {!showTutorial && (
            <ScrollReveal className="res-demo-cta-group">
              <button
                type="button"
                className="res-replay-btn"
                onClick={() => setShowTutorial(true)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Replay
              </button>
              <button type="button" className="res-primary-btn" onClick={handleTryFree}>
                Try Reuneo Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </ScrollReveal>
          )}

          <ScrollReveal className="res-demo-flow-container">
            <CoolerGeneralMatchEventFlow
              isVisible={showTutorial}
              onComplete={() => setShowTutorial(false)}
            />
          </ScrollReveal>
        </section>

        {/* Trust */}
        <section className="res-trust">
          <div className="res-trust-header">
            <ScrollReveal as="h2" className="res-section-title">
              No extra work for your team
            </ScrollReveal>
          </div>
          <div className="res-trust-grid">
            {TRUST_CARDS.map((card) => (
              <ScrollReveal key={card.title} className="res-glass-card res-trust-card">
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </ScrollReveal>
            ))}
          </div>
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
        <ClientTestimonialsSection subtitle="Property teams and event organizers use Reuneo to help residents actually meet at live events." />

        {/* Final CTA */}
        <section className="res-final-cta">
          <ScrollReveal className="res-glass-card res-final-cta-inner">
            <h2 className="res-section-title">
              Make your next resident event feel more connected, on purpose.
            </h2>
            <p className="res-section-sub">
              Instead of leaving neighbor introductions up to chance, try Reuneo free. Could be a simple fit for your next event.
            </p>
            <div className="res-final-cta-actions">
              <button type="button" className="res-primary-btn" onClick={handleTryFree}>
                Try Reuneo Free
              </button>
              <Link to="/contact" className="res-secondary-link">
                Questions? Contact us
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <ScrollReveal className="res-footer-wrap">
        <SiteSocialFooter />
      </ScrollReveal>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
    </div>
  );
};

export default ResidentialPage;
