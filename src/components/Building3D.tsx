import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html, Grid, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export const TOTAL_FLOORS = 5;

interface FloorProps {
  floorIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
}

const FLOOR_HEIGHT = 1.2;
const BUILDING_WIDTH = 4;
const BUILDING_DEPTH = 3;
const FLAT_GAP = 0.08;

function Floor({ floorIndex, isSelected, isHovered, onSelect, onHover }: FloorProps) {
  const meshRef = useRef<THREE.Group>(null);
  const flatARef = useRef<THREE.Mesh>(null);
  const flatBRef = useRef<THREE.Mesh>(null);

  const yPosition = floorIndex * FLOOR_HEIGHT;

  const selectedColor = new THREE.Color('#10B981');
  const unselectedColor = new THREE.Color('#1E293B');
  const hoveredColor = new THREE.Color('#3B82F6');

  useFrame(() => {
    if (!flatARef.current || !flatBRef.current) return;

    const targetColor = isSelected ? selectedColor : isHovered ? hoveredColor : unselectedColor;
    const targetOpacity = isSelected ? 0.85 : isHovered ? 0.55 : 0.35;
    const targetEmissive = isSelected ? 0.6 : isHovered ? 0.3 : 0.05;

    [flatARef.current, flatBRef.current].forEach((mesh) => {
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.color.lerp(targetColor, 0.15);
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.15);
      mat.emissive.lerp(isSelected ? selectedColor : hoveredColor, 0.1);
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, 0.15);
    });

    if (meshRef.current) {
      const targetY = yPosition + (isSelected ? 0.15 : 0);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.12);
    }
  });

  const flatWidth = (BUILDING_WIDTH - FLAT_GAP) / 2;

  return (
    <group
      ref={meshRef}
      position={[0, yPosition, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(floorIndex);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(floorIndex);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Flat A - Left */}
      <mesh ref={flatARef} position={[-(flatWidth / 2 + FLAT_GAP / 4), 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[flatWidth, FLOOR_HEIGHT * 0.82, BUILDING_DEPTH]} />
        <meshPhysicalMaterial
          color="#1E293B"
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.2}
          transmission={0.4}
          thickness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive="#10B981"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Flat B - Right */}
      <mesh ref={flatBRef} position={[flatWidth / 2 + FLAT_GAP / 4, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[flatWidth, FLOOR_HEIGHT * 0.82, BUILDING_DEPTH]} />
        <meshPhysicalMaterial
          color="#1E293B"
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.2}
          transmission={0.4}
          thickness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive="#10B981"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Floor slab */}
      <mesh position={[0, -FLOOR_HEIGHT * 0.45, 0]}>
        <boxGeometry args={[BUILDING_WIDTH + 0.15, 0.08, BUILDING_DEPTH + 0.15]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Flat labels */}
      <Html position={[-(flatWidth / 2 + FLAT_GAP / 4), FLOOR_HEIGHT * 0.42, BUILDING_DEPTH / 2 + 0.01]} center distanceFactor={10} occlude={false}>
        <div style={{
          fontSize: '9px',
          fontFamily: 'JetBrains Mono, monospace',
          color: isSelected ? '#10B981' : '#94A3B8',
          whiteSpace: 'nowrap',
          background: 'rgba(15,23,42,0.7)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: `1px solid ${isSelected ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.2)'}`,
          textShadow: isSelected ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
        }}>
          {`F${floorIndex + 1}-A`}
        </div>
      </Html>
      <Html position={[flatWidth / 2 + FLAT_GAP / 4, FLOOR_HEIGHT * 0.42, BUILDING_DEPTH / 2 + 0.01]} center distanceFactor={10} occlude={false}>
        <div style={{
          fontSize: '9px',
          fontFamily: 'JetBrains Mono, monospace',
          color: isSelected ? '#10B981' : '#94A3B8',
          whiteSpace: 'nowrap',
          background: 'rgba(15,23,42,0.7)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: `1px solid ${isSelected ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.2)'}`,
          textShadow: isSelected ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
        }}>
          {`F${floorIndex + 1}-B`}
        </div>
      </Html>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[BUILDING_WIDTH * 0.62, BUILDING_WIDTH * 0.68, 32]} />
          <meshBasicMaterial color="#10B981" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function FloorLabel({ floorIndex }: { floorIndex: number }) {
  const yPosition = floorIndex * FLOOR_HEIGHT;
  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
      <Text
        position={[BUILDING_WIDTH / 2 + 1.8, yPosition, 0]}
        fontSize={0.35}
        color="#10B981"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#0F172A"
        outlineOpacity={0.8}
      >
        {`Floor ${floorIndex + 1}`}
      </Text>
    </Float>
  );
}

function BuildingStructure() {
  const floors = useMemo(() => Array.from({ length: TOTAL_FLOORS }, (_, i) => i), []);

  return (
    <group position={[0, -TOTAL_FLOORS * FLOOR_HEIGHT * 0.5, 0]}>
      {/* Foundation */}
      <mesh position={[0, -FLOOR_HEIGHT * 0.55, 0]} receiveShadow>
        <boxGeometry args={[BUILDING_WIDTH + 0.6, 0.2, BUILDING_DEPTH + 0.6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Support pillars at corners */}
      {[
        [-BUILDING_WIDTH / 2 - 0.05, -BUILDING_DEPTH / 2 - 0.05],
        [BUILDING_WIDTH / 2 + 0.05, -BUILDING_DEPTH / 2 - 0.05],
        [-BUILDING_WIDTH / 2 - 0.05, BUILDING_DEPTH / 2 + 0.05],
        [BUILDING_WIDTH / 2 + 0.05, BUILDING_DEPTH / 2 + 0.05],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.1, FLOOR_HEIGHT * TOTAL_FLOORS, 0.1]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}

      {/* Central elevator shaft */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, FLOOR_HEIGHT * TOTAL_FLOORS * 0.95, 8]} />
        <meshStandardMaterial color="#3B82F6" roughness={0.3} metalness={0.6} emissive="#3B82F6" emissiveIntensity={0.15} />
      </mesh>

      {floors.map(() => null)}
    </group>
  );
}

function RoamingLight() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime() * 0.5;
      lightRef.current.position.x = Math.sin(t) * 5;
      lightRef.current.position.z = Math.cos(t) * 5;
    }
  });

  return <pointLight ref={lightRef} position={[5, 4, 5]} intensity={0.6} color="#10B981" distance={15} />;
}

interface Building3DProps {
  selectedFloor: number;
  hoveredFloor: number | null;
  onSelectFloor: (index: number) => void;
  onHoverFloor: (index: number | null) => void;
  focusTrigger: number;
}

function BuildingScene({ selectedFloor, hoveredFloor, onSelectFloor, onHoverFloor, focusTrigger }: Building3DProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosRef = useRef(new THREE.Vector3(7, 3, 8));
  const targetLookRef = useRef(new THREE.Vector3(0, 0, 0));
  const animatingRef = useRef(false);
  const floors = useMemo(() => Array.from({ length: TOTAL_FLOORS }, (_, i) => i), []);
  const offsetY = -TOTAL_FLOORS * FLOOR_HEIGHT * 0.5 + FLOOR_HEIGHT;

  useEffect(() => {
    if (focusTrigger === 0) return;
    const floorY = (selectedFloor - 2) * FLOOR_HEIGHT;
    targetPosRef.current.set(5, floorY + 2, 6);
    targetLookRef.current.set(0, floorY, 0);
    animatingRef.current = true;
  }, [focusTrigger, selectedFloor]);

  useFrame(() => {
    if (!animatingRef.current) return;
    camera.position.lerp(targetPosRef.current, 0.06);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookRef.current, 0.06);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(targetPosRef.current) < 0.05) {
      animatingRef.current = false;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-6, 4, -4]} intensity={0.4} color="#3B82F6" />
      <RoamingLight />

      <group position={[0, offsetY, 0]}>
        {floors.map((i) => (
          <Floor
            key={i}
            floorIndex={i}
            isSelected={selectedFloor === i}
            isHovered={hoveredFloor === i}
            onSelect={onSelectFloor}
            onHover={onHoverFloor}
          />
        ))}

        {floors.map((i) => (
          <FloorLabel key={`label-${i}`} floorIndex={i} />
        ))}

        <BuildingStructure />
      </group>

      <Grid
        position={[0, offsetY - FLOOR_HEIGHT * 0.7, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3B82F6"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#10B981"
        fadeDistance={25}
        fadeStrength={1.5}
        infiniteGrid
      />

      <ContactShadows
        position={[0, offsetY - FLOOR_HEIGHT * 0.6, 0]}
        opacity={0.4}
        scale={15}
        blur={2.5}
        far={8}
        color="#10B981"
      />

      <Environment preset="night" />

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.3}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function Building3D(props: Building3DProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [7, 3, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <BuildingScene {...props} />
    </Canvas>
  );
}
