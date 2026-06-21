import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../store/useOceanStore';

// Movement constants
const MOVE_SPEED = 24.0;
const DRAG_SENSITIVITY = 0.003;

export default function CameraController() {
  const { camera, gl } = useThree();
  const cameraState = useOceanStore((state) => state.cameraState);
  const updateCameraState = useOceanStore((state) => state.updateCameraState);

  // Key tracking
  const keysPressed = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
  });

  // Inertia and rotation tracking
  const velocity = useRef(new THREE.Vector3());
  const rotation = useRef({ yaw: 0, pitch: -0.2 }); // Look slightly down initially
  const isDragging = useRef(false);
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Cinematic journey tracking refs
  const startPos = useRef(new THREE.Vector3());
  const startLook = useRef(new THREE.Vector3());
  const transitionTime = useRef(0);
  const targetPosPrev = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') keysPressed.current.w = true;
      if (k === 's' || e.key === 'ArrowDown') keysPressed.current.s = true;
      if (k === 'a' || e.key === 'ArrowLeft') keysPressed.current.a = true;
      if (k === 'd' || e.key === 'ArrowRight') keysPressed.current.d = true;
      if (e.key === ' ') keysPressed.current.space = true;
      if (e.key === 'Shift') keysPressed.current.shift = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') keysPressed.current.w = false;
      if (k === 's' || e.key === 'ArrowDown') keysPressed.current.s = false;
      if (k === 'a' || e.key === 'ArrowLeft') keysPressed.current.a = false;
      if (k === 'd' || e.key === 'ArrowRight') keysPressed.current.d = false;
      if (e.key === ' ') keysPressed.current.space = false;
      if (e.key === 'Shift') keysPressed.current.shift = false;
    };

    const handleMouseDown = () => {
      if (cameraState.mode === 'free-float' || cameraState.mode === 'focused') {
        isDragging.current = true;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      rotation.current.yaw -= e.movementX * DRAG_SENSITIVITY;
      rotation.current.pitch = THREE.MathUtils.clamp(
        rotation.current.pitch - e.movementY * DRAG_SENSITIVITY,
        -Math.PI / 3,
        Math.PI / 3
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

    // --- Swim-release Focus Trigger ---
    // If the user tries to swim while in focused state, release control back to free-float
    const anyKeysPressed = keysPressed.current.w || keysPressed.current.a || 
                           keysPressed.current.s || keysPressed.current.d || 
                           keysPressed.current.space || keysPressed.current.shift;

    if (cameraState.mode === 'focused' && anyKeysPressed && !cameraState.animating) {
      useOceanStore.getState().resetSearch();
      return;
    }

    // --- MODE 1: Cinematic Panning (Homepage / Lobby idle) ---
    if (cameraState.mode === 'cinematic-panning') {
      const t = state.clock.getElapsedTime() * 0.04;
      camera.position.x = Math.sin(t) * 55;
      camera.position.z = Math.cos(t) * 55;
      camera.position.y = 22 + Math.sin(t * 1.5) * 6;
      camera.lookAt(0, 0, 0);
      return;
    }

    // --- MODE 2: Focused Zoom (Search / Structure selection) ---
    if (cameraState.mode === 'focused') {
      const targetPos = new THREE.Vector3(...cameraState.position);
      const targetLook = new THREE.Vector3(...cameraState.lookAt);

      // Reset start markers if focusing a new target
      if (!targetPosPrev.current.equals(targetPos)) {
        startPos.current.copy(camera.position);
        
        // Grab current camera forward orientation to project a starting lookAt target
        const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        startLook.current.copy(camera.position).addScaledVector(forwardVec, 15);
        
        transitionTime.current = 0;
        targetPosPrev.current.copy(targetPos);
      }

      if (transitionTime.current < 1) {
        // Increment progress (transition takes ~1.25 seconds)
        transitionTime.current = Math.min(1.0, transitionTime.current + dt * 0.8);
        const tVal = transitionTime.current;

        // Cubic Easing (easeInOutCubic)
        const ease = tVal < 0.5 
          ? 4 * tVal * tVal * tVal 
          : 1 - Math.pow(-2 * tVal + 2, 3) / 2;

        // Base linear interpolations
        const currentPos = new THREE.Vector3().lerpVectors(startPos.current, targetPos, ease);
        const currentLook = new THREE.Vector3().lerpVectors(startLook.current, targetLook, ease);

        // Add a beautiful cinematic height arc (climb & descend) proportional to distance
        const distance = startPos.current.distanceTo(targetPos);
        const arcHeight = Math.sin(tVal * Math.PI) * Math.min(15.0, distance * 0.25);
        currentPos.y += arcHeight;

        camera.position.copy(currentPos);
        lookTarget.current.copy(currentLook);
        camera.lookAt(lookTarget.current);
      } else {
        // Lock to exact target coordinates upon arrival
        camera.position.copy(targetPos);
        lookTarget.current.copy(targetLook);
        camera.lookAt(lookTarget.current);
        updateCameraState({ animating: false });
      }

      // Sync internal Euler rotation vectors with final quaternion look direction
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      rotation.current.yaw = Math.atan2(forward.x, forward.z);
      rotation.current.pitch = Math.asin(forward.y);
      return;
    }

    // --- MODE 3: Free Float Swimming (WASD exploration) ---
    if (cameraState.mode === 'free-float') {
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

      // Apply acceleration force
      velocity.current.addScaledVector(moveInput, MOVE_SPEED * dt);

      // Apply water drag / damping
      velocity.current.multiplyScalar(Math.exp(-2.5 * dt));

      // Update position
      camera.position.addScaledVector(velocity.current, dt);

      // Boundary Clamps: prevent going too high (surface) or clipping floor
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 2.0, 60.0);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -250.0, 250.0);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -250.0, 250.0);

      // Interpolate lookAt target
      const lookAtPoint = new THREE.Vector3()
        .copy(camera.position)
        .add(forwardDir);
      
      // Bobbing action (ocean currents simulation)
      camera.position.y += Math.sin(state.clock.getElapsedTime() * 1.5) * 0.003;

      camera.lookAt(lookAtPoint);
    }
  });

  return null;
}
