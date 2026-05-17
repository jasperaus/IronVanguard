import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DialogueProps {
  speaker: string;
  text: string;
  onNext: () => void;
  isVisible: boolean;
  assets: Record<string, string>;
}

export const Dialogue: React.FC<DialogueProps> = ({ speaker, text, onNext, isVisible, assets }) => {
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onNext]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          role="dialog"
          aria-labelledby="dialogue-speaker"
          aria-describedby="dialogue-text"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-black/90 border border-emerald-500/50 p-6 backdrop-blur-xl pointer-events-auto flex gap-6"
        >
          <div className="w-24 h-24 bg-emerald-900/20 border border-emerald-500/30 flex-shrink-0 overflow-hidden">
            {assets['pilot_1'] ? (
              <img 
                src={`data:image/png;base64,${assets['pilot_1']}`} 
                alt="Pilot"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-500/30">
                <span className="text-2xl">?</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div id="dialogue-speaker" className="text-emerald-500 font-mono text-xs uppercase tracking-widest mb-2 opacity-70">
              {speaker}
            </div>
            <div id="dialogue-text" className="text-emerald-100 font-mono text-lg leading-relaxed">
              {text}
            </div>
            <button 
              onClick={onNext}
              aria-label="Continue Dialogue (Space or Enter)"
              title="Continue Dialogue (Space or Enter)"
              className="mt-4 text-emerald-500 font-mono text-xs uppercase tracking-widest hover:text-emerald-400 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm px-2 py-1 -ml-2"
            >
              <span>Continue <span className="opacity-50 text-[10px] ml-1">(SPACE)</span></span>
              <span className="animate-pulse">_</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
