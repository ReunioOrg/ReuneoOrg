import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './ClientTestimonialsSection.css';

const logo = (filename) => `/assets/clients/${encodeURIComponent(filename)}`;

const TESTIMONIALS = [
  {
    img: logo('Texas State University.png'),
    quote: '"It helps new people get plugged in right away."',
    name: 'Terrance M.',
    org: 'Texas State University',
  },
  {
    img: logo('Georgia State University.png'),
    quote: '"Our 150-person event was smooth. People were so immersed."',
    name: 'Zayreton S.',
    org: 'Georgia State University',
  },
  {
    img: logo('The Woodlands Womens Collective.png'),
    quote: '"It\'s contagious in the best way possible. It\'s always a highlight for my events."',
    name: 'Alana S.',
    org: 'The Woodlands Womens Collective',
  },
  {
    img: logo('Turnout.png'),
    quote: '"Event content is tedious, but they\'ve perfected it. Everyone just wants to meet each other."',
    name: 'Dan K.',
    org: 'Turnout',
  },
  {
    img: logo('ATX GirlHangouts.png'),
    quote: '"We only intended to use it for 20 min. It lasted for the whole event. It\'s a 10/10."',
    name: 'Jodie R.',
    org: 'ATX GirlHangouts',
  },
  {
    img: logo('Big Sister AI.png'),
    quote: '"The best ice-breaker at our sales events."',
    name: 'Valentyn Y.',
    org: 'Big Sister AI',
  },
  {
    img: logo('Leadership McAllen.png'),
    quote: '"People talk about it even after the event. The experience is that memorable."',
    name: 'Kristina G.',
    org: 'Leadership McAllen',
  },
  {
    img: logo('Prairie View AM University.png'),
    quote: '"Magic in a box, literally."',
    name: 'Marques M.',
    org: 'Prairie View A&M University',
  },
  {
    img: logo('Amigos Meet.png'),
    quote: '"It\'s my secret tool in the Miami social scene."',
    name: 'Stephanie P.',
    org: 'Amigos Meet',
  },
];

function ClientTestimonialsSection({ subtitle, hideHeader = false, homeSpacing = false }) {
  const sectionRef = useRef(null);
  const carouselRef = useRef(null);
  const rafRef = useRef(null);
  const isPausedRef = useRef(false);
  const scrollPosRef = useRef(0);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimateIn(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const carousel = carouselRef.current;
    if (!section || !carousel) return;

    let started = false;
    const SPEED = 0.8;

    const tick = () => {
      if (!isPausedRef.current && carousel) {
        scrollPosRef.current += SPEED;
        const half = carousel.scrollWidth / 2;
        if (scrollPosRef.current >= half) {
          scrollPosRef.current = 0;
        }
        carousel.scrollLeft = scrollPosRef.current;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            rafRef.current = requestAnimationFrame(tick);
            visibilityObserver.unobserve(section);
          }
        });
      },
      { threshold: 0.15 },
    );

    visibilityObserver.observe(section);

    return () => {
      visibilityObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const doubled = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section
      ref={sectionRef}
      className={`lp-testimonials-section${homeSpacing ? ' lp-testimonials-section--home' : ''}${animateIn ? ' lp-t-animate-in' : ''}`}
      aria-label={hideHeader ? 'Client testimonials' : undefined}
    >
      {hideHeader ? null : (
        <div className={`lp-testimonials-header${animateIn ? ' lp-t-header-in' : ''}`}>
          <h2 className="lp-t-title">What our clients are saying.</h2>
          {subtitle ? <p className="lp-t-subtitle">{subtitle}</p> : null}
        </div>
      )}
      <div
        ref={carouselRef}
        className="lp-t-carousel"
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; }}
      >
        <div className="lp-t-track">
          {doubled.map((t, i) => (
            <div
              key={i}
              className={`lp-t-card${animateIn ? ' lp-t-card--in' : ''}`}
              style={{ animationDelay: `${0.35 + (i % TESTIMONIALS.length) * 0.17}s` }}
            >
              <div className="lp-t-avatar">
                <img src={t.img} alt={t.name} className="lp-t-avatar-img" />
              </div>
              <p className="lp-t-quote">{t.quote}</p>
              <div className="lp-t-author">
                <p className="lp-t-name">{t.name}</p>
                <p className="lp-t-org">{t.org}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

ClientTestimonialsSection.propTypes = {
  subtitle: PropTypes.string,
  hideHeader: PropTypes.bool,
  homeSpacing: PropTypes.bool,
};

export default ClientTestimonialsSection;
