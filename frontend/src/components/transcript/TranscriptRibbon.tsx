import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TranscriptRibbonProps {
  text: string;
  visible: boolean;
  onDismiss?: () => void;
}

export const TranscriptRibbon: React.FC<TranscriptRibbonProps> = ({ text, visible, onDismiss }) => {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="transcript-ribbon"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">🗣️</span>
          <span>{text}</span>
          {onDismiss ? (
            <button
              type="button"
              className="chip-dismiss"
              onClick={onDismiss}
              aria-label="Dismiss transcript"
            >
              ×
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default TranscriptRibbon;
