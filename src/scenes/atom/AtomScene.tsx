import { Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Object3D, type InstancedMesh } from 'three';
import type { AtomSceneProps, AtomSelection, Point3 } from '../types';
import { SceneHtml, useSceneEnvironment } from '../shared/SceneViewport';

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function makeCloud(shell: number, count: number, seed: number): BufferGeometry {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const nominalRadius = 0.72 + shell * 0.67;

  for (let index = 0; index < count; index += 1) {
    const z = 2 * random() - 1;
    const azimuth = random() * Math.PI * 2;
    const spread = Math.sqrt(1 - z * z);
    const gaussian = Math.sqrt(-2 * Math.log(Math.max(0.00001, random()))) * Math.cos(2 * Math.PI * random());
    const radius = shell === 0
      ? nominalRadius * Math.cbrt(random()) * 1.55
      : Math.max(0.18, nominalRadius + gaussian * (0.18 + shell * 0.035));
    positions[index * 3] = radius * spread * Math.cos(azimuth);
    positions[index * 3 + 1] = radius * spread * Math.sin(azimuth);
    positions[index * 3 + 2] = radius * z;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}

function makePOrbital(shell: number, count: number, seed: number): BufferGeometry {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const reach = 0.7 + shell * 0.58;
  for (let index = 0; index < count; index += 1) {
    const sign = index % 2 === 0 ? 1 : -1;
    const distance = Math.sqrt(-2 * Math.log(Math.max(0.00001, random()))) * 0.24;
    const around = random() * Math.PI * 2;
    positions[index * 3] = sign * (reach * (0.42 + random() * 0.7));
    positions[index * 3 + 1] = Math.cos(around) * distance;
    positions[index * 3 + 2] = Math.sin(around) * distance;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}

function ElectronCloud({
  atomicNumber, shellElectrons, selectedShell, selectedSubshell, opacity, onSelect,
}: {
  atomicNumber: number;
  shellElectrons: readonly number[];
  selectedShell: number | null;
  selectedSubshell?: string;
  opacity: number;
  onSelect?: (selection: AtomSelection) => void;
}) {
  const { quality } = useSceneEnvironment();
  const targetPoints = quality === 'high' ? 5600 : 1250;
  const total = Math.max(1, shellElectrons.reduce((sum, amount) => sum + amount, 0));
  const layers = useMemo(() => shellElectrons.map((electrons, shell) => ({
    shell,
    geometry: makeCloud(
      shell,
      Math.max(90, Math.round(targetPoints * electrons / total)),
      atomicNumber * 62491 + shell * 99991,
    ),
  })), [atomicNumber, shellElectrons, targetPoints, total]);
  const orbitalKind = selectedSubshell?.match(/^\d+([spdf])/)?.[1];
  const orbital = useMemo(
    () => selectedShell !== null && orbitalKind === 'p'
      ? makePOrbital(selectedShell, quality === 'high' ? 900 : 280, atomicNumber * 6719 + selectedShell)
      : null,
    [atomicNumber, orbitalKind, quality, selectedShell],
  );

  return (
    <group>
      {layers.map(({ shell, geometry }) => (
        <points
          key={`${atomicNumber}-${quality}-${shell}`}
          geometry={geometry}
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.({ kind: 'electron', shell: shell + 1, index: event.index });
          }}
        >
          <pointsMaterial
            color={shell === selectedShell ? '#fff1a7' : shell === 0 ? '#74d5ff' : '#86e7db'}
            size={shell === selectedShell ? 0.065 : 0.043}
            sizeAttenuation
            transparent
            opacity={(selectedShell === null || shell === selectedShell ? 0.68 : 0.18) * opacity}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
      ))}
      {orbital && selectedShell !== null && (
        <points geometry={orbital} onClick={(event) => { event.stopPropagation(); onSelect?.({ kind: 'electron', shell: selectedShell + 1, index: event.index }); }}>
          <pointsMaterial color="#fff0a0" size={0.058} sizeAttenuation transparent opacity={0.85 * opacity} depthWrite={false} blending={AdditiveBlending} />
        </points>
      )}
      {selectedSubshell && <SceneHtml center position={[0, -2.65, 0]} distanceFactor={10}>
        <span className="scene-shell-label">{selectedSubshell} {orbitalKind === 'p' ? 'representative p region' : 'highlighted energy region'}</span>
      </SceneHtml>}
    </group>
  );
}

function FormationParticles({ progress, seed }: { progress: number; seed: number }) {
  const geometry = useMemo(() => {
    const random = seededRandom(seed * 1039 + 97);
    const points = new Float32Array(96 * 3);
    for (let index = 0; index < 96; index += 1) {
      const angle = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const radial = Math.sqrt(1 - z * z);
      const startRadius = 1.45 + random() * 1.8;
      const endRadius = random() * 0.55;
      const radius = startRadius * (1 - progress) + endRadius * progress;
      points[index * 3] = Math.cos(angle) * radial * radius;
      points[index * 3 + 1] = Math.sin(angle) * radial * radius;
      points[index * 3 + 2] = z * radius;
    }
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute(points, 3));
    return result;
  }, [progress, seed]);

  if (progress >= 0.7) return null;
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#a9e7ff" size={0.055} transparent opacity={Math.max(0, 1 - progress / 0.7)} depthWrite={false} blending={AdditiveBlending} />
    </points>
  );
}

function shellRingPoints(radius: number): Point3[] {
  return Array.from({ length: 97 }, (_, index) => {
    const angle = index / 96 * Math.PI * 2;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as const;
  });
}

function ShellModel({
  shells, selectedShell, onSelect,
}: {
  shells: readonly number[];
  selectedShell: number | null;
  onSelect?: (selection: AtomSelection) => void;
}) {
  return (
    <group rotation={[-0.25, 0.25, 0]}>
      {shells.map((amount, shell) => {
        const radius = 1 + shell * 0.72;
        const highlighted = selectedShell === null || selectedShell === shell;
        const labelAngle = [-2.2, 0.75, -0.25][shell % 3] ?? -0.25;
        const labelRadius = radius + 0.18;
        return (
          <group key={shell}>
            <Line points={shellRingPoints(radius)} color={highlighted ? '#73d5ef' : '#547482'} transparent opacity={highlighted ? 0.72 : 0.3} lineWidth={1.5} />
            {Array.from({ length: amount }, (_, index) => {
              const angle = (index / amount) * Math.PI * 2 - Math.PI / 2;
              return (
                <mesh
                  key={index}
                  position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
                  onClick={(event) => { event.stopPropagation(); onSelect?.({ kind: 'electron', shell: shell + 1, index }); }}
                >
                  <sphereGeometry args={[0.095, 12, 10]} />
                  <meshStandardMaterial color={highlighted ? '#b7fff4' : '#598d98'} emissive="#34d9ee" emissiveIntensity={highlighted ? 1 : 0.2} />
                </mesh>
              );
            })}
            <SceneHtml position={[Math.cos(labelAngle) * labelRadius, Math.sin(labelAngle) * labelRadius, 0]} center distanceFactor={10}>
              <span className="scene-shell-label">n={shell + 1}</span>
            </SceneHtml>
          </group>
        );
      })}
    </group>
  );
}

function nucleonPositions(count: number): Point3[] {
  if (count === 1) return [[0, 0, 0]];
  return Array.from({ length: count }, (_, index) => {
    const azimuth = index * 2.3999632297;
    const z = 1 - 2 * (index + 0.5) / count;
    const radial = Math.sqrt(1 - z * z);
    const radius = 0.22 + 0.48 * Math.cbrt((index + 0.5) / count);
    return [
      Math.cos(azimuth) * radial * radius,
      Math.sin(azimuth) * radial * radius,
      z * radius,
    ] as const;
  });
}

function NucleonInstances({
  positions, kind, onSelect,
}: {
  positions: Point3[];
  kind: 'proton' | 'neutron';
  onSelect?: (selection: AtomSelection) => void;
}) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new Object3D();
    positions.forEach((position, index) => {
      dummy.position.set(...position);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  if (positions.length === 0) return null;
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, positions.length]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.({ kind, index: event.instanceId ?? 0 });
      }}
    >
      <sphereGeometry args={[0.17, 16, 12]} />
      <meshStandardMaterial
        color={kind === 'proton' ? '#ff826f' : '#8fbaf5'}
        roughness={0.28}
        metalness={0.15}
        emissive={kind === 'proton' ? '#a83541' : '#2667ab'}
        emissiveIntensity={0.22}
      />
    </instancedMesh>
  );
}

function Nucleus({
  protons, neutrons, enlarged, onSelect,
}: {
  protons: number;
  neutrons: number;
  enlarged: boolean;
  onSelect?: (selection: AtomSelection) => void;
}) {
  const { focusCamera } = useSceneEnvironment();
  const positions = useMemo(() => nucleonPositions(protons + neutrons), [protons, neutrons]);
  const protonPositions = useMemo(() => positions.filter((_, index) => index % 2 === 0).slice(0, protons), [positions, protons]);
  const neutronPositions = useMemo(() => {
    const used = new Set(protonPositions);
    return positions.filter((position) => !used.has(position)).slice(0, neutrons);
  }, [positions, protonPositions, neutrons]);
  // Fill any remainder when the isotope has many more protons than neutrons.
  const finalProtonPositions = useMemo(() => {
    if (protonPositions.length >= protons) return protonPositions;
    const used = new Set([...protonPositions, ...neutronPositions]);
    return [...protonPositions, ...positions.filter((position) => !used.has(position)).slice(0, protons - protonPositions.length)];
  }, [positions, protonPositions, neutronPositions, protons]);
  const select = (selection: AtomSelection) => {
    focusCamera(5.8);
    onSelect?.(selection);
  };

  return (
    <group scale={enlarged ? 2.2 : 1}>
      <mesh onClick={(event) => { event.stopPropagation(); select({ kind: 'nucleus' }); }}>
        <sphereGeometry args={[0.28, 18, 12]} />
        <meshBasicMaterial color="#c7e7ff" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.78, 24, 16]} />
        <meshBasicMaterial color="#80adf1" transparent opacity={0.045} depthWrite={false} />
      </mesh>
      <NucleonInstances positions={finalProtonPositions} kind="proton" onSelect={select} />
      <NucleonInstances positions={neutronPositions} kind="neutron" onSelect={select} />
      {!enlarged && <SceneHtml center position={[0, -0.9, 0]} distanceFactor={9}>
        <button className="scene-focus-chip" type="button" onClick={() => select({ kind: 'nucleus' })}>Inspect nucleus</button>
      </SceneHtml>}
      {enlarged && (
        <>
          <SceneHtml center position={[-0.77, 0.72, 0]} distanceFactor={9}>
            <button className="scene-nucleon-chip scene-nucleon-chip-proton" type="button" onClick={() => select({ kind: 'proton', index: 0 })}>p⁺ proton</button>
          </SceneHtml>
          {neutrons > 0 && <SceneHtml center position={[0.82, 0.72, 0]} distanceFactor={9}>
            <button className="scene-nucleon-chip scene-nucleon-chip-neutron" type="button" onClick={() => select({ kind: 'neutron', index: 0 })}>n⁰ neutron</button>
          </SceneHtml>}
        </>
      )}
    </group>
  );
}

export function AtomScene({
  atomicNumber, massNumber, symbol, shellElectrons, mode = 'cloud', selectedSubshell, formation = 1, onSelect,
}: AtomSceneProps) {
  const { focusCamera } = useSceneEnvironment();
  const sceneSize = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);
  const [initialDistance] = useState(() => camera.position.length());
  const shellKey = shellElectrons.join(',');
  const shells = useMemo(() => shellKey ? shellKey.split(',').map(Number) : [], [shellKey]);
  const selectedShell = selectedSubshell && /^\d+/.test(selectedSubshell)
    ? Number(selectedSubshell.match(/^\d+/)?.[0]) - 1
    : null;
  const neutrons = Math.max(0, massNumber - atomicNumber);
  const phase = Math.max(0, Math.min(1, formation));
  const nucleusReveal = Math.max(0, Math.min(1, (phase - 0.12) / 0.4));
  const electronReveal = Math.max(0, Math.min(1, (phase - 0.5) / 0.5));
  const outerShellRadius = 1 + Math.max(0, shells.length - 1) * 0.72;
  const verticalField = 2 * initialDistance * Math.tan((45 * Math.PI / 180) / 2);
  const horizontalField = verticalField * sceneSize.width / Math.max(1, sceneSize.height);
  const shellFit = Math.min(1, horizontalField / ((outerShellRadius + 0.7) * 2));

  useEffect(() => {
    if (mode === 'nucleus') focusCamera(5.8);
  }, [focusCamera, mode]);

  return (
    <group name={`${symbol}-${massNumber}-atom`}>
      {phase < 0.7 && <FormationParticles progress={phase} seed={atomicNumber} />}
      {mode === 'cloud' && electronReveal > 0 && <ElectronCloud atomicNumber={atomicNumber} shellElectrons={shells} selectedShell={selectedShell} selectedSubshell={selectedSubshell} opacity={electronReveal} onSelect={onSelect} />}
      {mode === 'shell' && electronReveal > 0 && <group scale={Math.max(0.01, electronReveal * shellFit)}><ShellModel shells={shells} selectedShell={selectedShell} onSelect={onSelect} /></group>}
      {nucleusReveal > 0 && <group scale={Math.max(0.01, nucleusReveal)}><Nucleus protons={atomicNumber} neutrons={neutrons} enlarged={mode === 'nucleus'} onSelect={onSelect} /></group>}
    </group>
  );
}
