import React, { useState, useRef, useEffect } from 'react';
import { OPENAI_VOICES, type OpenAIVoiceDefinition } from '../../data/voicePresets';

interface VoiceCarouselProps {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string) => void;
}

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const VoiceCarousel: React.FC<VoiceCarouselProps> = ({ selectedVoiceId, onVoiceSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find the index of the selected voice
  useEffect(() => {
    const selectedIndex = OPENAI_VOICES.findIndex((voice) => voice.id === selectedVoiceId);
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
      const scrollLeft = card.offsetLeft - containerRect.width / 2 + cardRect.width / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
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
      case 'male':
        return '👨';
      case 'female':
        return '👩';
      default:
        return '👤';
    }
  };

  const getAgeColor = (age: string) => {
    switch (age) {
      case 'young':
        return 'text-green-600';
      case 'middle':
        return 'text-blue-600';
      case 'mature':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
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
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-4 pt-2 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {OPENAI_VOICES.map((voice, index) => (
          <div
            key={voice.id}
            ref={(el) => (cardRefs.current[index] = el)}
            className={`
              flex-shrink-0 w-56 min-h-[220px] snap-center cursor-pointer transition-all duration-300
              ${selectedVoiceId === voice.id ? 'scale-105' : 'scale-100 hover:scale-102'}
            `}
            onClick={() => handleVoiceSelect(voice, index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleVoiceSelect(voice, index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select ${voice.name} voice, ${voice.gender}, ${voice.age}, ${voice.style}`}
          >
            <div
              className={`
              bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-300 relative
              ${
                selectedVoiceId === voice.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-[0_0_20px_rgba(59,130,246,0.5)] dark:shadow-[0_0_25px_rgba(96,165,250,0.6)]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-md'
              }
            `}
            >
              {/* Voice Name */}
              <div className="text-center mb-3">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{voice.name}</h4>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-base">{getGenderIcon(voice.gender)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {capitalizeFirst(voice.gender)}
                    </span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className={`text-xs font-medium ${getAgeColor(voice.age)}`}>
                    {capitalizeFirst(voice.age)}
                  </span>
                </div>
              </div>

              {/* Voice Description */}
              <div className="text-center mb-3">
                <p
                  className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed px-1"
                  title={voice.description}
                >
                  {voice.description}
                </p>
              </div>

              {/* Voice Style */}
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {capitalizeFirst(voice.style)}
                </div>
              </div>
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
