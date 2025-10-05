import React, { useState, useRef, useEffect } from 'react';
import { NARRATOR_PERSONAS, type NarratorPersona } from '../../../../shared/data/narratorPersonas';

interface PersonaCarouselProps {
  selectedPersonaId: string;
  onPersonaSelect: (personaId: string) => void;
}

export const PersonaCarousel: React.FC<PersonaCarouselProps> = ({
  selectedPersonaId,
  onPersonaSelect,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find the index of the selected persona
  useEffect(() => {
    const selectedIndex = NARRATOR_PERSONAS.findIndex(
      (persona) => persona.id === selectedPersonaId,
    );
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
      scrollToIndex(selectedIndex);
    }
  }, [selectedPersonaId]);

  const scrollToIndex = (index: number) => {
    if (cardRefs.current[index] && scrollContainerRef.current) {
      const card = cardRefs.current[index];
      const container = scrollContainerRef.current;
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = card.offsetLeft - containerRect.width / 2 + cardRect.width / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  };

  const handlePersonaSelect = (persona: NarratorPersona, index: number) => {
    onPersonaSelect(persona.id);
    setCurrentIndex(index);
    scrollToIndex(index);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Choose Your Style
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select how your narrator will speak and behave
        </p>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-4 pt-2 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {NARRATOR_PERSONAS.map((persona, index) => (
          <div
            key={persona.id}
            ref={(el) => (cardRefs.current[index] = el)}
            className={`
              flex-shrink-0 w-64 snap-center cursor-pointer transition-all duration-300
              ${selectedPersonaId === persona.id ? 'scale-105' : 'scale-100 hover:scale-102'}
            `}
            onClick={() => handlePersonaSelect(persona, index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePersonaSelect(persona, index);
              }
            }}
          >
            <div
              className={`
                bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-300 relative
                ${
                  selectedPersonaId === persona.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-[0_0_20px_rgba(59,130,246,0.5)] dark:shadow-[0_0_25px_rgba(96,165,250,0.6)]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-md'
                }
              `}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePersonaSelect(persona, index);
                }
              }}
            >
              {/* Persona Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{persona.name}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    persona.category === 'quirky'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {persona.label}
                </span>
              </div>

              {/* Persona Description */}
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{persona.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {NARRATOR_PERSONAS.map((_, index) => (
          <button
            key={index}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === currentIndex ? 'bg-blue-500 w-8' : 'bg-gray-300 dark:bg-gray-600'}
            `}
            onClick={() => {
              setCurrentIndex(index);
              scrollToIndex(index);
            }}
          />
        ))}
      </div>
    </div>
  );
};
