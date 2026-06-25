import { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OceanStructure } from '../../types';
import { Html } from '@react-three/drei';

const PRESET_ADDRESSES = new Set([
  'DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj', // Whale
  'JUP6LkbZbjS1jKKppdH65gC4RCxs7zupBGVfaBNW6J3', // Jupiter Exchange
  'HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj', // Helius RPC
  'JUPyiwrYJFskUP4sfdaavEK29ECj5JQLuUR9kySsaWc', // Jupiter DAO
  '5tzQ7fQQGSL2i24rGDVfTY1SoMwSpL7B9N76S439v5rW', // Degen
  'TnSr7xFm2kP9yBvG4wJdN3hC8qRtZ5aE6oUi1LxKsMj', // Collector
  'Vote111111111111111111111111111111111111111', // Validator
  'SoCi3xFm2kP9yBvG4wJdN3hC8qRtZ5aE6oUi1LxKsMj', // Social Pod
  'LBRaCzEZKz3tL751KGX9JAT5YqjbzEiYy1wKkAT6Rco', // Yieldfarm
  'NeWb1xFm2kP9yBvG4wJdN3hC8qRtZ5aE6oUi1LxKsMj', // Newbie
  'ATLASux5aBK4etrrEsvaSg7Un6ryef57Sbd4xYhSg1sk', // Gamer
  'GovER5nhWYw13spokDgg61XtvJVT1AFrqtrszgCn1bQb', // Governor
  'dRFEymoaaowsjMQ22n664ssd5SXMkz365cVJPHpip8k', // Drift
  'whirLbMiicVdio4tUfT68RJHK79u2sRb6WxST2i6bhA', // LP
  'So1endDq2YkqyJ3Z96T6o3yM4aUqB391zR5XbFqjH7T'  // Lender
].map(a => a.toLowerCase()));


// ─── Atlas Constants (must match building window metrics) ───────────
const ATLAS_SIZE_X = 2048;
const ATLAS_SIZE_Y = 4096;
const ATLAS_CELL = 8;
const ATLAS_COLS = ATLAS_SIZE_X / ATLAS_CELL; // 256
const ATLAS_ROWS = ATLAS_SIZE_Y / ATLAS_CELL; // 512
const ATLAS_BAND_ROWS = 42;
const ATLAS_LIT_PCTS = [0.2, 0.35, 0.5, 0.65, 0.8, 0.95];

// Parse hex/named color to ABGR uint32 for direct pixel writes (little-endian)
function colorToABGR(hex: string): number {
  const c = new THREE.Color(hex);
  return (
    (255 << 24) |
    (Math.round(c.b * 255) << 16) |
    (Math.round(c.g * 255) << 8) |
    Math.round(c.r * 255)
  );
}

export function createWindowAtlas(colors: { windowLit: string[]; windowOff: string; face: string }): THREE.CanvasTexture {
  const WS = 6;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE_X;
  canvas.height = ATLAS_SIZE_Y;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(ATLAS_SIZE_X, ATLAS_SIZE_Y);
  const buf32 = new Uint32Array(imageData.data.buffer);

  const faceABGR = colorToABGR(colors.face);
  const litABGRs = colors.windowLit.map(colorToABGR);
  const offABGR = colorToABGR(colors.windowOff);

  buf32.fill(faceABGR);

  let s = 42;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  // Generate standard random windows for all 11 bands first
  for (let band = 0; band < 11; band++) {
    const litPct = ATLAS_LIT_PCTS[band % 6];
    const bandStart = band * ATLAS_BAND_ROWS;
    for (let r = 0; r < ATLAS_BAND_ROWS; r++) {
      const rowY = (bandStart + r) * ATLAS_CELL;
      for (let c = 0; c < ATLAS_COLS; c++) {
        const px = c * ATLAS_CELL;
        const abgr = rand() < litPct
          ? litABGRs[Math.floor(rand() * litABGRs.length)]
          : offABGR;
        for (let dy = 0; dy < WS; dy++) {
          const rowOffset = (rowY + dy) * ATLAS_SIZE_X + px;
          for (let dx = 0; dx < WS; dx++) {
            buf32[rowOffset + dx] = abgr;
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Draw custom facades on bands 6-10 (Git City Style)
  const drawSlantedBar = (c2d: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, slant: number) => {
    c2d.beginPath();
    c2d.moveTo(x, y);
    c2d.lineTo(x + w, y);
    c2d.lineTo(x + w - slant, y + h);
    c2d.lineTo(x - slant, y + h);
    c2d.closePath();
    c2d.fill();
  };

  for (let band = 6; band <= 10; band++) {
    const yStart = band * ATLAS_BAND_ROWS * ATLAS_CELL; // band * 336
    
    // Clear columns 0 to 31 (256 pixels wide) to the face color
    ctx.fillStyle = colors.face;
    ctx.fillRect(0, yStart, 256, ATLAS_BAND_ROWS * ATLAS_CELL);

    ctx.save();
    // Enable shadow glow
    ctx.shadowBlur = 15;

    if (band === 6) {
      // Solana Validator (Gold/Orange Theme)
      ctx.strokeStyle = '#ffd700';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffb000';
      ctx.lineWidth = 6;

      // Draw a glowing shield outline
      ctx.beginPath();
      ctx.moveTo(128, yStart + 60);
      ctx.lineTo(190, yStart + 90);
      ctx.lineTo(190, yStart + 200);
      ctx.quadraticCurveTo(190, 270, 128, 300);
      ctx.quadraticCurveTo(66, 270, 66, 200);
      ctx.lineTo(66, yStart + 90);
      ctx.closePath();
      ctx.stroke();

      // Draw slanted Solana parallelograms inside
      drawSlantedBar(ctx, 95, yStart + 115, 60, 20, 15);
      drawSlantedBar(ctx, 105, yStart + 155, 60, 20, -15);
      drawSlantedBar(ctx, 95, yStart + 195, 60, 20, 15);
    } else if (band === 7) {
      // Jupiter Exchange (Cyan Theme)
      ctx.strokeStyle = '#00f0ff';
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.lineWidth = 6;

      // Main circular planet outline
      ctx.beginPath();
      ctx.arc(128, yStart + 168, 55, 0, Math.PI * 2);
      ctx.stroke();

      // Orbit ring ellipse
      ctx.beginPath();
      ctx.ellipse(128, yStart + 168, 85, 22, -Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();

      // Nested growth chevrons pointing up
      // Chevron 1
      ctx.beginPath();
      ctx.moveTo(128, yStart + 115);
      ctx.lineTo(153, yStart + 140);
      ctx.lineTo(143, yStart + 140);
      ctx.lineTo(128, yStart + 125);
      ctx.lineTo(113, yStart + 140);
      ctx.lineTo(103, yStart + 140);
      ctx.closePath();
      ctx.fill();

      // Chevron 2
      ctx.beginPath();
      ctx.moveTo(128, yStart + 150);
      ctx.lineTo(153, yStart + 175);
      ctx.lineTo(143, yStart + 175);
      ctx.lineTo(128, yStart + 160);
      ctx.lineTo(113, yStart + 175);
      ctx.lineTo(103, yStart + 175);
      ctx.closePath();
      ctx.fill();
    } else if (band === 8) {
      // Helius RPC (Orange Theme)
      ctx.strokeStyle = '#ff5f1f';
      ctx.fillStyle = '#ff8f00';
      ctx.shadowColor = '#ff5f1f';
      ctx.lineWidth = 8;

      // Left bracket [
      ctx.beginPath();
      ctx.moveTo(80, yStart + 100);
      ctx.lineTo(50, yStart + 100);
      ctx.lineTo(50, yStart + 236);
      ctx.lineTo(80, yStart + 236);
      ctx.stroke();

      // Right bracket ]
      ctx.beginPath();
      ctx.moveTo(176, yStart + 100);
      ctx.lineTo(206, yStart + 100);
      ctx.lineTo(206, yStart + 236);
      ctx.lineTo(176, yStart + 236);
      ctx.stroke();

      // Central glowing sun/dot
      ctx.beginPath();
      ctx.arc(128, yStart + 168, 22, 0, Math.PI * 2);
      ctx.fill();

      // Tech crosshair circle around center
      ctx.strokeStyle = '#ff5f1f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(128, yStart + 168, 75, 0, Math.PI * 2);
      ctx.stroke();
    } else if (band === 9) {
      // Drift (Blue/Aqua Theme)
      ctx.strokeStyle = '#00d2ff';
      ctx.fillStyle = '#00d2ff';
      ctx.shadowColor = '#0099ff';
      ctx.lineWidth = 6;

      // 3 Wave bands
      for (let wave = 0; wave < 3; wave++) {
        ctx.beginPath();
        const waveY = yStart + 100 + wave * 60;
        for (let x = 30; x <= 226; x += 10) {
          const angle = ((x - 30) / 196) * Math.PI * 4;
          const y = waveY + Math.sin(angle + wave) * 22;
          if (x === 30) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 2 Arrowheads along waves
      for (let i = 0; i < 2; i++) {
        const cx = 80 + i * 90;
        const cy = yStart + 130 + i * 50;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 12, cy + 12);
        ctx.lineTo(cx, cy + 6);
        ctx.lineTo(cx + 12, cy + 12);
        ctx.closePath();
        ctx.fill();
      }
    } else if (band === 10) {
      // Degen (Green Theme: "I GET HIRED")
      ctx.fillStyle = '#39ff14';
      ctx.strokeStyle = '#39ff14';
      ctx.shadowColor = '#00ff66';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;

      // Text drawing
      ctx.font = '900 42px "Courier New", monospace';
      ctx.fillText('I GET', 128, yStart + 120);
      ctx.fillText('HIRED', 128, yStart + 210);

      // Terminal border
      ctx.strokeRect(30, yStart + 60, 196, 216);

      // Corner ticks
      ctx.beginPath();
      // Top-left
      ctx.moveTo(20, yStart + 60); ctx.lineTo(40, yStart + 60);
      ctx.moveTo(30, yStart + 50); ctx.lineTo(30, yStart + 70);
      // Bottom-right
      ctx.moveTo(216, yStart + 276); ctx.lineTo(236, yStart + 276);
      ctx.moveTo(226, yStart + 266); ctx.lineTo(226, yStart + 286);
      ctx.stroke();
    }

    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Shaders ────────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  attribute vec4 aUvFront;
  attribute vec4 aUvSide;
  attribute float aRise;
  attribute vec4 aTint;
  attribute float aLive;
  attribute float aFocused;
  attribute float aGeomType;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec4 vUvFront;
  varying vec4 vUvSide;
  varying vec3 vViewPos;
  varying vec4 vTint;
  varying float vLive;
  varying float vFocused;
  varying float vGeomType;

  void main() {
    vUv = uv;
    vNormal = normalize(mat3(instanceMatrix) * normal);
    vUvFront = aUvFront;
    vUvSide = aUvSide;
    vTint = aTint;
    vLive = aLive;
    vFocused = aFocused;
    vGeomType = aGeomType;

    vec3 localPos = position;
    localPos.y = localPos.y * aRise + (aRise - 1.0) * 0.5;

    vec4 mvPos = modelViewMatrix * instanceMatrix * vec4(localPos, 1.0);
    vViewPos = mvPos.xyz;

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec3 uRoofColor;
  uniform vec3 uFaceColor;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uDimOpacity;
  uniform float uDimEmissive;
  uniform float uCityEnergy;
  uniform float uHasFocus;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec4 vUvFront;
  varying vec4 vUvSide;
  varying vec3 vViewPos;
  varying vec4 vTint;
  varying float vLive;
  varying float vFocused;
  varying float vGeomType;

  void main() {
    float fogDepth = length(vViewPos);
    if (fogDepth > uFogFar) discard;

    vec3 absN = abs(vNormal);
    float isRoof = step(0.5, absN.y);

    vec2 customUv = vUv;
    vec4 uvParams = vUvFront;

    if (vGeomType > 0.5) {
      // Repeat the window atlas smoothly 4 times around the cylindrical facades
      customUv.x = fract(vUv.x * 4.0);
    } else {
      bool isFrontBack = absN.z > absN.x;
      uvParams = isFrontBack ? vUvFront : vUvSide;
    }

    vec2 atlasUv = uvParams.xy + customUv * uvParams.zw;
    vec3 wallColor = texture2D(uAtlas, atlasUv).rgb;

    if (vTint.a > 0.5) {
      float isFacePixel = step(length(wallColor - uFaceColor), 0.08);
      vec3 blendedTint = mix(uFaceColor, vTint.rgb, 0.6);
      wallColor = mix(wallColor, blendedTint, isFacePixel);
    }

    float ambientBase = 0.08 + 0.22 * uCityEnergy;
    vec3 emissive = wallColor * 1.8 * uCityEnergy;
    vec3 wallFinal = wallColor * ambientBase + emissive;

    vec3 liveBoost = vec3(1.4, 1.35, 1.2);
    wallFinal = mix(wallFinal, wallFinal * liveBoost, vLive);

    // Dynamic neon glowing roofs matching structure category tints
    vec3 roofColor = mix(uRoofColor, vTint.rgb, step(0.5, vTint.a) * 0.7);
    vec3 roofFinal = roofColor * (0.4 + 1.4 * uCityEnergy);

    vec3 color = mix(wallFinal, roofFinal, isRoof);

    vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
    float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.3 + 0.7;
    color *= diffuse;

    float isFocused = vFocused;
    float hasFocus = uHasFocus;

    float dimFactor = mix(1.0, mix(uDimOpacity, 1.0, isFocused), hasFocus);
    float emissiveMult = mix(1.0, mix(uDimEmissive, 1.0, isFocused), hasFocus);
    color *= emissiveMult * dimFactor;

    float isUnfocused = hasFocus * (1.0 - isFocused);
    if (isUnfocused > 0.5) {
      int x = int(mod(gl_FragCoord.x, 4.0));
      int y = int(mod(gl_FragCoord.y, 4.0));
      int idx = x + y * 4;
      float bayer;
      if (idx == 0) bayer = 0.0;    else if (idx == 1) bayer = 0.5;
      else if (idx == 2) bayer = 0.125; else if (idx == 3) bayer = 0.625;
      else if (idx == 4) bayer = 0.75;  else if (idx == 5) bayer = 0.25;
      else if (idx == 6) bayer = 0.875; else if (idx == 7) bayer = 0.375;
      else if (idx == 8) bayer = 0.1875; else if (idx == 9) bayer = 0.6875;
      else if (idx == 10) bayer = 0.0625; else if (idx == 11) bayer = 0.5625;
      else if (idx == 12) bayer = 0.9375; else if (idx == 13) bayer = 0.4375;
      else if (idx == 14) bayer = 0.8125; else bayer = 0.3125;
      if (bayer > uDimOpacity) discard;
    }

    float fogFactor = smoothstep(uFogNear, uFogFar, fogDepth);
    color = mix(color, uFogColor, fogFactor);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Pre-allocated temp objects ────────────────────────────────
const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);

// ─── Component Props ───────────────────────────────────────────
interface InstancedOceanBuildingsProps {
  buildings: OceanStructure[];
  colors: {
    windowLit: string[];
    windowOff: string;
    face: string;
    roof: string;
    accent: string;
  };
  focusedBuilding?: string | null;
  focusedBuildingB?: string | null;
  onBuildingClick?: (address: string) => void;
  dimOpacity?: number;
  dimEmissive?: number;
  cityEnergy?: number;
  dimAll?: boolean;
}

const RISE_DURATION = 0.85; // seconds
const MAX_RISE_TOTAL = 4; // cap total stagger to 4s
let hasPlayedRiseGlobal = false;

interface BuildingGroupData {
  b: OceanStructure;
  globalIdx: number;
}

export default memo(function InstancedOceanBuildings({
  buildings,
  colors,
  focusedBuilding,
  focusedBuildingB,
  onBuildingClick,
  dimOpacity = 0.6,
  dimEmissive = 0.5,
  cityEnergy = 1.0,
  dimAll = false,
}: InstancedOceanBuildingsProps) {
  const count = buildings.length;

  const meshRefs = {
    wallet: useRef<THREE.InstancedMesh>(null),
    blockchain: useRef<THREE.InstancedMesh>(null),
    startup: useRef<THREE.InstancedMesh>(null),
    community: useRef<THREE.InstancedMesh>(null),
  };

  const lastHoveredRef = useRef<{ type: 'wallet' | 'blockchain' | 'startup' | 'community'; index: number } | null>(null);

  // Group structures by type to assign them unique geometries
  const groups = useMemo(() => {
    const wallets: BuildingGroupData[] = [];
    const startups: BuildingGroupData[] = [];
    const communities: BuildingGroupData[] = [];
    const blockchains: BuildingGroupData[] = [];

    buildings.forEach((b, i) => {
      const data = { b, globalIdx: i };
      if (b.type === 'blockchain') blockchains.push(data);
      else if (b.type === 'startup') startups.push(data);
      else if (b.type === 'community') communities.push(data);
      else wallets.push(data);
    });

    return { wallets, startups, communities, blockchains };
  }, [buildings]);

  // Dynamic Window Atlas creation
  const atlasTexture = useMemo(() => createWindowAtlas(colors), [colors]);

  // Define distinct geometries for building categories
  const walletGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const blockchainGeo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 8), []); // Octagonal column
  const startupGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.5, 1, 4), []);    // Tapered column / square pyramid
  const communityGeo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 6), []);  // Hexagonal column

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: atlasTexture },
        uRoofColor: { value: new THREE.Color(colors.roof) },
        uFaceColor: { value: new THREE.Color(colors.face) },
        uFogColor: { value: new THREE.Color('#041029') },
        uFogNear: { value: 35 },
        uFogFar: { value: 190 },
        uDimOpacity: { value: dimOpacity },
        uDimEmissive: { value: dimEmissive },
        uCityEnergy: { value: cityEnergy },
        uHasFocus: { value: 0.0 },
      },
      vertexShader,
      fragmentShader,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme properties reactively without recreating shader material
  useEffect(() => {
    material.uniforms.uAtlas.value = atlasTexture;
    material.uniforms.uRoofColor.value.set(colors.roof);
    material.uniforms.uFaceColor.value.set(colors.face);
    material.uniforms.uDimOpacity.value = dimOpacity;
    material.uniforms.uDimEmissive.value = dimEmissive;
    material.needsUpdate = true;
  }, [material, atlasTexture, colors.roof, colors.face, dimOpacity, dimEmissive]);

  // Compute buffers for instanced attributes in each group
  const getGroupBuffers = (group: BuildingGroupData[]) => {
    const cnt = group.length;
    const uvF = new Float32Array(cnt * 4);
    const uvS = new Float32Array(cnt * 4);
    const rise = new Float32Array(cnt);
    const tint = new Float32Array(cnt * 4);
    const live = new Float32Array(cnt);
    const focused = new Float32Array(cnt);
    const geomType = new Float32Array(cnt);

    for (let i = 0; i < cnt; i++) {
      const b = group[i].b;
      const seed = b.address.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137;

      let bandIndex = Math.min(5, Math.max(0, Math.round(b.litPercentage * 5)));
      
      const addr = b.address.toLowerCase();
      let isPreset = true;
      if (addr === 'vote111111111111111111111111111111111111111') bandIndex = 6;
      else if (addr === 'jup6lkbzbjs1jkkppdh65gc4rcxs7zupbgvfabnw6j3') bandIndex = 7;
      else if (addr === 'heli5srtf2yn7vkxjm3pqcb9wgdz4oti8eualr1xnwcj') bandIndex = 8;
      else if (addr === 'drfeymoaaowsjmq22n664ssd5sxmkz365cvjphpip8k') bandIndex = 9;
      else if (addr === '5tzq7fqqgsl2i24rgdvfty1somwspl7b9n76s439v5rw') bandIndex = 10;
      else isPreset = false;

      const bandRowOffset = bandIndex * ATLAS_BAND_ROWS;

      // Front UV
      let frontColStart = 0;
      let frontColWidth = b.windowsPerFloor;
      let frontRowHeight = b.floors;

      if (isPreset) {
        frontColStart = 0;
        frontColWidth = 32;
        frontRowHeight = ATLAS_BAND_ROWS;
      } else {
        frontColStart = Math.abs(seed % Math.max(1, ATLAS_COLS - b.windowsPerFloor));
      }

      uvF[i * 4 + 0] = frontColStart / ATLAS_COLS;
      uvF[i * 4 + 1] = bandRowOffset / ATLAS_ROWS;
      uvF[i * 4 + 2] = frontColWidth / ATLAS_COLS;
      uvF[i * 4 + 3] = frontRowHeight / ATLAS_ROWS;

      // Side UV
      let sideColStart = 0;
      let sideColWidth = b.sideWindowsPerFloor;
      let sideRowHeight = b.floors;

      if (isPreset) {
        sideColStart = 32 + Math.abs((seed + 7919) % Math.max(1, ATLAS_COLS - 32 - b.sideWindowsPerFloor));
        sideRowHeight = b.floors;
      } else {
        sideColStart = Math.abs((seed + 7919) % Math.max(1, ATLAS_COLS - b.sideWindowsPerFloor));
      }

      uvS[i * 4 + 0] = sideColStart / ATLAS_COLS;
      uvS[i * 4 + 1] = bandRowOffset / ATLAS_ROWS;
      uvS[i * 4 + 2] = sideColWidth / ATLAS_COLS;
      uvS[i * 4 + 3] = sideRowHeight / ATLAS_ROWS;

      rise[i] = hasPlayedRiseGlobal ? 1.0 : 0.0;
      
      // Assign custom neon category colors to aTint (r, g, b, alpha-active)
      const tintColor = new THREE.Color(0, 0, 0);
      let hasTint = 0;

      if (b.type === 'blockchain') {
        tintColor.set('#ffb000'); // Consensus Neon Gold
        hasTint = 1;
      } else if (b.type === 'startup') {
        tintColor.set('#00f0ff'); // Innovation Neon Cyan
        hasTint = 1;
      } else if (b.type === 'community') {
        tintColor.set('#d946ef'); // Governance Neon Pink
        hasTint = 1;
      }

      tint[i * 4 + 0] = tintColor.r;
      tint[i * 4 + 1] = tintColor.g;
      tint[i * 4 + 2] = tintColor.b;
      tint[i * 4 + 3] = hasTint;
      
      live[i] = 0.0;

      // Map categories to geomType for cylindrical UV mapping in shader
      let gType = 0.0; // Box
      if (b.type === 'blockchain') gType = 1.0;
      else if (b.type === 'startup') gType = 2.0;
      else if (b.type === 'community') gType = 3.0;

      geomType[i] = gType;

      focused[i] = (focusedBuilding && focusedBuilding.toLowerCase() === addr) ||
                 (focusedBuildingB && focusedBuildingB.toLowerCase() === addr) ? 1.0 : 0.0;
    }

    return { uvF, uvS, rise, tint, live, focused, geomType };
  };

  const groupBuffers = useMemo(() => {
    return {
      wallet: getGroupBuffers(groups.wallets),
      blockchain: getGroupBuffers(groups.blockchains),
      startup: getGroupBuffers(groups.startups),
      community: getGroupBuffers(groups.communities),
    };
  }, [groups, focusedBuilding, focusedBuildingB]);

  const riseStartTime = useRef(-1);
  const riseStaggerDelay = useRef(0);
  const riseFirstActive = useRef(0);
  const riseLastStarted = useRef(0);
  const riseInitialized = useRef(false);

  // Layout instances positioning, matrices compose, and buffer attachments
  useEffect(() => {
    const sf = 0.06; // Layout scale factor to fit camera constraints

    const setupMesh = (
      mesh: THREE.InstancedMesh | null,
      group: BuildingGroupData[],
      buffers: ReturnType<typeof getGroupBuffers>
    ) => {
      if (!mesh) return;

      const cnt = group.length;
      for (let i = 0; i < cnt; i++) {
        const b = group[i].b;
        const h = Math.max(3, b.height * 0.04);
        const w = Math.max(0.6, b.width * 0.05);
        const d = Math.max(0.6, b.depth * 0.05);

        _position.set(b.position[0] * sf, h / 2, b.position[2] * sf);
        _scale.set(w, h, d);
        _matrix.compose(_position, _quaternion, _scale);
        mesh.setMatrixAt(i, _matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();

      // Instanced geometry attributes
      mesh.geometry.setAttribute('aUvFront', new THREE.InstancedBufferAttribute(buffers.uvF, 4));
      mesh.geometry.setAttribute('aUvSide', new THREE.InstancedBufferAttribute(buffers.uvS, 4));

      const riseAttr = new THREE.InstancedBufferAttribute(buffers.rise, 1);
      riseAttr.setUsage(THREE.DynamicDrawUsage);
      mesh.geometry.setAttribute('aRise', riseAttr);

      mesh.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(buffers.tint, 4));

      const liveAttr = new THREE.InstancedBufferAttribute(buffers.live, 1);
      liveAttr.setUsage(THREE.DynamicDrawUsage);
      mesh.geometry.setAttribute('aLive', liveAttr);

      const focusedAttr = new THREE.InstancedBufferAttribute(buffers.focused, 1);
      focusedAttr.setUsage(THREE.DynamicDrawUsage);
      mesh.geometry.setAttribute('aFocused', focusedAttr);

      // Attach geometry type parameter
      mesh.geometry.setAttribute('aGeomType', new THREE.InstancedBufferAttribute(buffers.geomType, 1));

      mesh.count = cnt;
    };

    setupMesh(meshRefs.wallet.current, groups.wallets, groupBuffers.wallet);
    setupMesh(meshRefs.blockchain.current, groups.blockchains, groupBuffers.blockchain);
    setupMesh(meshRefs.startup.current, groups.startups, groupBuffers.startup);
    setupMesh(meshRefs.community.current, groups.communities, groupBuffers.community);

    if (hasPlayedRiseGlobal) {
      riseInitialized.current = true;
      riseFirstActive.current = count;
      riseLastStarted.current = count;
    } else {
      hasPlayedRiseGlobal = true;
      riseInitialized.current = false;
      riseStartTime.current = -1;
      riseFirstActive.current = 0;
      riseLastStarted.current = 0;
    }
  }, [groups, groupBuffers, count]);

  // Sync Fog Uniforms dynamically with the scene fog
  const lastFogNear = useRef(0);
  const lastFogFar = useRef(0);
  useFrame(({ scene }) => {
    if (!material.uniforms) return;
    const fog = scene.fog as THREE.Fog | null;
    if (!fog) return;
    if (fog.near !== lastFogNear.current || fog.far !== lastFogFar.current) {
      material.uniforms.uFogColor.value.copy(fog.color);
      material.uniforms.uFogNear.value = fog.near;
      material.uniforms.uFogFar.value = fog.far;
      lastFogNear.current = fog.near;
      lastFogFar.current = fog.far;
    }
  });

  // Focus and Dimming Uniforms update
  useEffect(() => {
    if (!material.uniforms) return;
    material.uniforms.uHasFocus.value = (focusedBuilding || focusedBuildingB || dimAll) ? 1.0 : 0.0;
  }, [focusedBuilding, focusedBuildingB, dimAll, material]);

  // Update dynamic focus attributes on instance groups reactively
  useEffect(() => {
    const updateFocusAttribute = (
      mesh: THREE.InstancedMesh | null,
      group: BuildingGroupData[]
    ) => {
      if (!mesh) return;
      const attr = mesh.geometry.getAttribute('aFocused') as THREE.InstancedBufferAttribute;
      if (!attr) return;
      const arr = attr.array as Float32Array;
      let changed = false;

      for (let i = 0; i < group.length; i++) {
        const addr = group[i].b.address.toLowerCase();
        const isF = (focusedBuilding && focusedBuilding.toLowerCase() === addr) ||
                    (focusedBuildingB && focusedBuildingB.toLowerCase() === addr);
        const val = isF ? 1.0 : 0.0;
        if (arr[i] !== val) {
          arr[i] = val;
          changed = true;
        }
      }
      if (changed) attr.needsUpdate = true;
    };

    updateFocusAttribute(meshRefs.wallet.current, groups.wallets);
    updateFocusAttribute(meshRefs.blockchain.current, groups.blockchains);
    updateFocusAttribute(meshRefs.startup.current, groups.startups);
    updateFocusAttribute(meshRefs.community.current, groups.communities);
  }, [focusedBuilding, focusedBuildingB, groups]);

  // Rise stagger wave animation rendering
  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (!riseInitialized.current) {
      riseInitialized.current = true;
      riseStartTime.current = now;
      riseStaggerDelay.current = Math.min(0.003, MAX_RISE_TOTAL / Math.max(1, count));
      riseFirstActive.current = 0;
      riseLastStarted.current = 0;
    }

    if (riseFirstActive.current >= count) return;

    const startTime = riseStartTime.current;
    const stagger = riseStaggerDelay.current;
    const elapsedSinceRise = now - startTime;

    let lastStarted = riseLastStarted.current;
    while (lastStarted < count && elapsedSinceRise >= lastStarted * stagger) {
      lastStarted++;
    }
    riseLastStarted.current = lastStarted;

    let firstActive = riseFirstActive.current;
    while (firstActive < lastStarted) {
      const localElapsed = elapsedSinceRise - firstActive * stagger;
      if (localElapsed < RISE_DURATION) break;
      firstActive++;
    }
    riseFirstActive.current = firstActive;

    const updateGroupRise = (mesh: THREE.InstancedMesh | null, group: BuildingGroupData[]) => {
      if (!mesh) return;
      const attr = mesh.geometry.getAttribute('aRise') as THREE.InstancedBufferAttribute;
      if (!attr) return;
      const arr = attr.array as Float32Array;
      let wrote = false;

      for (let i = 0; i < group.length; i++) {
        const globalIdx = group[i].globalIdx;
        if (globalIdx < firstActive) {
          if (arr[i] !== 1) {
            arr[i] = 1;
            wrote = true;
          }
        } else if (globalIdx < lastStarted) {
          const localElapsed = elapsedSinceRise - globalIdx * stagger;
          const progress = localElapsed / RISE_DURATION;
          const one = 1 - progress;
          arr[i] = 1 - one * one * one;
          wrote = true;
        } else {
          if (arr[i] !== 0) {
            arr[i] = 0;
            wrote = true;
          }
        }
      }
      if (wrote) {
        attr.needsUpdate = true;
      }
    };

    updateGroupRise(meshRefs.wallet.current, groups.wallets);
    updateGroupRise(meshRefs.blockchain.current, groups.blockchains);
    updateGroupRise(meshRefs.startup.current, groups.startups);
    updateGroupRise(meshRefs.community.current, groups.communities);
  });

  // React Three Fiber Native Event Handlers
  const handleInstanceClick = (e: any, group: BuildingGroupData[]) => {
    e.stopPropagation();
    // Ignore drags/pans by checking delta distance
    if (e.delta !== undefined && e.delta > 8) return;
    const instId = e.instanceId;
    if (instId !== undefined && instId < group.length) {
      onBuildingClick?.(group[instId].b.address);
    }
  };

  const handlePointerMoveCategory = (e: any, type: 'wallet' | 'blockchain' | 'startup' | 'community') => {
    e.stopPropagation();
    const instId = e.instanceId;
    if (instId === undefined) return;

    document.body.style.cursor = 'pointer';

    if (lastHoveredRef.current?.type === type && lastHoveredRef.current?.index === instId) {
      return;
    }

    // Reset previous hover
    if (lastHoveredRef.current) {
      const prevMesh = meshRefs[lastHoveredRef.current.type].current;
      if (prevMesh) {
        const prevAttr = prevMesh.geometry.getAttribute('aLive') as THREE.InstancedBufferAttribute;
        if (prevAttr) {
          const prevArr = prevAttr.array as Float32Array;
          if (lastHoveredRef.current.index < prevArr.length) {
            prevArr[lastHoveredRef.current.index] = 0.0;
            prevAttr.needsUpdate = true;
          }
        }
      }
    }

    // Set new hover
    const mesh = meshRefs[type].current;
    if (mesh) {
      const attr = mesh.geometry.getAttribute('aLive') as THREE.InstancedBufferAttribute;
      if (attr) {
        const arr = attr.array as Float32Array;
        if (instId < arr.length) {
          arr[instId] = 1.0;
          attr.needsUpdate = true;
          lastHoveredRef.current = { type, index: instId };
        }
      }
    }
  };

  const handlePointerOutCategory = (type: 'wallet' | 'blockchain' | 'startup' | 'community') => {
    document.body.style.cursor = 'auto';
    if (lastHoveredRef.current && lastHoveredRef.current.type === type) {
      const mesh = meshRefs[type].current;
      if (mesh) {
        const attr = mesh.geometry.getAttribute('aLive') as THREE.InstancedBufferAttribute;
        if (attr) {
          const arr = attr.array as Float32Array;
          if (lastHoveredRef.current.index < arr.length) {
            arr[lastHoveredRef.current.index] = 0.0;
            attr.needsUpdate = true;
          }
        }
      }
      lastHoveredRef.current = null;
    }
  };

  // Cleanups
  useEffect(() => {
    return () => {
      walletGeo.dispose();
      blockchainGeo.dispose();
      startupGeo.dispose();
      communityGeo.dispose();
      material.dispose();
      atlasTexture.dispose();
    };
  }, [walletGeo, blockchainGeo, startupGeo, communityGeo, material, atlasTexture]);

  return (
    <group>
      {/* 1. Wallets Category: Rectangular Columns */}
      {groups.wallets.length > 0 && (
        <instancedMesh
          ref={meshRefs.wallet}
          args={[walletGeo, material, groups.wallets.length]}
          frustumCulled={false}
          castShadow
          receiveShadow
          onClick={(e) => handleInstanceClick(e, groups.wallets)}
          onPointerOver={(e) => handlePointerMoveCategory(e, 'wallet')}
          onPointerMove={(e) => handlePointerMoveCategory(e, 'wallet')}
          onPointerOut={() => handlePointerOutCategory('wallet')}
        />
      )}

      {/* 2. Blockchains Category: Octagonal Columns */}
      {groups.blockchains.length > 0 && (
        <instancedMesh
          ref={meshRefs.blockchain}
          args={[blockchainGeo, material, groups.blockchains.length]}
          frustumCulled={false}
          castShadow
          receiveShadow
          onClick={(e) => handleInstanceClick(e, groups.blockchains)}
          onPointerOver={(e) => handlePointerMoveCategory(e, 'blockchain')}
          onPointerMove={(e) => handlePointerMoveCategory(e, 'blockchain')}
          onPointerOut={() => handlePointerOutCategory('blockchain')}
        />
      )}

      {/* 3. Startups Category: Tapered Pyramids */}
      {groups.startups.length > 0 && (
        <instancedMesh
          ref={meshRefs.startup}
          args={[startupGeo, material, groups.startups.length]}
          frustumCulled={false}
          castShadow
          receiveShadow
          onClick={(e) => handleInstanceClick(e, groups.startups)}
          onPointerOver={(e) => handlePointerMoveCategory(e, 'startup')}
          onPointerMove={(e) => handlePointerMoveCategory(e, 'startup')}
          onPointerOut={() => handlePointerOutCategory('startup')}
        />
      )}

      {/* 4. Communities & Protocols Category: Hexagonal Columns */}
      {groups.communities.length > 0 && (
        <instancedMesh
          ref={meshRefs.community}
          args={[communityGeo, material, groups.communities.length]}
          frustumCulled={false}
          castShadow
          receiveShadow
          onClick={(e) => handleInstanceClick(e, groups.communities)}
          onPointerOver={(e) => handlePointerMoveCategory(e, 'community')}
          onPointerMove={(e) => handlePointerMoveCategory(e, 'community')}
          onPointerOut={() => handlePointerOutCategory('community')}
        />
      )}

      {/* 5. Floating Glassmorphic Billboard Labels for default preset Blockchains, Startups, and DAOs */}
      {buildings
        .filter((b) => {
          const isSpecialType = b.type === 'blockchain' || b.type === 'startup' || b.type === 'community';
          const isPreset = PRESET_ADDRESSES.has(b.address.toLowerCase());
          return isSpecialType && isPreset;
        })
        .map((b) => {
          const sf = 0.06;
          const h = Math.max(3, b.height * 0.04);
          const px = b.position[0] * sf;
          const pz = b.position[2] * sf;

          const labelText = b.projectName || b.domain || `${b.address.slice(0, 8)}...`;
          
          let typeLabel = '';
          let badgeColorClass = '';

          if (b.type === 'blockchain') {
            typeLabel = 'BLOCKCHAIN';
            badgeColorClass = 'border-amber-400/40 text-amber-300 bg-amber-950/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
          } else if (b.type === 'startup') {
            typeLabel = 'STARTUP';
            badgeColorClass = 'border-cyan-400/40 text-cyan-300 bg-cyan-950/80 shadow-[0_0_12px_rgba(6,182,212,0.3)]';
          } else if (b.type === 'community') {
            typeLabel = 'PROTOCOL DAO';
            badgeColorClass = 'border-fuchsia-400/40 text-fuchsia-300 bg-fuchsia-950/80 shadow-[0_0_12px_rgba(217,70,239,0.3)]';
          } else {
            typeLabel = 'WHALE WALLET';
            badgeColorClass = 'border-slate-500/40 text-slate-300 bg-slate-900/80 shadow-[0_0_10px_rgba(148,163,184,0.15)]';
          }

          return (
            <group key={`label-${b.address}`} position={[px, h + 2.5, pz]}>
              <Html
                distanceFactor={32}
                center
                className="pointer-events-none select-none font-mono text-[8px] font-bold"
              >
                <div className={`px-2.5 py-1.5 rounded border flex flex-col items-center gap-0.5 whitespace-nowrap backdrop-blur-sm transition-all duration-300 ${badgeColorClass}`}>
                  <span className="text-[6.5px] tracking-[0.25em] font-extrabold uppercase opacity-80">{typeLabel}</span>
                  <span className="tracking-wider uppercase text-white font-black">{labelText}</span>
                </div>
              </Html>
            </group>
          );
        })}
    </group>
  );

});
