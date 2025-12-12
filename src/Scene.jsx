import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Html, useProgress, OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import React from 'react';

// --- LOADER ---
function Loader() {
  const { progress } = useProgress();
  return <Html center><div className="text-cyan-500 font-mono text-xs tracking-widest bg-black/80 px-4 py-2 border border-cyan-500/30 backdrop-blur-md">LOADING SIMULATION {Math.round(progress)}%</div></Html>;
}

// --- FALLBACK BOX ---
function FallbackCar() {
  return (
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[1, 0.5, 2]} />
      <meshStandardMaterial color="red" wireframe />
      <Html position={[0, 1, 0]} center><div className="bg-black text-red-500 p-2 text-xs border border-red-500">MISSING MODEL</div></Html>
    </mesh>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() { if (this.state.hasError) return <FallbackCar />; return this.props.children; }
}

// --- DYNAMIC LIGHTS ---
function LiveEnvironment() {
  const envRef = useRef();
  useFrame((state, delta) => {
    if (envRef.current) envRef.current.rotation.y += delta * 0.05; 
  });
  return <Environment ref={envRef} preset="city" background={false} />;
}

// --- CAR MODEL ---
function Model({ path }) {
  const { scene } = useGLTF(path);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
            child.material.envMapIntensity = 3; 
            child.material.metalness = 0.9;     
            child.material.roughness = 0.2;     
        }
      }
    });
  }, [scene]); 

  // MANUAL POSITIONING (Replaces Stage)
  // We scale it up slightly and ensure it sits on the floor (y=0)
  return <primitive object={scene} scale={1.0} position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]} />;
}

// --- MAIN SCENE ---
export default function Scene() {
  return (
    <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
      <Canvas dpr={[1, 2]} shadows gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}>
        
        {/* SETUP */}
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 20]} />
        {/* Adjusted Camera to look slightly down at the car */}
        <PerspectiveCamera makeDefault position={[3, 2, 5]} fov={40} />

        {/* LIGHTS */}
        <LiveEnvironment />
        <spotLight position={[-5, 8, -5]} angle={0.4} penumbra={1} intensity={10} color="#00ffcd" castShadow />
        <pointLight position={[5, 5, 5]} intensity={5} color="white" />
        <ambientLight intensity={0.5} />

        {/* CAR (Without Stage) */}
        <Suspense fallback={<Loader />}>
          <ErrorBoundary>
              <Model path="/mercedes.glb" />
          </ErrorBoundary>
        </Suspense>
        
        {/* GRID */}
        {/* Lifted slightly to prevent z-fighting with floor if you have one */}
        <Grid 
            position={[0, -0.01, 0]} 
            args={[30, 30]} 
            cellSize={0.5} sectionSize={2.5} 
            cellThickness={0.5} sectionThickness={1} 
            cellColor="#333" sectionColor="#00ffcd" 
            fadeDistance={15} fadeStrength={1.5}
            infiniteGrid={true}
        />

        {/* EFFECTS */}
        <EffectComposer disableNormalPass>
           <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} radius={0.4} />
           <ChromaticAberration offset={[0.0003, 0.0003]} /> 
           <Vignette offset={0.4} darkness={0.6} />
           <Noise opacity={0.03} /> 
        </EffectComposer>

        {/* CONTROLS */}
        <OrbitControls 
            makeDefault 
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.8}
            zoomSpeed={0.5}
            minDistance={2}
            maxDistance={10}
            target={[0, 0, 0]}
        />

      </Canvas>
    </div>
  );
}