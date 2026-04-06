import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameState, MechInstance } from '../game/types';

interface HUDProps {
  gameState: GameState;
  selectedMech?: MechInstance;
  onEndTurn: () => void;
  isMyTurn: boolean;
  assets: Record<string, string>;
}

export const HUD: React.FC<HUDProps> = ({ gameState, selectedMech, onEndTurn, isMyTurn, assets }) => {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* CRT Overlay for HUD elements */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] z-50 mix-blend-overlay" />
      
      {/* Top Bar: Game Info */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex gap-4">
          <div className="bg-black/80 border border-emerald-500/30 p-4 rounded-sm backdrop-blur-md">
            <h1 className="text-emerald-500 font-mono text-xl tracking-tighter uppercase">Iron Vanguard</h1>
            <div className="text-emerald-500/70 font-mono text-xs mt-1 flex items-center gap-2">
              <span>TURN: {gameState.turn}</span>
              <span className="opacity-50">|</span>
              <span className={`flex items-center gap-2 ${isMyTurn ? 'text-emerald-400 font-bold' : 'text-red-400'}`}>
                {isMyTurn ? (
                  <><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> YOUR TURN</>
                ) : (
                  <><div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" /> ENEMY TURN</>
                )}
              </span>
            </div>
          </div>
          
          <div className="bg-black/80 border border-emerald-500/30 p-4 rounded-sm backdrop-blur-md hidden md:block">
            <div className="text-emerald-500 font-mono text-xs uppercase mb-1 font-bold">Controls</div>
            <ul className="text-emerald-500/70 font-mono text-[10px] space-y-1">
              <li><span className="text-emerald-400">CLICK</span> friendly mech to select</li>
              <li><span className="text-emerald-400">CLICK</span> highlighted hex to move</li>
              <li><span className="text-red-400">CLICK</span> enemy in range to attack</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-4">
          {isConfirmingReset ? (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('reset-game'));
                  setIsConfirmingReset(false);
                }}
                className="font-mono font-bold px-4 py-2 rounded-sm transition-colors uppercase tracking-widest bg-red-600 hover:bg-red-500 text-black border border-red-500/30 text-xs"
              >
                Confirm Reset
              </button>
              <button 
                onClick={() => setIsConfirmingReset(false)}
                className="font-mono font-bold px-4 py-2 rounded-sm transition-colors uppercase tracking-widest bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-500/30 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsConfirmingReset(true)}
              className="font-mono font-bold px-4 py-2 rounded-sm transition-colors uppercase tracking-widest bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-500/30 text-xs"
            >
              Reset Sim
            </button>
          )}
          <button 
            onClick={onEndTurn}
            disabled={!isMyTurn}
            className={`font-mono font-bold px-6 py-2 rounded-sm transition-colors uppercase tracking-widest ${
              isMyTurn 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-black' 
                : 'bg-emerald-900/50 text-emerald-500/50 cursor-not-allowed'
            }`}
          >
            End Turn
          </button>
        </div>
      </div>

      {/* Bottom Bar: Selected Mech Info */}
      <div className="flex justify-center pointer-events-auto">
        {selectedMech ? (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black/90 border-t-2 border-emerald-500 p-6 w-full max-w-4xl flex gap-8 backdrop-blur-xl"
          >
            <div className="w-32 h-32 bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden">
              {assets[`mech_${selectedMech.type}`] ? (
                <img 
                  src={`data:image/png;base64,${assets[`mech_${selectedMech.type}`]}`} 
                  alt={selectedMech.type}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-emerald-500 font-mono text-xs uppercase">{selectedMech.type}</div>
              )}
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-emerald-500/70 uppercase">
                  <span>Armor</span>
                  <span>{selectedMech.stats.armor}/{selectedMech.stats.maxArmor}</span>
                </div>
                <div className="h-2 bg-emerald-900/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(selectedMech.stats.armor / selectedMech.stats.maxArmor) * 100}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                
                <div className="flex justify-between text-xs font-mono text-emerald-500/70 uppercase">
                  <span>Structure</span>
                  <span>{selectedMech.stats.hp}/{selectedMech.stats.maxHp}</span>
                </div>
                <div className="h-2 bg-emerald-900/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(selectedMech.stats.hp / selectedMech.stats.maxHp) * 100}%` }}
                    className="h-full bg-emerald-400"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-emerald-500 uppercase">
                <div className="bg-emerald-900/20 p-2 border border-emerald-500/20">
                  <div className="opacity-50">Move</div>
                  <div className="text-lg">{selectedMech.stats.movement}</div>
                </div>
                <div className="bg-emerald-900/20 p-2 border border-emerald-500/20">
                  <div className="opacity-50">Range</div>
                  <div className="text-lg">{selectedMech.stats.range}</div>
                </div>
                <div className="bg-emerald-900/20 p-2 border border-emerald-500/20">
                  <div className="opacity-50">Damage</div>
                  <div className="text-lg">{selectedMech.stats.damage}</div>
                </div>
                <div className="bg-emerald-900/20 p-2 border border-emerald-500/20">
                  <div className="opacity-50">Heat</div>
                  <div className="text-lg">{selectedMech.stats.heat}%</div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-emerald-500/30 font-mono text-sm uppercase tracking-widest mb-4">
            Select a unit to command
          </div>
        )}
      </div>
    </div>
  );
};
