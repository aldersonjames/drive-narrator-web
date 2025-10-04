import React from 'react';

export interface LandingPageProps {
  onStartJourney: () => void;
  onSkipTutorial: () => void;
}

const tutorialSteps = [
  {
    title: 'Map your escape',
    description:
      'Choose a starting point and destination or simply pick a theme. Drive Narrator weaves multiple scenic routes instantly.',
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
      <section className="landing-hero">
        <div className="landing-hero-card">
          <span className="landing-subtitle">Voice-First Road Trip Companion</span>
          <h1 className="landing-title">
            Plan, narrate, and delight on <span className="gradient-text">every mile</span>
          </h1>
          <p className="landing-description">
            Let Drive Narrator scout multiple routes, surface curated points of interest, and
            converse with you like a co-pilot who knows your tastes. Built for scenic detours,
            family adventures, and legendary playlists.
          </p>
          <div className="landing-actions">
            <button type="button" onClick={onStartJourney} className="landing-button primary">
              Start Your Journey
            </button>
            <button type="button" onClick={onSkipTutorial} className="landing-button ghost">
              Jump Right In
            </button>
          </div>
        </div>
        <div className="landing-preview">
          <div className="landing-preview-card">
            <span className="landing-preview-title">Tutorial Preview</span>
            <p className="landing-preview-copy">
              Learn how Drive Narrator orchestrates routing, narration, and safety cues in under two
              minutes.
            </p>
            <div className="landing-preview-orb">Breath, ask, discover.</div>
          </div>
        </div>
      </section>

      <section className="landing-howitworks">
        <header>
          <h2>How it works</h2>
          <p>A quick three-step orientation before you hit the open road.</p>
        </header>

        <div className="landing-tutorial-grid">
          {tutorialSteps.map((step, index) => (
            <article key={step.title} className="landing-tutorial-card">
              <span className="step">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
