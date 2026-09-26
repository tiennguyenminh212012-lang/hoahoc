import { Line } from '@react-three/drei';
import { elementAppearance } from '../molecules/MoleculeScene';
import type { Point3 } from '../types';

type AtomTrack = { element: string; from: Point3; to: Point3; color?: string };
type Bond = readonly [number, number];
type Sketch = { atoms: readonly AtomTrack[]; before: readonly Bond[]; after: readonly Bond[]; kind: 'bonds' | 'transfer' | 'ions' };

const waterFormation: Sketch = {
  kind: 'bonds',
  atoms: [
    { element: 'H', from: [-1.08, .69, .1], to: [-.72, .32, .1] },
    { element: 'H', from: [-.78, .69, .1], to: [-.6, .83, .1] },
    { element: 'H', from: [-1.08, -.69, .1], to: [.6, -.83, .1] },
    { element: 'H', from: [-.78, -.69, .1], to: [.72, -.32, .1] },
    { element: 'O', from: [.65, .12, .1], to: [-.38, .57, .1] },
    { element: 'O', from: [1.06, .12, .1], to: [.38, -.57, .1] },
  ],
  before: [[0, 1], [2, 3], [4, 5]],
  after: [[0, 4], [1, 4], [2, 5], [3, 5]],
};

const waterDecomposition: Sketch = {
  kind: 'bonds',
  atoms: waterFormation.atoms.map((atom) => ({ ...atom, from: atom.to, to: atom.from })),
  before: waterFormation.after,
  after: waterFormation.before,
};

const methaneCombustion: Sketch = {
  kind: 'bonds',
  atoms: [
    { element: 'C', from: [-.8, 0, .1], to: [0, 0, .1] },
    { element: 'H', from: [-1.14, .3, .1], to: [-.87, .58, .1] },
    { element: 'H', from: [-1.14, -.3, .1], to: [-.42, 1.03, .1] },
    { element: 'H', from: [-.46, .3, .1], to: [.42, -1.03, .1] },
    { element: 'H', from: [-.46, -.3, .1], to: [.87, -.58, .1] },
    { element: 'O', from: [.65, .77, .1], to: [-.61, 0, .1] },
    { element: 'O', from: [1.1, .77, .1], to: [.61, 0, .1] },
    { element: 'O', from: [.65, -.77, .1], to: [-.59, .76, .1] },
    { element: 'O', from: [1.1, -.77, .1], to: [.59, -.76, .1] },
  ],
  before: [[0, 1], [0, 2], [0, 3], [0, 4], [5, 6], [7, 8]],
  after: [[0, 5], [0, 6], [7, 1], [7, 2], [8, 3], [8, 4]],
};

const zincCopper: Sketch = {
  kind: 'transfer',
  atoms: [
    { element: 'Zn', from: [-.9, -.25, .1], to: [-.75, .35, .1] },
    { element: 'Cu', from: [.9, .25, .1], to: [.75, -.35, .1] },
  ],
  before: [], after: [],
};

const silverChloride: Sketch = {
  kind: 'ions',
  atoms: [
    { element: 'Ag', from: [-.95, .72, .1], to: [-.22, .18, .1] },
    { element: 'Cl', from: [.95, -.72, .1], to: [.22, -.18, .1] },
    { element: 'Na', from: [.95, .72, .1], to: [.98, .86, .1] },
    // The violet token stands for nitrate as an intact spectator ion, not a nitrogen atom.
    { element: 'NO₃⁻', color: '#a790ee', from: [-.95, -.72, .1], to: [-.98, -.86, .1] },
  ],
  before: [], after: [[0, 1]],
};

const sketches: Record<string, Sketch> = {
  'water-synthesis': waterFormation,
  'water-decomposition': waterDecomposition,
  'zinc-copper-replacement': zincCopper,
  'silver-chloride-precipitation': silverChloride,
  'methane-combustion': methaneCombustion,
};

function clamp(value: number): number { return Math.max(0, Math.min(1, value)); }
function smoothstep(start: number, end: number, value: number): number {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
function mix(from: Point3, to: Point3, t: number): [number, number, number] {
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t];
}
function midpoint(a: Point3, b: Point3): [number, number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

/** A conserved set of atom tokens passes through the center as old links break and new ones form. */
export function ReactionTransformation({ reactionId, progress }: { reactionId: string; progress: number }) {
  const sketch = sketches[reactionId];
  if (!sketch) return null;
  const visibility = smoothstep(.14, .3, progress) * (1 - smoothstep(.82, .97, progress));
  if (visibility < .005) return null;
  const rearrange = smoothstep(.28, .74, progress);
  const breakAmount = 1 - smoothstep(.22, .5, progress);
  const formAmount = smoothstep(.48, .78, progress);
  const positions = sketch.atoms.map((atom) => mix(atom.from, atom.to, rearrange));
  const bonds = [
    ...sketch.before.map(([from, to]) => ({ from, to, amount: breakAmount, color: '#a5d7e9' })),
    ...sketch.after.map(([from, to]) => ({ from, to, amount: formAmount, color: sketch.kind === 'ions' ? '#a7e8b3' : '#f5d5b3' })),
  ];
  const transfer = smoothstep(.35, .72, progress);
  const transferVisible = sketch.kind === 'transfer' && progress > .27 && progress < .84;
  const sharedDensityVisible = sketch.kind === 'bonds' && progress > .28 && progress < .8;
  const densityMotion = smoothstep(.31, .76, progress);
  const electronSources = sketch.before.map(([from, to]) => midpoint(sketch.atoms[from]!.from, sketch.atoms[to]!.from));

  return <group position={[0, 0, .35]}>
    {bonds.map(({ from, to, amount, color }, index) => {
      if (amount < .01) return null;
      const a = positions[from]!;
      const b = positions[to]!;
      const center = midpoint(a, b);
      return <Line key={`${from}-${to}-${index}`} points={[mix(center, a, amount), mix(center, b, amount)]} color={color} lineWidth={sketch.kind === 'ions' ? 2 : 3} dashed={sketch.kind === 'ions'} transparent opacity={visibility * amount * .88} />;
    })}
    {positions.map((position, index) => {
      const atom = sketch.atoms[index]!;
      const appearance = elementAppearance(atom.element);
      return <mesh key={`${atom.element}-${index}`} position={position}>
        <sphereGeometry args={[Math.max(.16, appearance.radius * .74), 16, 12]} />
        <meshStandardMaterial color={atom.color || appearance.color} emissive={atom.color || appearance.color} emissiveIntensity={.18} roughness={.35} transparent opacity={visibility} depthWrite={false} />
      </mesh>;
    })}
    {sharedDensityVisible && sketch.after.map(([from, to], index) => {
      const source = electronSources[index % electronSources.length]!;
      const destination = midpoint(sketch.atoms[from]!.to, sketch.atoms[to]!.to);
      const position = mix(source, destination, densityMotion);
      return <mesh key={`density-${index}`} position={[position[0], position[1], .55]}>
        <sphereGeometry args={[.07, 10, 8]} />
        <meshBasicMaterial color="#58dbff" transparent opacity={visibility * Math.sin(densityMotion * Math.PI) * .95} depthWrite={false} />
      </mesh>;
    })}
    {transferVisible && [0, 1].map((index) => {
      const origin: Point3 = [-.78, index === 0 ? -.1 : -.4, .34];
      const destination: Point3 = [.78, index === 0 ? .4 : .1, .34];
      const position = mix(origin, destination, transfer);
      return <mesh key={index} position={[position[0], position[1] + Math.sin(transfer * Math.PI) * (index === 0 ? .32 : -.32), position[2]]}>
        <sphereGeometry args={[.12, 12, 9]} />
        <meshBasicMaterial color="#58dbff" transparent opacity={visibility * Math.sin(transfer * Math.PI) * .95} depthWrite={false} />
      </mesh>;
    })}
  </group>;
}
