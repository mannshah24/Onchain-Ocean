import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../store/useOceanStore';

interface DroneData {
  position: THREE.Vector3;
  targetIdx: number;
  speed: number;
  scale: number;
  colorIdx: number;
}

export default function TrafficSystem() {
  const layout = useOceanStore((state) => state.layout);
  const droneMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-resolve structure coordinates
  const targets = useMemo(() => {
    const sf = 0.06;
    return layout.structures.map((s) => {
      const tx = s.position[0] * sf;
      const tz = s.position[2] * sf;
      const h = Math.max(3, s.height * 0.04);
      return new THREE.Vector3(tx, h * 0.5 + Math.random() * 3, tz);
    });
  }, [layout.structures]);

  // Set up 150 transaction light drones
  const droneCount = 150;
  const droneColors = useMemo(() => [
    new THREE.Color('#06b6d4'), // Cyan
    new THREE.Color('#8b5cf6'), // Purple
    new THREE.Color('#ec4899'), // Pink
    new THREE.Color('#10b981'), // Emerald
  ], []);

  const drones = useMemo<DroneData[]>(() => {
    const arr: DroneData[] = [];
    if (targets.length < 2) return arr;

    for (let i = 0; i < droneCount; i++) {
      const startIdx = Math.floor(Math.random() * targets.length);
      let targetIdx = Math.floor(Math.random() * targets.length);
      while (targetIdx === startIdx) {
        targetIdx = Math.floor(Math.random() * targets.length);
      }

      arr.push({
        position: targets[startIdx].clone(),
        targetIdx,
        speed: 6.0 + Math.random() * 9.0, // Swims at 6-15 units/sec
        scale: 0.14 + Math.random() * 0.14,
        colorIdx: Math.floor(Math.random() * droneColors.length),
      });
    }
    return arr;
  }, [targets, droneColors.length]);

  // Frame loops: swim drones toward coordinates targets
  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1);
    if (targets.length < 2 || drones.length === 0 || !droneMeshRef.current) return;

    drones.forEach((d, i) => {
      const targetPos = targets[d.targetIdx];
      
      // Swim vector calculations
      const dir = new THREE.Vector3().copy(targetPos).sub(d.position);
      const distance = dir.length();

      if (distance < 0.8) {
        // Destination reached -> pick a new random target node
        let nextTarget = Math.floor(Math.random() * targets.length);
        while (nextTarget === d.targetIdx) {
          nextTarget = Math.floor(Math.random() * targets.length);
        }
        d.targetIdx = nextTarget;
        d.speed = 6.0 + Math.random() * 9.0;
      } else {
        // Move forward
        dir.normalize();
        d.position.addScaledVector(dir, d.speed * dt);
        // Add a minor sine sway representing swimming path wobble
        d.position.y += Math.sin(d.position.x * 0.5 + i) * 0.05;
      }

      // Matrix set
      dummy.position.copy(d.position);
      dummy.scale.set(d.scale, d.scale, d.scale);
      dummy.updateMatrix();
      droneMeshRef.current!.setMatrixAt(i, dummy.matrix);
      // Colors list
      droneMeshRef.current!.setColorAt(i, droneColors[d.colorIdx]);
    });
    
    droneMeshRef.current.instanceMatrix.needsUpdate = true;
    if (droneMeshRef.current.instanceColor) {
      droneMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (targets.length < 2) return null;

  return (
    <instancedMesh
      ref={droneMeshRef}
      args={[null as any, null as any, droneCount]}
    >
      <sphereGeometry args={[1.0, 5, 5]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </instancedMesh>
  );
}
