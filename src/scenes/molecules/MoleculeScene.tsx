import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Quaternion, Vector3, type Group } from 'three';
import type {
  MoleculeAtom,
  MoleculeBond,
  MoleculeModel,
  MoleculePreset,
  MoleculeSceneProps,
  MoleculeSelection,
  Point3,
} from '../types';
import { SceneHtml, useSceneEnvironment } from '../shared/SceneViewport';

const PALETTE: Record<string, { color: string; radius: number }> = {
  H: { color: '#ecf8ff', radius: 0.24 },
  C: { color: '#53677c', radius: 0.43 },
  N: { color: '#65aef5', radius: 0.4 },
  O: { color: '#fa746d', radius: 0.4 },
  Cl: { color: '#8fe0a6', radius: 0.52 },
  Na: { color: '#ffcc85', radius: 0.5 },
  S: { color: '#f8d66d', radius: 0.48 },
  Zn: { color: '#aebbd0', radius: 0.5 },
  Cu: { color: '#df9a75', radius: 0.5 },
  Ag: { color: '#c7dbec', radius: 0.5 },
};

export function elementAppearance(element: string) {
  return PALETTE[element] || { color: '#b9dcef', radius: 0.42 };
}

export const MOLECULE_PRESETS: Record<MoleculePreset, MoleculeModel> = {
  h2: {
    id: 'h2', name: 'Hydrogen', formula: 'H₂',
    atoms: [{ element: 'H', position: [-0.45, 0, 0] }, { element: 'H', position: [0.45, 0, 0] }],
    bonds: [{ from: 0, to: 1 }],
  },
  o2: {
    id: 'o2', name: 'Oxygen', formula: 'O₂',
    atoms: [{ element: 'O', position: [-0.65, 0, 0] }, { element: 'O', position: [0.65, 0, 0] }],
    bonds: [{ from: 0, to: 1, order: 2 }],
  },
  h2o: {
    id: 'h2o', name: 'Water', formula: 'H₂O',
    atoms: [
      { element: 'O', position: [0, 0.28, 0] },
      { element: 'H', position: [-0.76, -0.34, 0] },
      { element: 'H', position: [0.76, -0.34, 0] },
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }],
  },
  hcl: {
    id: 'hcl', name: 'Hydrogen chloride', formula: 'HCl',
    atoms: [{ element: 'H', position: [-0.68, 0, 0] }, { element: 'Cl', position: [0.68, 0, 0] }],
    bonds: [{ from: 0, to: 1 }],
  },
  ch4: {
    id: 'ch4', name: 'Methane', formula: 'CH₄',
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'H', position: [0.79, 0.79, 0.79] },
      { element: 'H', position: [-0.79, -0.79, 0.79] },
      { element: 'H', position: [-0.79, 0.79, -0.79] },
      { element: 'H', position: [0.79, -0.79, -0.79] },
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4 }],
  },
  co2: {
    id: 'co2', name: 'Carbon dioxide', formula: 'CO₂',
    atoms: [
      { element: 'O', position: [-1.23, 0, 0] },
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [1.23, 0, 0] },
    ],
    bonds: [{ from: 0, to: 1, order: 2 }, { from: 1, to: 2, order: 2 }],
  },
  nh3: {
    id: 'nh3', name: 'Ammonia', formula: 'NH₃',
    atoms: [
      { element: 'N', position: [0, 0.35, 0] },
      { element: 'H', position: [-0.88, -0.3, 0.38] },
      { element: 'H', position: [0.88, -0.3, 0.38] },
      { element: 'H', position: [0, -0.3, -0.94] },
    ],
    bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }],
  },
};

function AtomBall({
  atom, onClick, showLabel,
}: {
  atom: MoleculeAtom;
  onClick?: () => void;
  showLabel: boolean;
}) {
  const appearance = elementAppearance(atom.element);
  const radius = atom.radius ?? appearance.radius;
  return (
    <group position={[...atom.position]}>
      <mesh onClick={(event) => { event.stopPropagation(); onClick?.(); }} castShadow receiveShadow>
        <sphereGeometry args={[radius, 24, 16]} />
        <meshStandardMaterial color={atom.color || appearance.color} roughness={0.38} metalness={0.18} emissive={atom.color || appearance.color} emissiveIntensity={0.13} />
      </mesh>
      {showLabel && <SceneHtml center distanceFactor={9} position={[0, radius + 0.24, 0]}><span className="scene-atom-label">{atom.element}</span></SceneHtml>}
    </group>
  );
}

function BondRod({
  from, to, order = 1, onClick,
}: {
  from: Point3;
  to: Point3;
  order?: 1 | 2 | 3;
  onClick?: () => void;
}) {
  const { midpoint, rotation, length } = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    return {
      midpoint: start.add(end).multiplyScalar(0.5),
      rotation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()),
      length: direction.length(),
    };
  }, [from, to]);
  const offsets = order === 3 ? [-0.13, 0, 0.13] : order === 2 ? [-0.095, 0.095] : [0];

  return (
    <group position={midpoint} quaternion={rotation}>
      {offsets.map((offset) => (
        <mesh key={offset} position={[offset, 0, 0]} onClick={(event) => { event.stopPropagation(); onClick?.(); }}>
          <cylinderGeometry args={[0.055, 0.055, length, 10]} />
          <meshStandardMaterial color="#91b9ce" roughness={0.5} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export function MoleculeGeometry({
  model, showLabels = false, onSelect,
}: {
  model: MoleculeModel;
  showLabels?: boolean;
  onSelect?: (selection: MoleculeSelection) => void;
}) {
  return (
    <group>
      {model.bonds.map((bond: MoleculeBond, index) => {
        const from = model.atoms[bond.from];
        const to = model.atoms[bond.to];
        if (!from || !to) return null;
        return <BondRod
          key={`${bond.from}-${bond.to}-${index}`}
          from={from.position}
          to={to.position}
          order={bond.order}
          onClick={() => onSelect?.({ kind: 'bond', index })}
        />;
      })}
      {model.atoms.map((atom, index) => (
        <AtomBall
          key={`${atom.element}-${index}`}
          atom={atom}
          showLabel={showLabels}
          onClick={() => onSelect?.({ kind: 'atom', index, element: atom.element })}
        />
      ))}
    </group>
  );
}

export function MoleculeScene({ model, showLabels = true, onSelect }: MoleculeSceneProps) {
  const resolved = typeof model === 'string' ? MOLECULE_PRESETS[model] : model;
  const group = useRef<Group>(null);
  const { reducedMotion } = useSceneEnvironment();
  useFrame((_state, delta) => {
    if (group.current && !reducedMotion) group.current.rotation.y += Math.min(delta, 0.05) * 0.13;
  });

  return (
    <group ref={group}>
      <MoleculeGeometry model={resolved} showLabels={showLabels} onSelect={onSelect} />
    </group>
  );
}
