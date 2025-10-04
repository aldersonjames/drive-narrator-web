import React, { useState, useRef, useEffect } from 'react';
import { OPENAI_VOICES, type OpenAIVoiceDefinition } from '../../data/voicePresets';

interface VoiceCarouselProps {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string) => void;
}

export const VoiceCarousel: React.FC<VoiceCarouselProps> = ({
  selectedVoiceId,
  onVoiceSelect,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find the index of the selected voice
  useEffect(() => {
    const selectedIndex = OPENAI_VOICES.findIndex(voice => voice.id === selectedVoiceId);
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
      scrollToIndex(selectedIndex);
    }
  }, [selectedVoiceId]);

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

  const handleVoiceSelect = (voice: OpenAIVoiceDefinition, index: number) => {
    onVoiceSelect(voice.id);
    setCurrentIndex(index);
    scrollToIndex(index);
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  const getAgeColor = (age: string) => {
    switch (age) {
      case 'young': return 'text-green-600';
      case 'middle': return 'text-blue-600';
      case 'mature': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Choose Your Voice
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Swipe to browse voices, tap to select
        </p>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {OPENAI_VOICES.map((voice, index) => (
          <div
            key={voice.id}
            ref={el => cardRefs.current[index] = el}
            className={`
              flex-shrink-0 w-48 snap-center cursor-pointer transition-all duration-300
              ${selectedVoiceId === voice.id 
                ? 'scale-105 shadow-lg ring-2 ring-blue-500' 
                : 'scale-100 hover:scale-102'
              }
            `}
            onClick={() => handleVoiceSelect(voice, index)}
          >
            <div className={`
              bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border-2 transition-all duration-300 relative
              ${selectedVoiceId === voice.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}>
              {/* Voice Name */}
              <div className="text-center mb-3">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {voice.name}
                </h4>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-lg">{getGenderIcon(voice.gender)}</span>
                  <span className={`text-xs font-medium ${getAgeColor(voice.age)}`}>
                    {voice.age}
                  </span>
                </div>
              </div>

              {/* Voice Style */}
              <div className="text-center">
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {voice.style}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedVoiceId === voice.id && (
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
        {OPENAI_VOICES.map((_, index) => (
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
