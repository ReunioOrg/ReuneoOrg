import React, { useEffect, useRef, useState } from 'react';
import './ClientTestimonialsSection.css';

const TESTIMONIALS = [
  {
    img: 'https://dl.dropboxusercontent.com/scl/fi/7vu0tjapuvp1y7tqi2yrq/alana-strong-image.jpg?rlkey=v4iwoaqaqi9pikku0zh1ho5py&st=egydhle6&dl=0',
    quote: '"When I first tried it, I only intended on using it for 20 min - we ran it for the whole event. It\'s a 10/10."',
    name: 'Alana S.',
    org: 'The Woodlands Womens Collective',
  },
  {
    img: 'https://dl.dropboxusercontent.com/scl/fi/hdu8amnbdo861l78vev8i/terrance-txstate-image.jpg?rlkey=19sr0dicibg4e0i6jdzzjcgyc&st=yvpo6sq8&dl=0',
    quote: '"I wish this was used for all networking events - it helps new people get plugged in right away."',
    name: 'Terrance M.',
    org: 'Texas State University',
  },
  {
    img: 'https://dl.dropboxusercontent.com/scl/fi/o8ve4n1thxhdkhw4h50rx/jodie-profile-image.jpg?rlkey=9rh3lvruiwvewchwfxa6p9b2j&st=7hlte795&dl=0',
    quote: '"It\'s contagious - in the best way possible. It\'s the highlight for most of my socials."',
    name: 'Jodie R.',
    org: 'ATX GirlHangouts',
  },
  {
    img: 'https://dl.dropboxusercontent.com/scl/fi/tf0h5aszqedhj3q4un5ln/kristinagarza-utrgv-image.jpg?rlkey=mmtzg0sttjxy3xv6l0c4tqi38&st=slzh36p2&dl=0',
    quote: '"It\'s one of the best networking tools I\'ve ever used."',
    name: 'Kristina G.',
    org: 'Leadership McAllen',
  },
];

function ClientTestimonialsSection({ subtitle }) {
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
      className={`lp-testimonials-section${animateIn ? ' lp-t-animate-in' : ''}`}
    >
      <div className={`lp-testimonials-header${animateIn ? ' lp-t-header-in' : ''}`}>
        <h2 className="lp-t-title">What our clients are saying.</h2>
        <p className="lp-t-subtitle">{subtitle}</p>
      </div>
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
              className={`lp-t-card${animateIn ? ` lp-t-card--${(i % TESTIMONIALS.length) + 1}` : ''}`}
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

export default ClientTestimonialsSection;
