import React, { useState, useRef, useEffect } from 'react';
import { ACCENT_OPTIONS, type AccentDefinition } from '../../data/voicePresets';

interface AccentCarouselProps {
  selectedAccentId: string;
  onAccentSelect: (accentId: string) => void;
}

export const AccentCarousel: React.FC<AccentCarouselProps> = ({
  selectedAccentId,
  onAccentSelect,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find the index of the selected accent
  useEffect(() => {
    const selectedIndex = ACCENT_OPTIONS.findIndex(accent => accent.id === selectedAccentId);
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
      scrollToIndex(selectedIndex);
    }
  }, [selectedAccentId]);

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

  const handleAccentSelect = (accent: AccentDefinition, index: number) => {
    onAccentSelect(accent.id);
    setCurrentIndex(index);
    scrollToIndex(index);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Choose Your Accent
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the regional accent for your narrator
        </p>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {ACCENT_OPTIONS.map((accent, index) => (
          <div
            key={accent.id}
            ref={el => cardRefs.current[index] = el}
            className={`
              flex-shrink-0 w-40 snap-center cursor-pointer transition-all duration-300
              ${selectedAccentId === accent.id 
                ? 'scale-105 shadow-lg ring-2 ring-blue-500' 
                : 'scale-100 hover:scale-102'
              }
            `}
            onClick={() => handleAccentSelect(accent, index)}
          >
            <div className={`
              bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border-2 transition-all duration-300 relative
              ${selectedAccentId === accent.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}>
              {/* Accent Flag and Name */}
              <div className="text-center mb-3">
                <div className="text-3xl mb-2">
                  {accent.emoji}
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {accent.name}
                </h4>
              </div>

              {/* Accent Description */}
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {accent.description}
                </p>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {accent.region}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedAccentId === accent.id && (
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
        {ACCENT_OPTIONS.map((_, index) => (
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
