import React from 'react';

export interface LandingPageProps {
  onStartJourney: () => void;
  onSkipTutorial: () => void;
}

const heroStyle: React.CSSProperties = {
  minHeight: '70vh',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem',
  alignItems: 'center',
  padding: '4rem clamp(1.5rem, 4vw, 6rem)',
  background: 'radial-gradient(circle at top left, #4F46E5, #0EA5E9)',
  color: '#FFFFFF',
  borderBottomLeftRadius: '32px',
  borderBottomRightRadius: '32px',
  boxShadow: '0 24px 72px rgba(15, 23, 42, 0.3)',
};

const heroCardStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.35)',
  borderRadius: '24px',
  padding: '2.5rem',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 20px 60px rgba(8, 47, 73, 0.25)',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  marginTop: '2.5rem',
};

const heroButton = (variant: 'primary' | 'ghost'): React.CSSProperties => ({
  borderRadius: '999px',
  padding: '0.85rem 2.4rem',
  fontSize: '1.05rem',
  fontWeight: 600,
  border: variant === 'primary' ? 'none' : '1px solid rgba(255,255,255,0.45)',
  color: '#FFFFFF',
  background:
    variant === 'primary'
      ? 'linear-gradient(135deg, rgba(244, 114, 182, 0.85), rgba(14, 165, 233, 0.95))'
      : 'transparent',
  cursor: 'pointer',
  boxShadow: variant === 'primary' ? '0 12px 28px rgba(244, 114, 182, 0.35)' : 'none',
});

const tutorialListStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1.5rem',
  marginTop: '3rem',
};

const tutorialCardStyle: React.CSSProperties = {
  borderRadius: '18px',
  padding: '1.75rem',
  background: '#FFFFFF',
  color: '#1F2937',
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const gradientText: React.CSSProperties = {
  background: 'linear-gradient(135deg, #F472B6, #38BDF8)',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
};

const tutorialSteps = [
  {
    title: 'Map your escape',
    description:
      'Choose a starting point and destination or simply pick a theme. Trip Narrator weaves multiple scenic routes instantly.',
  },
  {
    title: 'Curate your vibe',
    description:
      'Blend interests—from Civil War stories to indie coffee stops—and the assistant tailors narration to your passengers.',
  },
  {
    title: 'Stay hands-free & safe',
    description:
      'Conversational voice guidance keeps you in the moment with proactive alerts and immersive storytelling before every stop.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStartJourney, onSkipTutorial }) => {
  return (
    <div className="landing-page">
      <section style={heroStyle}>
        <div style={heroCardStyle}>
          <span
            style={{ fontSize: '0.95rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            Voice-First Road Trip Companion
          </span>
          <h1
            style={{
              fontSize: '2.75rem',
              lineHeight: 1.15,
              marginTop: '1rem',
              marginBottom: '1rem',
            }}
          >
            Plan, narrate, and delight on <span style={gradientText}>every mile</span>
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(226, 232, 240, 0.95)' }}>
            Let the Trip Narrator scout multiple routes, surface curated points of interest, and
            converse with you like a co-pilot who knows your tastes. Built for scenic detours,
            family adventures, and legendary playlists.
          </p>
          <div style={buttonGroupStyle}>
            <button type="button" onClick={onStartJourney} style={heroButton('primary')}>
              Start Your Journey
            </button>
            <button type="button" onClick={onSkipTutorial} style={heroButton('ghost')}>
              Jump Right In
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '2rem',
              borderRadius: '28px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(15, 23, 42, 0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <span
              style={{ fontSize: '0.85rem', letterSpacing: '0.32em', textTransform: 'uppercase' }}
            >
              Tutorial Preview
            </span>
            <p style={{ fontSize: '1.1rem', maxWidth: '20rem', lineHeight: 1.7 }}>
              Learn how Trip Narrator orchestrates routing, narration, and safety cues in under two
              minutes.
            </p>
            <div
              style={{
                height: '220px',
                width: '200px',
                borderRadius: '999px',
                background:
                  'radial-gradient(circle at 30% 30%, rgba(250, 250, 250, 0.35), transparent)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                color: 'rgba(241, 245, 249, 0.85)',
              }}
            >
              Breath, ask, discover.
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '3.5rem clamp(1.5rem, 6vw, 6rem)' }}>
        <header style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>How it works</h2>
          <p style={{ color: '#475569', fontSize: '1.05rem' }}>
            A quick three-step orientation before you hit the open road.
          </p>
        </header>

        <div style={tutorialListStyle}>
          {tutorialSteps.map((step, index) => (
            <article key={step.title} style={tutorialCardStyle}>
              <span style={{ fontWeight: 700, color: '#6366F1' }}>Step {index + 1}</span>
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{step.title}</h3>
              <p style={{ margin: 0, color: '#475569' }}>{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
