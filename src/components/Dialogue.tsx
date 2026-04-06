import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DialogueProps {
  speaker: string;
  text: string;
  onNext: () => void;
  isVisible: boolean;
  assets: Record<string, string>;
}

export const Dialogue: React.FC<DialogueProps> = ({ speaker, text, onNext, isVisible, assets }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
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
            <div className="text-emerald-500 font-mono text-xs uppercase tracking-widest mb-2 opacity-70">
              {speaker}
            </div>
            <div className="text-emerald-100 font-mono text-lg leading-relaxed">
              {text}
            </div>
            <button 
              onClick={onNext}
              className="mt-4 text-emerald-500 font-mono text-xs uppercase tracking-widest hover:text-emerald-400 flex items-center gap-2"
            >
              <span>Continue</span>
              <span className="animate-pulse">_</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
