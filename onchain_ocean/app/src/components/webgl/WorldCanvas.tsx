import { Canvas } from '@react-three/fiber';
import { useOceanStore } from '../../store/useOceanStore';
import CameraController from './CameraController';
import Environment from './Environment';
import CitySkyline from './CitySkyline';
import InstancedOceanBuildings from './InstancedOceanBuildings';
import { FocusBeacon } from './OceanBuilding3D';

export default function WorldCanvas() {
  const layout = useOceanStore((state) => state.layout);
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const theme = useOceanStore((state) => state.theme);

  const structures = layout.structures;

  // Determine which building is focused
  const selectedStructure = selectedAddress
    ? structures.find((s) => s.address.toLowerCase() === selectedAddress.toLowerCase())
    : null;

  return (
    <div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
    >
      <Canvas
        camera={{ position: [0, 25, 45], fov: 50, near: 0.5, far: 500 }}
        gl={{ antialias: true, toneMapping: 3 /* ACESFilmic */ }}
      >
        {/* Background color matching ocean theme */}
        <color attach="background" args={[theme.bgColor]} />

        {/* Ambient Scene Environment (Lights, Fog, and Star/Firefly Particles) */}
        <Environment />

        {/* City Skyline Silhouettes */}
        <CitySkyline />

        {/* Camera Controller */}
        <CameraController />

        {/* ── High-Performance Instanced Buildings Grid ── */}
        <InstancedOceanBuildings
          buildings={structures}
          colors={theme.building}
          focusedBuilding={selectedAddress}
          onBuildingClick={(addr) => setSelectedAddress(addr)}
          dimAll={!!selectedAddress && !selectedStructure}
        />

        {/* ── Focus Beacon for the Selected Structure ── */}
        {selectedStructure && (() => {
          const sf = 0.06;
          const px = selectedStructure.position[0] * sf;
          const pz = selectedStructure.position[2] * sf;
          const h = Math.max(3, selectedStructure.height * 0.04);
          const w = Math.max(2, selectedStructure.width * 0.15);
          const d = Math.max(2, selectedStructure.depth * 0.15);
          return (
            <group position={[px, 0, pz]}>
              <FocusBeacon
                height={h}
                width={w}
                depth={d}
                accentColor={theme.building.accent}
              />
            </group>
          );
        })()}

        {/* ── Ocean Floor Ground Plane ── */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial
            color={theme.shadow}
            roughness={0.95}
            metalness={0.1}
            emissive={theme.bgColor}
            emissiveIntensity={0.2}
          />
        </mesh>

      </Canvas>
    </div>
  );
}
