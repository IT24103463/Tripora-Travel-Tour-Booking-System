import { useNavigate } from 'react-router-dom';
import './AboutUs.css';

const pillars = [
  {
    index: '01',
    title: 'Architectural & Living Heritage',
    text: 'We seek out places shaped by Geoffrey Bawa’s tropical modernism, restored tea bungalows, and thoughtful retreats that sit lightly within the landscape. Each stay offers a sense of place that continues well beyond the journey.',
    icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  },
  {
    index: '02',
    title: 'Unhurried Private Expeditions',
    text: 'Our journeys make room for curiosity. Private naturalists, reserved observation carriages, and considered timings let guests experience Sri Lanka at a gentler pace, with the freedom to follow a moment rather than a timetable.',
    icon: <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  },
  {
    index: '03',
    title: 'Highland & Marine Stewardship',
    text: 'Travel should leave a place stronger. We favour local guides and responsible partners whose work supports cloud forest restoration, coastal care, and the communities who welcome travellers to the island.',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  },
];

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="about-viewport">
      <main className="about-glass-stage">
        <section className="about-hero-section page-hero-header">
          <div className="about-eyebrow tripora-slogan-capsule">
            <span className="slogan-sparkle" aria-hidden="true">✦</span>
            <span className="slogan-text">The Tripora Philosophy / Serendib Unveiled</span>
          </div>
          <h1 className="about-main-title">
            The Soul of Ceylon,
            <br />
            <span className="text-teal-gradient">Reimagined for the Connoisseur.</span>
          </h1>
          <p className="about-manifesto">
            Tripora was founded on a simple conviction: Sri Lanka’s most remarkable places deserve to be experienced with quiet care. From mist-veiled highlands to ancient stone cities, we bring together private journeys, meaningful stays, and a deeper connection to the island.
          </p>
        </section>

        <section className="about-pillars-grid" aria-label="Tripora principles">
          {pillars.map((pillar) => (
            <article className="about-pillar-card" key={pillar.index}>
              <div className="pillar-card-top">
                <span className="pillar-index">{pillar.index}</span>
                <span className="pillar-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {pillar.icon}
                  </svg>
                </span>
              </div>
              <h2>{pillar.title}</h2>
              <p>{pillar.text}</p>
            </article>
          ))}
        </section>

        <section className="about-metrics-strip" aria-label="Tripora at a glance">
          <div className="metric-box"><span className="metric-number">09</span><span className="metric-label">Provinces to discover</span></div>
          <span className="metric-divider" aria-hidden="true" />
          <div className="metric-box"><span className="metric-number">01:01</span><span className="metric-label">Personal island concierge</span></div>
          <span className="metric-divider" aria-hidden="true" />
          <div className="metric-box"><span className="metric-number">LKR</span><span className="metric-label">Clear local pricing</span></div>
        </section>

        <section className="about-story-split">
          <div className="story-kicker-block">
            <span className="story-tag">OUR CURATION PRINCIPLE</span>
            <span className="story-ornament" aria-hidden="true">T</span>
          </div>
          <div className="story-content">
            <h2>Where every route carries a story.</h2>
            <p>
              Watch first light settle over the Sigiriya plains. Take the slow train through tea country. Wander Galle’s ramparts as the day softens into evening. We shape each itinerary around the character of its place, leaving time for its people, its natural rhythms, and the details that make a journey personal.
            </p>
            <p>
              Our approach is informed by the island’s extraordinary biodiversity and by an architectural tradition that blurs the boundary between indoors and out. The result is travel that feels considered, intimate, and unmistakably Sri Lankan.
            </p>
          </div>
        </section>

        <section className="about-closing-panel">
          <div>
            <span className="story-tag">A MORE PERSONAL WAY TO WANDER</span>
            <h2>Let the island unfold at your pace.</h2>
          </div>
          <button type="button" className="about-explore-button" onClick={() => navigate('/packages')}>
            Explore private journeys <span aria-hidden="true">↗</span>
          </button>
        </section>
      </main>
    </div>
  );
}
