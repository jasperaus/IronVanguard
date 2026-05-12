import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../../game/types';
import { User } from 'firebase/auth';

interface GameOverOverlayProps {
  gameState: GameState;
  user: User;
}

export function GameOverOverlay({ gameState, user }: GameOverOverlayProps) {
  return (
    <AnimatePresence>
      {gameState.status === 'finished' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] backdrop-blur-2xl"
        >
          <h2 className="text-6xl font-bold text-emerald-500 tracking-tighter uppercase mb-4">
            {gameState.winnerId === user.uid ? 'Victory' : 'Defeat'}
          </h2>
          <p className="text-emerald-500/50 font-mono uppercase tracking-widest mb-12">
            Mission Parameters {gameState.winnerId === user.uid ? 'Achieved' : 'Failed'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-12 py-4 rounded-sm transition-all uppercase tracking-widest"
          >
            Return to Command
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
