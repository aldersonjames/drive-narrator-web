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
    const selectedIndex = NARRATOR_PERSONAS.findIndex(persona => persona.id === selectedPersonaId);
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
      const scrollLeft = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
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
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {NARRATOR_PERSONAS.map((persona, index) => (
          <div
            key={persona.id}
            ref={el => cardRefs.current[index] = el}
            className={`
              flex-shrink-0 w-64 snap-center cursor-pointer transition-all duration-300
              ${selectedPersonaId === persona.id 
                ? 'scale-105 shadow-lg ring-2 ring-blue-500' 
                : 'scale-100 hover:scale-102'
              }
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
                bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border-2 transition-all duration-300 relative
                ${selectedPersonaId === persona.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {persona.name}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  persona.category === 'quirky' 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {persona.label}
                </span>
              </div>

              {/* Persona Description */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {persona.description}
                </p>
                
                {/* Preview Sentence */}
                <div className="text-xs italic text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  &ldquo;{persona.previewSentence}&rdquo;
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedPersonaId === persona.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
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
              ${index === currentIndex 
                ? 'bg-blue-500 w-8' 
                : 'bg-gray-300 dark:bg-gray-600'
              }
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
