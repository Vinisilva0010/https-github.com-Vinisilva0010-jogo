import { create } from 'zustand';

export type EnemyType = 'SAD' | 'ANGRY';

export interface EnemyData {
  id: string;
  type: EnemyType;
  z: number;
  x: number;
  y: number;
  spawnTime: number;
  isDying?: boolean;
  dieTime?: number;
}

interface GameState {
  score: number;
  lives: number;
  speed: number;
  enemies: EnemyData[];
  gameOver: boolean;
  gameStarted: boolean;
  generatedAssets: { [key: string]: string[] }; // Map of asset path to generated URL
  
  startGame: () => void;
  resetGame: () => void;
  spawnEnemy: () => void;
  removeEnemy: (id: string) => void;
  updateEnemies: (delta: number) => void;
  handleInput: (key: 'j' | 'k') => void;
  loseLife: () => void;
  setGeneratedAsset: (path: string, url: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  lives: 3,
  speed: 20,
  enemies: [],
  gameOver: false,
  gameStarted: false,
  generatedAssets: {},

  startGame: () => set({ gameStarted: true, gameOver: false, score: 0, lives: 3, speed: 20, enemies: [] }),
  
  resetGame: () => set({ score: 0, lives: 3, speed: 20, enemies: [], gameOver: false, gameStarted: false }),

  setGeneratedAsset: (path, url) => set((state) => ({
    generatedAssets: { ...state.generatedAssets, [path]: [...(state.generatedAssets[path] || []), url] }
  })),

  spawnEnemy: () => {
    const { enemies, speed } = get();
    if (enemies.length > 35) return; // Simple pooling limit

    const newEnemy: EnemyData = {
      id: Math.random().toString(36).substr(2, 9),
      type: Math.random() > 0.5 ? 'SAD' : 'ANGRY',
      z: -100, // Spawn far away
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 5,
      spawnTime: Date.now(),
    };

    set({ enemies: [...enemies, newEnemy] });
  },

  removeEnemy: (id) => set((state) => ({
    enemies: state.enemies.filter((e) => e.id !== id)
  })),

  updateEnemies: (delta) => {
    const { enemies, speed, gameOver, gameStarted, loseLife, removeEnemy } = get();
    if (!gameStarted || gameOver) return;

    const now = Date.now();
    const updatedEnemies = enemies.map((e) => ({
      ...e,
      z: e.isDying ? e.z : e.z + speed * delta, // Stop moving if dying
    }));

    // Check for enemies that passed the player
    updatedEnemies.forEach((e) => {
      if (!e.isDying && e.z > 5) {
        loseLife();
        removeEnemy(e.id);
      }
    });

    // Filter out enemies that have finished dying (500ms) or passed the player
    set({ 
      enemies: updatedEnemies.filter((e) => {
        if (e.isDying) {
          return now - (e.dieTime || 0) < 500;
        }
        return e.z <= 5;
      }) 
    });
  },

  handleInput: (key) => {
    const { enemies, score, speed, gameOver, gameStarted } = get();
    if (!gameStarted || gameOver) return;

    // Find the closest enemy within a certain range, excluding dying ones
    const targetRange = [-10, 2]; // Range where player can hit
    const targetEnemies = enemies
      .filter((e) => !e.isDying && e.z > targetRange[0] && e.z < targetRange[1])
      .sort((a, b) => b.z - a.z); // Closest first

    if (targetEnemies.length > 0) {
      const closest = targetEnemies[0];
      const correctKey = closest.type === 'SAD' ? 'j' : 'k';

      if (key === correctKey) {
        set((state) => ({ 
          score: state.score + 10,
          speed: state.speed + 0.2, // Increase speed as score rises
          enemies: state.enemies.map(e => 
            e.id === closest.id 
              ? { ...e, isDying: true, dieTime: Date.now() } 
              : e
          )
        }));
      } else {
        // Wrong key penalty? Maybe just miss
      }
    }
  },

  loseLife: () => {
    const { lives } = get();
    if (lives <= 1) {
      set({ lives: 0, gameOver: true });
    } else {
      set({ lives: lives - 1 });
    }
  },
}));
