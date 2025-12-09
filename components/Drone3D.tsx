import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const Propeller = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.5; // Spin speed
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1.2, 0.05, 0.1]} />
      <meshStandardMaterial color="#333" />
    </mesh>
  );
};

const DroneModel = ({ tiltX, tiltZ }: { tiltX: number; tiltZ: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      // Smooth interpolation for tilt
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX * 0.5, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ * -0.5, 0.1);
      
      // Gentle hovering animation
      groupRef.current.position.y = Math.sin(Date.now() / 1000) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body Central */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#FF9933" /> {/* Saffron Body */}
      </mesh>
      
      {/* Arms */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[2.5, 0.05, 0.2]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[2.5, 0.05, 0.2]} />
        <meshStandardMaterial color="#138808" /> {/* Green Arm */}
      </mesh>

      {/* Motors & Props */}
      <group position={[0.88, 0.1, 0.88]}> 
        <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.1, 0.1, 0.2]} /><meshStandardMaterial color="#000" /></mesh>
        <Propeller position={[0, 0.1, 0]} />
      </group>
      <group position={[-0.88, 0.1, -0.88]}>
         <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.1, 0.1, 0.2]} /><meshStandardMaterial color="#000" /></mesh>
        <Propeller position={[0, 0.1, 0]} />
      </group>
      <group position={[0.88, 0.1, -0.88]}>
         <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.1, 0.1, 0.2]} /><meshStandardMaterial color="#000" /></mesh>
        <Propeller position={[0, 0.1, 0]} />
      </group>
      <group position={[-0.88, 0.1, 0.88]}>
         <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.1, 0.1, 0.2]} /><meshStandardMaterial color="#000" /></mesh>
        <Propeller position={[0, 0.1, 0]} />
      </group>

      {/* Payload Box (if any) */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <meshStandardMaterial color="#000080" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

interface Drone3DProps {
  tiltX: number; // -1 to 1
  tiltZ: number; // -1 to 1
}

const Drone3D: React.FC<Drone3DProps> = ({ tiltX, tiltZ }) => {
  return (
    <div className="w-full h-64 md:h-80 relative rounded-xl overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 shadow-2xl">
      <div className="absolute top-4 left-4 z-10">
         <div className="text-xs text-gray-400 font-mono">VISUAL FEED // 3D TWIN</div>
         <div className="text-xs text-green-500 font-mono animate-pulse">LIVE SYNC</div>
      </div>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 4]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 5, 0]} intensity={0.8} />
        <DroneModel tiltX={tiltX} tiltZ={tiltZ} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} />
        <gridHelper args={[20, 20, 0x444444, 0x222222]} position={[0, -1, 0]} />
      </Canvas>
    </div>
  );
};

export default Drone3D;
