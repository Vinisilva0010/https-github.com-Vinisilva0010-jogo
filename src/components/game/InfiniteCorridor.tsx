import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { GROTESQUE_ASSETS } from '../../constants/assets';

function BackgroundMesh({ path, parallaxFactor = 0.05, ...props }: any) {
  const [loadError, setLoadError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const generatedAssets = useGameStore((state) => state.generatedAssets);

  // Check if we have a generated asset for this path
  const finalPath = useMemo(() => {
    const generated = generatedAssets[path];
    if (generated && generated.length > 0) {
      return generated[0];
    }
    
    if (loadError) {
      const seed = path.split('/').pop()?.split('.')[0] || 'office';
      return `https://picsum.photos/seed/${seed}/512/512?grayscale`;
    }

    if (!isVerified) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    }

    return path;
  }, [path, generatedAssets, loadError, isVerified]);

  useEffect(() => {
    if (path.startsWith('http') || path.startsWith('data:')) {
      setIsVerified(true);
      return;
    }
    const img = new Image();
    img.src = path;
    img.onload = () => setIsVerified(true);
    img.onerror = () => setLoadError(true);
  }, [path]);

  const texture = useTexture(finalPath) as THREE.Texture;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 10);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        // Parallax scrolling based on camera Z
        // We use the camera's Z position to drive the offset
        material.map.offset.y = -state.camera.position.z * parallaxFactor;
      }
    }
  });

  return (
    <mesh ref={meshRef} {...props}>
      <planeGeometry args={[20, 200]} />
      <meshStandardMaterial map={texture} roughness={0.8} />
    </mesh>
  );
}

export function InfiniteCorridor() {
  const groupRef = useRef<THREE.Group>(null);
  const floorRef = useRef<THREE.Mesh>(null);
  const ceilingRef = useRef<THREE.Mesh>(null);
  const wallsRef = useRef<THREE.Mesh>(null);
  const { speed, gameStarted, gameOver } = useGameStore();

  // Brutalist textures for walls
  const wallTexture = useTexture('https://picsum.photos/seed/office_brutalist/512/512') as THREE.Texture;
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(1, 10);

  useFrame((state, delta) => {
    if (!gameStarted || gameOver) return;

    const scrollSpeed = speed * delta;
    
    // Move the camera forward (decreasing Z)
    state.camera.position.z -= scrollSpeed;
    
    // Move the corridor group with the camera to keep it in view
    if (groupRef.current) {
      groupRef.current.position.z = state.camera.position.z;
    }

    if (wallsRef.current) {
      wallsRef.current.rotation.z += delta * 0.1;
      const material = wallsRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        // Apply parallax to walls as well for consistency
        material.map.offset.y = -state.camera.position.z * 0.02;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floor */}
      <BackgroundMesh 
        ref={floorRef} 
        path={GROTESQUE_ASSETS.BACKGROUND.FLOOR}
        parallaxFactor={0.05}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -5, -50]} 
      />

      {/* Ceiling */}
      <BackgroundMesh 
        ref={ceilingRef} 
        path={GROTESQUE_ASSETS.BACKGROUND.CEILING}
        parallaxFactor={0.05}
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, 5, -50]} 
      />

      {/* Surreal Walls - TorusKnot for dizzying corridor */}
      <mesh ref={wallsRef} position={[0, 0, -50]}>
        <torusKnotGeometry args={[10, 3, 100, 16]} />
        <meshStandardMaterial 
          map={wallTexture} 
          color="#111" 
          wireframe 
          emissive="#3b82f6" 
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Ambient and directional lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#fff" />
      <fog attach="fog" args={['#000', 1, 100]} />
    </group>
  );
}
