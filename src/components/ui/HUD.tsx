import { useGameStore } from '../../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, RotateCcw, Skull } from 'lucide-react';

export function HUD() {
  const { score, lives, gameOver, gameStarted, startGame, resetGame } = useGameStore();

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-mono text-white">
      {/* Top Bar: Score and Lives */}
      <div className="flex justify-between items-start">
        <div className="bg-black border-4 border-white p-4 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
          <div className="text-xs uppercase tracking-widest opacity-70">Client Satisfaction</div>
          <div className="text-4xl font-black">{score.toString().padStart(6, '0')}</div>
        </div>

        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: i < lives ? 1 : 0.8,
                opacity: i < lives ? 1 : 0.3,
                rotate: i < lives ? 0 : 45,
              }}
              className="bg-black border-2 border-white p-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            >
              <Heart className={i < lives ? "fill-red-500 text-red-500" : "text-gray-500"} size={24} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Instructions Overlay */}
      {!gameStarted && !gameOver && (
        <div className="flex-1 flex items-center justify-center pointer-events-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black border-8 border-white p-12 text-center shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] max-w-2xl"
          >
            <h1 className="text-6xl font-black mb-6 uppercase italic skew-x-[-10deg]">Corporate Chaos</h1>
            <p className="text-xl mb-8 leading-relaxed">
              The clients are coming. They are sad. They are angry. <br />
              <span className="text-blue-400 font-bold">BLUE (SAD)</span>: Press <span className="bg-white text-black px-2">J</span> to SMILE. <br />
              <span className="text-red-500 font-bold">RED (ANGRY)</span>: Press <span className="bg-white text-black px-2">K</span> to FIRE. <br />
              Don't let them reach the HR department.
            </p>
            <button
              onClick={startGame}
              className="bg-white text-black px-8 py-4 text-2xl font-black uppercase flex items-center gap-3 mx-auto hover:bg-emerald-400 transition-colors"
            >
              <Play fill="black" /> Clock In
            </button>
          </motion.div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="flex-1 flex items-center justify-center pointer-events-auto">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-red-600 border-8 border-black p-12 text-center shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
          >
            <Skull className="mx-auto mb-6" size={80} />
            <h2 className="text-6xl font-black mb-4 uppercase">You're Fired!</h2>
            <p className="text-2xl mb-8 font-bold italic">Final Satisfaction Score: {score}</p>
            <button
              onClick={startGame}
              className="bg-black text-white px-8 py-4 text-2xl font-black uppercase flex items-center gap-3 mx-auto hover:bg-white hover:text-black transition-colors"
            >
              <RotateCcw /> Re-Apply
            </button>
          </motion.div>
        </div>
      )}

      {/* Bottom Bar: Controls Hint */}
      <div className="flex justify-center">
        <div className="bg-black border-2 border-white px-6 py-2 text-xs uppercase tracking-widest opacity-50">
          [J] Smile / [K] Fire
        </div>
      </div>
    </div>
  );
}
