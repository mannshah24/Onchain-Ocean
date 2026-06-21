import { Canvas } from '@react-three/fiber';
import { useOceanStore } from '../../store/useOceanStore';
import CameraController from './CameraController';
import Environment from './Environment';
import CitySkyline from './CitySkyline';
import OceanLife from './OceanLife';
import TrafficSystem from './TrafficSystem';
import OceanBuilding3D from './OceanBuilding3D';

export default function WorldCanvas() {
  const layout = useOceanStore((state) => state.layout);
  const resetSearch = useOceanStore((state) => state.resetSearch);
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const theme = useOceanStore((state) => state.theme);

  const structures = layout.structures;

  // Determine which buildings are dimmed (when one is focused)
  const hasFocused = !!selectedAddress;

  return (
    <div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
      onDoubleClick={resetSearch}
    >
      <Canvas
        camera={{ position: [0, 25, 45], fov: 50, near: 0.1, far: 600 }}
        gl={{ antialias: true, toneMapping: 3 /* ACESFilmic */ }}
        shadows
      >
        {/* Background color matching ocean theme */}
        <color attach="background" args={[theme.bgColor]} />

        {/* Ambient Scene Environment */}
        <Environment />

        {/* City Skyline Silhouettes */}
        <CitySkyline />

        {/* Living Ocean Marine Life */}
        <OceanLife />

        {/* Transaction Traffic System */}
        <TrafficSystem />

        {/* Camera Controller */}
        <CameraController />

        {/* ── Layout-Driven Ocean Structures ── */}
        <group>
          {structures.map((structure) => (
            <OceanBuilding3D
              key={structure.address}
              structure={structure}
              focused={selectedAddress === structure.address}
              dimmed={hasFocused && selectedAddress !== structure.address}
              onClick={(addr) => setSelectedAddress(addr)}
            />
          ))}
        </group>

        {/* ── Ocean Floor Ground Plane ── */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[800, 800]} />
          <meshStandardMaterial
            color="#040d1a"
            roughness={0.95}
            metalness={0.1}
            emissive="#020810"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* ── Thermal Vent Trench ── */}
        {layout.thermalVent && (() => {
          const vent = layout.thermalVent;
          const sf = 0.06;
          const cx = ((vent.x + vent.width / 2) * sf);
          const cz = vent.centerZ * sf;
          const w = vent.width * sf;
          const l = vent.length * sf;
          return (
            <group position={[cx, -0.5, cz]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[w, l]} />
                <meshStandardMaterial
                  color="#0a0015"
                  emissive="#1a0030"
                  emissiveIntensity={1.5}
                  roughness={0.9}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              {/* Vent glow particles */}
              {Array.from({ length: 5 }).map((_, i) => (
                <mesh key={`vent-glow-${i}`} position={[(i - 2) * w / 5, 0.2, 0]}>
                  <sphereGeometry args={[0.3, 8, 8]} />
                  <meshBasicMaterial color="#a855f7" transparent opacity={0.4} />
                </mesh>
              ))}
            </group>
          );
        })()}

        {/* ── Coral Arches (Bridge equiv) ── */}
        {layout.coralArches.map((arch, i) => {
          const sf = 0.06;
          return (
            <group key={`arch-${i}`} position={[arch.position[0] * sf, 0, arch.position[2] * sf]}>
              <mesh rotation={[0, arch.rotation, 0]}>
                <torusGeometry args={[arch.width * sf * 0.3, 0.5, 8, 16, Math.PI]} />
                <meshStandardMaterial
                  color="#0f6b5f"
                  emissive="#14b8a6"
                  emissiveIntensity={0.8}
                  roughness={0.7}
                />
              </mesh>
            </group>
          );
        })}

        {/* ── Zone Markers ── */}
        {layout.zones.map((zone) => {
          const sf = 0.06;
          return (
            <group key={zone.id} position={[zone.center[0] * sf, 0.5, zone.center[2] * sf]}>
              {/* Zone glow disc */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[3, 32]} />
                <meshBasicMaterial
                  color={zone.color}
                  transparent
                  opacity={0.08}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );
        })}

        {/* ── Decorations: Bioluminescent Nodes ── */}
        {layout.decorations
          .filter(d => d.type === 'biolumNode')
          .slice(0, 50)
          .map((d, i) => {
            const sf = 0.06;
            return (
              <group key={`biolum-${i}`} position={[d.position[0] * sf, 1.5, d.position[2] * sf]}>
                <mesh>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
                </mesh>
                <pointLight color="#06b6d4" intensity={0.3} distance={8} />
              </group>
            );
          })}

        {/* ── Decorations: Kelp Forests ── */}
        {layout.decorations
          .filter(d => d.type === 'kelp')
          .slice(0, 40)
          .map((d, i) => {
            const sf = 0.06;
            const kelpHeight = 2 + d.variant * 1.5;
            return (
              <group key={`kelp-${i}`} position={[d.position[0] * sf, kelpHeight / 2, d.position[2] * sf]} rotation={[0, d.rotation, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.05, 0.1, kelpHeight, 6]} />
                  <meshStandardMaterial color="#0a4a3a" emissive="#0f7a5a" emissiveIntensity={0.3} roughness={0.8} />
                </mesh>
                {/* Kelp top bulb */}
                <mesh position={[0, kelpHeight / 2 + 0.2, 0]}>
                  <sphereGeometry args={[0.12, 6, 6]} />
                  <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
                </mesh>
              </group>
            );
          })}

        {/* ── Decorations: Coral ── */}
        {layout.decorations
          .filter(d => d.type === 'coral')
          .slice(0, 30)
          .map((d, i) => {
            const sf = 0.06;
            const coralColors = ['#ec4899', '#f472b6', '#a855f7', '#f97316'];
            const color = coralColors[d.variant % coralColors.length];
            return (
              <group key={`coral-${i}`} position={[d.position[0] * sf, 0.3, d.position[2] * sf]} rotation={[0, d.rotation, 0]}>
                <mesh>
                  <dodecahedronGeometry args={[0.3, 0]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.6} />
                </mesh>
              </group>
            );
          })}

      </Canvas>
    </div>
  );
}
