import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html, Grid, Environment, ContactShadows, Extrude } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/store';

const FLOOR_HEIGHT = 1.2;
const BUILDING_WIDTH = 4;
const BUILDING_DEPTH = 3;
const FLAT_GAP = 0.08;
const CUTAWAY_OFFSET = 0.8;

export interface BuildingConfig {
  totalFloors: number;
  floorHeightM: number;
  footprint: number[][] | null;
  osmLevels: number | null;
}

interface FloorProps {
  floorIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  cutaway: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
}

function Floor({ floorIndex, isSelected, isHovered, cutaway, onSelect, onHover }: FloorProps) {
  const meshRef = useRef<THREE.Group>(null);
  const flatARef = useRef<THREE.Mesh>(null);
  const flatBRef = useRef<THREE.Mesh>(null);

  const baseY = floorIndex * FLOOR_HEIGHT;
  const cutawayY = baseY + floorIndex * CUTAWAY_OFFSET;

  const selectedColor = new THREE.Color('#10B981');
  const unselectedColor = new THREE.Color('#1E293B');
  const hoveredColor = new THREE.Color('#38BDF8');

  useFrame(() => {
    if (!flatARef.current || !flatBRef.current || !meshRef.current) return;

    const targetColor = isSelected ? selectedColor : isHovered ? hoveredColor : unselectedColor;
    const targetOpacity = isSelected ? 0.85 : isHovered ? 0.55 : 0.35;
    const targetEmissive = isSelected ? 0.6 : isHovered ? 0.3 : 0.05;
    const emissiveColor = isSelected ? selectedColor : hoveredColor;

    [flatARef.current, flatBRef.current].forEach((mesh) => {
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.color.lerp(targetColor, 0.15);
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.15);
      mat.emissive.lerp(emissiveColor, 0.1);
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, 0.15);
    });

    const targetY = (cutaway ? cutawayY : baseY) + (isSelected ? 0.15 : 0);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
  });

  const flatWidth = (BUILDING_WIDTH - FLAT_GAP) / 2;
  const labelColor = isSelected ? '#10B981' : isHovered ? '#38BDF8' : '#94A3B8';
  const labelBorder = isSelected ? 'rgba(16,185,129,0.4)' : isHovered ? 'rgba(56,189,248,0.4)' : 'rgba(59,130,246,0.2)';
  const labelShadow = isSelected ? '0 0 8px rgba(16,185,129,0.6)' : isHovered ? '0 0 8px rgba(56,189,248,0.5)' : 'none';

  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: labelColor,
    whiteSpace: 'nowrap', background: 'rgba(15,23,42,0.7)', padding: '2px 6px',
    borderRadius: '4px', border: `1px solid ${labelBorder}`, textShadow: labelShadow,
  };

  return (
    <group
      ref={meshRef}
      position={[0, baseY, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(floorIndex); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(floorIndex); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
    >
      <mesh ref={flatARef} position={[-(flatWidth / 2 + FLAT_GAP / 4), 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[flatWidth, FLOOR_HEIGHT * 0.82, BUILDING_DEPTH]} />
        <meshPhysicalMaterial color="#1E293B" transparent opacity={0.35} roughness={0.05} metalness={0.2}
          transmission={0.4} thickness={0.5} clearcoat={1} clearcoatRoughness={0.1}
          emissive="#10B981" emissiveIntensity={0.05} />
      </mesh>

      <mesh ref={flatBRef} position={[flatWidth / 2 + FLAT_GAP / 4, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[flatWidth, FLOOR_HEIGHT * 0.82, BUILDING_DEPTH]} />
        <meshPhysicalMaterial color="#1E293B" transparent opacity={0.35} roughness={0.05} metalness={0.2}
          transmission={0.4} thickness={0.5} clearcoat={1} clearcoatRoughness={0.1}
          emissive="#10B981" emissiveIntensity={0.05} />
      </mesh>

      {/* Partition line */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.03, FLOOR_HEIGHT * 0.82, BUILDING_DEPTH + 0.02]} />
        <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Floor slab */}
      <mesh position={[0, -FLOOR_HEIGHT * 0.45, 0]}>
        <boxGeometry args={[BUILDING_WIDTH + 0.15, 0.08, BUILDING_DEPTH + 0.15]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
      </mesh>

      <Html position={[-(flatWidth / 2 + FLAT_GAP / 4), FLOOR_HEIGHT * 0.42, BUILDING_DEPTH / 2 + 0.01]} center distanceFactor={10} occlude={false}>
        <div style={labelStyle}>{`F${floorIndex + 1}-A`}</div>
      </Html>
      <Html position={[flatWidth / 2 + FLAT_GAP / 4, FLOOR_HEIGHT * 0.42, BUILDING_DEPTH / 2 + 0.01]} center distanceFactor={10} occlude={false}>
        <div style={labelStyle}>{`F${floorIndex + 1}-B`}</div>
      </Html>

      {isSelected && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[BUILDING_WIDTH * 0.62, BUILDING_WIDTH * 0.68, 32]} />
          <meshBasicMaterial color="#10B981" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function FloorLabel({ floorIndex, totalFloors, cutaway }: { floorIndex: number; totalFloors: number; cutaway: boolean }) {
  const baseY = floorIndex * FLOOR_HEIGHT;
  const cutawayY = baseY + floorIndex * CUTAWAY_OFFSET;
  const y = cutaway ? cutawayY : baseY;
  const labelOffset = totalFloors > 10 ? BUILDING_WIDTH / 2 + 1.5 : BUILDING_WIDTH / 2 + 1.8;

  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
      <Text position={[labelOffset, y, 0]} fontSize={totalFloors > 12 ? 0.28 : 0.35}
        color="#10B981" anchorX="left" anchorY="middle"
        outlineWidth={0.015} outlineColor="#0F172A" outlineOpacity={0.8}>
        {`Floor ${floorIndex + 1}`}
      </Text>
    </Float>
  );
}

function BuildingStructure({ totalFloors, cutaway }: { totalFloors: number; cutaway: boolean }) {
  const buildingH = FLOOR_HEIGHT * totalFloors;
  const cutawayH = buildingH + (totalFloors - 1) * CUTAWAY_OFFSET;

  return (
    <group position={[0, -FLOOR_HEIGHT * 0.5, 0]}>
      <mesh position={[0, -FLOOR_HEIGHT * 0.55, 0]} receiveShadow>
        <boxGeometry args={[BUILDING_WIDTH + 0.6, 0.2, BUILDING_DEPTH + 0.6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} metalness={0.2} />
      </mesh>

      {[
        [-BUILDING_WIDTH / 2 - 0.05, -BUILDING_DEPTH / 2 - 0.05],
        [BUILDING_WIDTH / 2 + 0.05, -BUILDING_DEPTH / 2 - 0.05],
        [-BUILDING_WIDTH / 2 - 0.05, BUILDING_DEPTH / 2 + 0.05],
        [BUILDING_WIDTH / 2 + 0.05, BUILDING_DEPTH / 2 + 0.05],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, (cutaway ? cutawayH : buildingH) / 2 - FLOOR_HEIGHT * 0.5, z]}>
          <boxGeometry args={[0.1, cutaway ? cutawayH : buildingH, 0.1]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}

      <mesh position={[0, (cutaway ? cutawayH : buildingH) / 2 - FLOOR_HEIGHT * 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, (cutaway ? cutawayH : buildingH) * 0.95, 8]} />
        <meshStandardMaterial color="#3B82F6" roughness={0.3} metalness={0.6} emissive="#3B82F6" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

function OSMFootprintBuilding({ polygon, levels, totalFloors, selectedFloor, cutaway, onSelectFloor }: {
  polygon: number[][]; levels: number; totalFloors: number; selectedFloor: number; cutaway: boolean; onSelectFloor: (i: number) => void;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(polygon[0][0], polygon[0][1]);
    for (let i = 1; i < polygon.length; i++) s.lineTo(polygon[i][0], polygon[i][1]);
    s.closePath();
    return s;
  }, [polygon]);

  const totalHeight = FLOOR_HEIGHT * totalFloors;
  const extrudeSettings = useMemo(() => ({
    depth: totalHeight, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2,
  }), [totalHeight]);

  const center = useMemo(() => {
    let cx = 0, cz = 0;
    polygon.forEach(([x, z]) => { cx += x; cz += z; });
    return [cx / polygon.length, cz / polygon.length] as [number, number];
  }, [polygon]);

  return (
    <group position={[-center[0], -totalFloors * FLOOR_HEIGHT * 0.5 + FLOOR_HEIGHT, -center[1]]}>
      <Extrude args={[shape, extrudeSettings]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial color="#1E293B" transparent opacity={0.25} roughness={0.05} metalness={0.3}
          transmission={0.5} thickness={0.5} clearcoat={1} clearcoatRoughness={0.1}
          emissive="#3B82F6" emissiveIntensity={0.08} />
      </Extrude>

      {Array.from({ length: totalFloors }, (_, i) => {
        const y = i * FLOOR_HEIGHT + FLOOR_HEIGHT / 2 + (cutaway ? i * CUTAWAY_OFFSET : 0);
        const isSelected = selectedFloor === i;
        return (
          <mesh key={i} position={[0, y, 0.01]}
            onClick={(e) => { e.stopPropagation(); onSelectFloor(i); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'default'; }}>
            <boxGeometry args={[0.02, FLOOR_HEIGHT * 0.9, 0.02]} />
            <meshBasicMaterial color={isSelected ? '#10B981' : '#475569'} />
          </mesh>
        );
      })}

      <Html position={[0, totalHeight + 0.5, 0]} center distanceFactor={12}>
        <div style={{
          fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#10B981',
          whiteSpace: 'nowrap', background: 'rgba(15,23,42,0.85)', padding: '4px 10px',
          borderRadius: '6px', border: '1px solid rgba(16,185,129,0.4)',
          textShadow: '0 0 8px rgba(16,185,129,0.5)',
        }}>
          {`OSM Footprint · ${levels || totalFloors} levels · ${totalFloors}F mesh`}
        </div>
      </Html>
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

interface Canvas3DProps {
  config: BuildingConfig;
}

function BuildingScene({ config }: Canvas3DProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosRef = useRef(new THREE.Vector3(7, 3, 8));
  const targetLookRef = useRef(new THREE.Vector3(0, 0, 0));
  const animatingRef = useRef(false);

  const selectedFloor = useStore((s) => s.selectedFloor);
  const hoveredFloor = useStore((s) => s.hoveredFloor);
  const cutawayMode = useStore((s) => s.cutawayMode);
  const focusTrigger = useStore((s) => s.focusTrigger);
  const selectFloor = useStore((s) => s.selectFloor);
  const setHovered = useStore((s) => s.setHovered);

  const totalFloors = config.totalFloors;
  const floors = useMemo(() => Array.from({ length: totalFloors }, (_, i) => i), [totalFloors]);

  const cutawayExtra = cutawayMode ? (totalFloors - 1) * CUTAWAY_OFFSET : 0;
  const offsetY = -(totalFloors * FLOOR_HEIGHT + cutawayExtra) * 0.5 + FLOOR_HEIGHT;

  useEffect(() => {
    if (focusTrigger === 0) return;
    const floorY = selectedFloor * FLOOR_HEIGHT + (cutawayMode ? selectedFloor * CUTAWAY_OFFSET : 0) + offsetY;
    const dist = totalFloors > 10 ? 11 : 8;
    targetPosRef.current.set(dist, floorY + 2, dist - 1);
    targetLookRef.current.set(0, floorY, 0);
    animatingRef.current = true;
  }, [focusTrigger, selectedFloor, totalFloors, cutawayMode, offsetY]);

  useFrame(() => {
    if (!animatingRef.current) return;
    camera.position.lerp(targetPosRef.current, 0.06);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookRef.current, 0.06);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(targetPosRef.current) < 0.05) animatingRef.current = false;
  });

  const hasOSM = config.footprint !== null && config.footprint !== undefined;

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 12, 6]} intensity={0.8} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-6, 4, -4]} intensity={0.4} color="#3B82F6" />
      <RoamingLight />

      <group position={[0, offsetY, 0]}>
        {hasOSM ? (
          <OSMFootprintBuilding polygon={config.footprint!} levels={config.osmLevels || 0}
            totalFloors={totalFloors} selectedFloor={selectedFloor} cutaway={cutawayMode} onSelectFloor={selectFloor} />
        ) : (
          <>
            {floors.map((i) => (
              <Floor key={i} floorIndex={i} isSelected={selectedFloor === i} isHovered={hoveredFloor === i}
                cutaway={cutawayMode} onSelect={selectFloor} onHover={setHovered} />
            ))}
            <BuildingStructure totalFloors={totalFloors} cutaway={cutawayMode} />
          </>
        )}
        {floors.map((i) => <FloorLabel key={`label-${i}`} floorIndex={i} totalFloors={totalFloors} cutaway={cutawayMode} />)}
      </group>

      <Grid position={[0, offsetY - FLOOR_HEIGHT * 0.7, 0]} args={[30, 30]} cellSize={1} cellThickness={0.5}
        cellColor="#3B82F6" sectionSize={5} sectionThickness={1} sectionColor="#10B981"
        fadeDistance={25} fadeStrength={1.5} infiniteGrid />
      <ContactShadows position={[0, offsetY - FLOOR_HEIGHT * 0.6, 0]} opacity={0.4} scale={15} blur={2.5} far={8} color="#10B981" />
      <Environment preset="night" />

      <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate
        minDistance={4} maxDistance={30} maxPolarAngle={Math.PI / 2.1}
        autoRotate autoRotateSpeed={0.3} target={[0, 0, 0]} />
    </>
  );
}

export default function Canvas3D({ config }: Canvas3DProps) {
  return (
    <Canvas shadows camera={{ position: [7, 3, 8], fov: 45 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
      <BuildingScene config={config} />
    </Canvas>
  );
}
