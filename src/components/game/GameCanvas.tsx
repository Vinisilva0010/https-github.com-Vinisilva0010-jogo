import { Canvas } from '@react-three/fiber';
import { Suspense, Component, ReactNode } from 'react';
import { InfiniteCorridor } from './InfiniteCorridor';
import { Enemy } from './Enemy';
import { PlayerController } from './PlayerController';
import { useGameStore } from '../../store/useGameStore';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("GameCanvas Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Or a fallback UI
    }
    return this.props.children;
  }
}

export function GameCanvas() {
  const { enemies, gameStarted, gameOver } = useGameStore();

  return (
    <div className="w-full h-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        shadows
        gl={{ antialias: true }}
      >
        <ErrorBoundary>
          <Suspense fallback={null}>
            <InfiniteCorridor />
            
            {/* Render all active enemies */}
            {enemies.map((enemy) => (
              <Enemy key={enemy.id} data={enemy} />
            ))}

            <PlayerController />
          </Suspense>
        </ErrorBoundary>
      </Canvas>
    </div>
  );
}
