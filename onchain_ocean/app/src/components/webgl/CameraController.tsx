import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../store/useOceanStore';

// Movement constants
const MOVE_SPEED = 24.0;
const SWIM_SPEED = 40.0;
const SWIM_BOOST_SPEED = 70.0;
const DRAG_SENSITIVITY = 0.003;

export default function CameraController() {
  const { camera, gl } = useThree();
  const cameraState = useOceanStore((state) => state.cameraState);
  const updateCameraState = useOceanStore((state) => state.updateCameraState);

  // Key tracking
  const keysPressed = useRef({
    w: false, a: false, s: false, d: false,
    space: false, shift: false, boost: false,
  });

  // Inertia and rotation tracking
  const velocity = useRef(new THREE.Vector3());
  const rotation = useRef({ yaw: 0, pitch: -0.2 });
  const isDragging = useRef(false);
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Cinematic journey tracking
  const startPos = useRef(new THREE.Vector3());
  const startLook = useRef(new THREE.Vector3());
  const transitionTime = useRef(0);
  const targetPosPrev = useRef(new THREE.Vector3());

  // Swim mode scoring
  const swimScoreTimer = useRef(0);
  const nearbyStructureTimer = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') keysPressed.current.w = true;
      if (k === 's' || e.key === 'ArrowDown') keysPressed.current.s = true;
      if (k === 'a' || e.key === 'ArrowLeft') keysPressed.current.a = true;
      if (k === 'd' || e.key === 'ArrowRight') keysPressed.current.d = true;
      if (e.key === ' ') keysPressed.current.space = true;
      if (e.key === 'Shift') keysPressed.current.shift = true;
      if (k === 'e') keysPressed.current.boost = true;
      // G key to toggle swim mode
      if (k === 'g') useOceanStore.getState().toggleSwimMode();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') keysPressed.current.w = false;
      if (k === 's' || e.key === 'ArrowDown') keysPressed.current.s = false;
      if (k === 'a' || e.key === 'ArrowLeft') keysPressed.current.a = false;
      if (k === 'd' || e.key === 'ArrowRight') keysPressed.current.d = false;
      if (e.key === ' ') keysPressed.current.space = false;
      if (e.key === 'Shift') keysPressed.current.shift = false;
      if (k === 'e') keysPressed.current.boost = false;
    };

    const handleMouseDown = () => {
      if (cameraState.mode === 'free-float' || cameraState.mode === 'focused' || cameraState.mode === 'swim') {
        isDragging.current = true;
      }
    };

    const handleMouseUp = () => { isDragging.current = false; };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      rotation.current.yaw -= e.movementX * DRAG_SENSITIVITY;
      rotation.current.pitch = THREE.MathUtils.clamp(
        rotation.current.pitch - e.movementY * DRAG_SENSITIVITY,
        -Math.PI / 3, Math.PI / 3
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cameraState.mode, gl.domElement]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    const anyKeysPressed = keysPressed.current.w || keysPressed.current.a || 
                           keysPressed.current.s || keysPressed.current.d || 
                           keysPressed.current.space || keysPressed.current.shift;

    if (cameraState.mode === 'focused' && anyKeysPressed && !cameraState.animating) {
      useOceanStore.getState().setSelectedAddress(null);
      return;
    }

    // --- MODE: Cinematic Panning ---
    if (cameraState.mode === 'cinematic-panning') {
      const t = state.clock.getElapsedTime() * 0.04;
      camera.position.x = Math.sin(t) * 55;
      camera.position.z = Math.cos(t) * 55;
      camera.position.y = 22 + Math.sin(t * 1.5) * 6;
      camera.lookAt(0, 0, 0);
      return;
    }

    // --- MODE: Focused ---
    if (cameraState.mode === 'focused') {
      const targetPos = new THREE.Vector3(...cameraState.position);
      const targetLook = new THREE.Vector3(...cameraState.lookAt);

      if (!targetPosPrev.current.equals(targetPos)) {
        startPos.current.copy(camera.position);
        const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        startLook.current.copy(camera.position).addScaledVector(forwardVec, 15);
        transitionTime.current = 0;
        targetPosPrev.current.copy(targetPos);
      }

      if (transitionTime.current < 1) {
        transitionTime.current = Math.min(1.0, transitionTime.current + dt * 0.8);
        const tVal = transitionTime.current;
        const ease = tVal < 0.5 ? 4 * tVal * tVal * tVal : 1 - Math.pow(-2 * tVal + 2, 3) / 2;

        const currentPos = new THREE.Vector3().lerpVectors(startPos.current, targetPos, ease);
        const currentLook = new THREE.Vector3().lerpVectors(startLook.current, targetLook, ease);

        const distance = startPos.current.distanceTo(targetPos);
        const arcHeight = Math.sin(tVal * Math.PI) * Math.min(15.0, distance * 0.25);
        currentPos.y += arcHeight;

        camera.position.copy(currentPos);
        lookTarget.current.copy(currentLook);
        camera.lookAt(lookTarget.current);
      } else {
        camera.position.copy(targetPos);
        lookTarget.current.copy(targetLook);
        camera.lookAt(lookTarget.current);
        updateCameraState({ animating: false });
      }

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      rotation.current.yaw = Math.atan2(forward.x, forward.z);
      rotation.current.pitch = Math.asin(forward.y);
      return;
    }

    // --- MODE: Free Float / Swim ---
    if (cameraState.mode === 'free-float' || cameraState.mode === 'swim') {
      const isSwim = cameraState.mode === 'swim';
      const baseSpeed = isSwim ? (keysPressed.current.boost ? SWIM_BOOST_SPEED : SWIM_SPEED) : MOVE_SPEED;

      const forwardDir = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(
          new THREE.Quaternion().setFromEuler(
            new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ')
          )
        );
      
      const rightDir = new THREE.Vector3(1, 0, 0)
        .applyQuaternion(
          new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, rotation.current.yaw, 0, 'YXZ')
          )
        );

      const moveInput = new THREE.Vector3();
      if (keysPressed.current.w) moveInput.add(forwardDir);
      if (keysPressed.current.s) moveInput.sub(forwardDir);
      if (keysPressed.current.d) moveInput.add(rightDir);
      if (keysPressed.current.a) moveInput.sub(rightDir);
      if (keysPressed.current.space) moveInput.y += 0.8;
      if (keysPressed.current.shift) moveInput.y -= 0.8;

      if (moveInput.lengthSq() > 0) moveInput.normalize();

      velocity.current.addScaledVector(moveInput, baseSpeed * dt);
      const dragFactor = isSwim ? 2.0 : 2.5;
      velocity.current.multiplyScalar(Math.exp(-dragFactor * dt));

      camera.position.addScaledVector(velocity.current, dt);

      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 2.0, 60.0);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -350.0, 350.0);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -350.0, 350.0);

      const lookAtPoint = new THREE.Vector3().copy(camera.position).add(forwardDir);
      camera.position.y += Math.sin(state.clock.getElapsedTime() * 1.5) * 0.003;
      camera.lookAt(lookAtPoint);

      // Update camera position in store for sonar map + bottom HUD
      const pos = camera.position;
      updateCameraState({ position: [pos.x, pos.y, pos.z] });

      // --- Swim Mode Scoring ---
      if (isSwim) {
        const speed = velocity.current.length();
        useOceanStore.getState().setSwimHUD({
          speed: speed * 3.6,
          depth: camera.position.y,
        });

        // Score from movement
        swimScoreTimer.current += dt;
        if (swimScoreTimer.current >= 0.5 && speed > 0.5) {
          swimScoreTimer.current = 0;
          const speedBonus = Math.floor(speed * 2);
          const store = useOceanStore.getState();
          const combo = Math.min(10, store.swimScore.combo + (speed > 3 ? 1 : 0));
          const earned = speedBonus * Math.max(1, combo);
          store.setSwimScore({
            score: store.swimScore.score + earned,
            earned,
            combo,
            maxCombo: Math.max(store.swimScore.maxCombo, combo),
          });
        }

        // Check proximity to structures for discovery scoring
        nearbyStructureTimer.current += dt;
        if (nearbyStructureTimer.current >= 1.0) {
          nearbyStructureTimer.current = 0;
          const structures = useOceanStore.getState().layout.structures;
          const sf = 0.06;
          for (const s of structures) {
            const dx = camera.position.x - s.position[0] * sf;
            const dz = camera.position.z - s.position[2] * sf;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 15) {
              const store = useOceanStore.getState();
              const collected = store.swimScore.collected + 1;
              store.setSwimScore({
                score: store.swimScore.score + 50,
                collected,
                combo: store.swimScore.combo + 1,
              });
              break;
            }
          }
        }
      }
    }
  });

  return null;
}
