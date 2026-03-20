import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, useTexture, Text, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { EnemyData, useGameStore } from '../../store/useGameStore';
import { GROTESQUE_ASSETS } from '../../constants/assets';

const AuraShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('blue') },
    uOpacity: { value: 0.3 },
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // AGGRESSIVE JITTER: Vibrate based on vertex ID and time
      float noise = random(vec2(uTime, float(gl_VertexID)));
      pos += normal * noise * 0.2 * sin(uTime * 50.0);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float dist = distance(vUv, vec2(0.5));
      float alpha = smoothstep(0.5, 0.2, dist) * uOpacity;
      float pulse = sin(uTime * 15.0) * 0.2 + 0.8;
      gl_FragColor = vec4(uColor, alpha * pulse);
    }
  `,
};

const DyingShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('white') },
    uProgress: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Explode outward based on progress
      float r = random(vec2(float(gl_VertexID), 0.0));
      float angle = r * 6.28;
      vec3 dir = vec3(cos(angle), sin(angle), r - 0.5);
      pos += dir * uProgress * 5.0;
      
      // Add some noise/jitter
      pos += vec3(sin(uTime * 20.0 + r), cos(uTime * 25.0 + r), 0.0) * 0.1;

      gl_PointSize = (1.0 - uProgress) * 20.0 * r;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uProgress;
    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      gl_FragColor = vec4(uColor, (1.0 - uProgress) * 0.8);
    }
  `,
};

export function Enemy({ data }: { data: EnemyData }) {
  const meshRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.ShaderMaterial>(null);
  const dyingRef = useRef<THREE.ShaderMaterial>(null);
  const [loadError, setLoadError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [probeError, setProbeError] = useState(false);
  const generatedAssets = useGameStore((state) => state.generatedAssets);
  
  // Deterministic asset selection based on ID
  const assetPath = useMemo(() => {
    const assets = data.type === 'SAD' ? GROTESQUE_ASSETS.SAD : GROTESQUE_ASSETS.ANGRY;
    const index = data.id.length % assets.length;
    return assets[index];
  }, [data.id, data.type]);

  // Probe the asset existence
  useEffect(() => {
    if (assetPath.startsWith('http') || assetPath.startsWith('data:')) {
      setIsVerified(true);
      return;
    }
    const img = new Image();
    img.src = assetPath;
    img.onload = () => setIsVerified(true);
    img.onerror = () => setProbeError(true);
  }, [assetPath]);

  // Check if we have a generated asset for this path
  const finalPath = useMemo(() => {
    const generated = generatedAssets[assetPath];
    if (generated && generated.length > 0) {
      return generated[0]; // Use the latest generated one
    }
    
    const seed = assetPath.split('/').pop()?.split('.')[0] || 'gross';
    
    // Fallback to picsum if the asset is missing or failed to load
    if (probeError || loadError) {
      return `https://picsum.photos/seed/${seed}/256/256?grayscale&blur=2`;
    }

    // Use a transparent pixel while probing to avoid useTexture throwing
    if (!isVerified) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    }

    return assetPath;
  }, [assetPath, generatedAssets, loadError, probeError, isVerified]);

  const texture = useTexture(finalPath);

  // CRITICAL: Crunchy Filtering (NearestFilter)
  useEffect(() => {
    if (texture) {
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
    }
  }, [texture]);

  // Handle load errors
  useEffect(() => {
    const img = new Image();
    img.src = assetPath;
    img.onerror = () => setLoadError(true);
  }, [assetPath]);

  const auraColor = useMemo(() => 
    data.type === 'SAD' ? new THREE.Color('#3b82f6') : new THREE.Color('#ef4444'), 
    [data.type]
  );

  // Memoize particle positions for the death effect
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(300); // 100 particles * 3 coordinates
    for (let i = 0; i < 300; i++) {
      positions[i] = (Math.random() - 0.5) * 2;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (auraRef.current) {
      auraRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (dyingRef.current && data.isDying && data.dieTime) {
      const progress = (Date.now() - data.dieTime) / 500;
      dyingRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      dyingRef.current.uniforms.uProgress.value = Math.min(1, progress);
    }
    if (meshRef.current) {
      // Position relative to camera since camera is now moving
      // Initial camera Z was 5
      meshRef.current.position.set(data.x, data.y, state.camera.position.z + (data.z - 5));
    }
  });

  return (
    <group ref={meshRef}>
      {!data.isDying && (
        <Trail
          width={2.5}
          color={auraColor}
          length={20}
          decay={1}
          local={false}
          stride={0.1}
          interval={1}
          attenuation={(w) => w}
        />
      )}
      <Billboard>
        {!data.isDying ? (
          <>
            {/* The Grotesque Client Billboard */}
            <mesh>
              <planeGeometry args={[3, 3]} />
              <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
            </mesh>
            
            {/* The Jittering Aura */}
            <mesh scale={[4, 4, 4]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <shaderMaterial
                ref={auraRef}
                attach="material"
                args={[AuraShader]}
                uniforms-uColor-value={auraColor}
                transparent
                depthWrite={false}
              />
            </mesh>

            {/* Point Light for the aura effect */}
            <pointLight color={auraColor} intensity={3} distance={12} />
            
            {/* Floating text for instruction hint */}
            <Text
              position={[0, 2.2, 0]}
              fontSize={0.4}
              color="white"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            >
              {data.type === 'SAD' ? 'J (SMILE)' : 'K (FIRE)'}
            </Text>
          </>
        ) : (
          /* Death Particles */
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={100}
                array={particlePositions}
                itemSize={3}
              />
            </bufferGeometry>
            <shaderMaterial
              ref={dyingRef}
              attach="material"
              args={[DyingShader]}
              uniforms-uColor-value={auraColor}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        )}
      </Billboard>
    </group>
  );
}
