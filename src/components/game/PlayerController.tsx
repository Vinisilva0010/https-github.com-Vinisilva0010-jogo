import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export function PlayerController() {
  const { handleInput, score, speed, gameStarted, gameOver, spawnEnemy, updateEnemies } = useGameStore();
  const { camera } = useThree();
  const lastSpawnTime = useRef(0);
  const sceneGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'j' || key === 'k') {
        handleInput(key as 'j' | 'k');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleInput]);

  useFrame((state, delta) => {
    if (!gameStarted || gameOver) return;

    // Update game state
    updateEnemies(delta);

    // Dynamic Spawning based on score/speed
    const spawnInterval = Math.max(500, 2000 - score * 5); // Faster spawning as score rises
    if (state.clock.elapsedTime * 1000 - lastSpawnTime.current > spawnInterval) {
      spawnEnemy();
      lastSpawnTime.current = state.clock.elapsedTime * 1000;
    }

    // Dizzying Feedback: Scene Shake and Rotation
    const intensity = Math.min(0.5, score * 0.005);
    const shakeX = Math.sin(state.clock.elapsedTime * 10) * intensity * 0.1;
    const shakeY = Math.cos(state.clock.elapsedTime * 8) * intensity * 0.1;
    const rotationZ = Math.sin(state.clock.elapsedTime * 0.5) * intensity * 0.5;

    camera.position.x = shakeX;
    camera.position.y = shakeY;
    camera.rotation.z = rotationZ;

    // Subtle FOV pulse
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 75 + Math.sin(state.clock.elapsedTime * 2) * intensity * 5;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
