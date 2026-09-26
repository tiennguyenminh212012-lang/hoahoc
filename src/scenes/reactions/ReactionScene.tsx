import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { type Group } from 'three';
import type { MoleculePreset, ReactionSceneProps, ReactionSpecies, ReactionSelection } from '../types';
import { SceneHtml, useSceneEnvironment } from '../shared/SceneViewport';
import { elementAppearance, MOLECULE_PRESETS, MoleculeGeometry } from '../molecules/MoleculeScene';
import { ReactionTransformation } from './ReactionTransformation';

const MOLECULE_FOR_FORMULA: Record<string, MoleculePreset> = {
  H2: 'h2', O2: 'o2', H2O: 'h2o', HCl: 'hcl', CH4: 'ch4', CO2: 'co2', NH3: 'nh3',
};

const SUBSCRIPT_MAP: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
const DISPLAY_SUBSCRIPT = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

function normalizeFormula(formula: string): string {
  return formula.replace(/[₀-₉]/g, (digit) => SUBSCRIPT_MAP[digit] || digit).replace(/\s/g, '');
}

function displayFormula(formula: string): string {
  return formula.replace(/[0-9]/g, (digit) => DISPLAY_SUBSCRIPT[Number(digit)] || digit);
}

function FormulaActor({ formula, onSelect }: { formula: string; onSelect: () => void }) {
  const normalized = normalizeFormula(formula);
  const preset = MOLECULE_FOR_FORMULA[normalized];
  if (preset) {
    return <group scale={0.55}>
      <MoleculeGeometry model={MOLECULE_PRESETS[preset]} onSelect={onSelect} />
    </group>;
  }

  const monatomic = /^[A-Z][a-z]?$/.test(normalized);
  if (monatomic) {
    const appearance = elementAppearance(normalized);
    return (
      <mesh onClick={(event) => { event.stopPropagation(); onSelect(); }} castShadow>
        <sphereGeometry args={[appearance.radius * 0.85, 20, 16]} />
        <meshStandardMaterial color={appearance.color} roughness={0.33} metalness={0.22} emissive={appearance.color} emissiveIntensity={0.12} />
      </mesh>
    );
  }

  // For salts and polyatomic formula units, a labeled symbol avoids inventing a molecular geometry.
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh castShadow>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#86c9da" transparent opacity={0.52} roughness={0.3} metalness={0.22} />
      </mesh>
      <mesh scale={1.12}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshBasicMaterial color="#9ddfea" wireframe transparent opacity={0.56} />
      </mesh>
    </group>
  );
}

function SpeciesGroup({
  species, side, groupIndex, speciesCount, x, scale, onSelect,
}: {
  species: ReactionSpecies;
  side: 'reactants' | 'products';
  groupIndex: number;
  speciesCount: number;
  x: number;
  scale: number;
  onSelect?: (selection: ReactionSelection) => void;
}) {
  const y = speciesCount === 1 ? 0 : (speciesCount - 1) * 0.85 - groupIndex * 1.7;
  const copies = Math.max(1, Math.min(8, Math.round(species.coefficient)));
  const label = `${species.coefficient > 1 ? `${species.coefficient} × ` : ''}${displayFormula(species.formula)}`;
  if (scale <= 0.005) return null;
  return (
    <>
      <group position={[x, y, 0]} scale={scale}>
        {Array.from({ length: copies }, (_, index) => {
          const horizontal = copies === 1 ? 0 : (index - (copies - 1) / 2) * 0.83;
          return (
            <group key={index} position={[horizontal, 0, 0]}>
              <FormulaActor formula={species.formula} onSelect={() => onSelect?.({ side, formula: species.formula })} />
            </group>
          );
        })}
      </group>
      {scale > .42 && <SceneHtml center position={[x, y - 0.82, 0]} distanceFactor={8}>
        <span className="scene-formula-label">{species.label || label}</span>
      </SceneHtml>}
    </>
  );
}

function ChangeZone({ progress, onSelect }: { progress: number; onSelect?: (selection: ReactionSelection) => void }) {
  const ring = useRef<Group>(null);
  const { reducedMotion } = useSceneEnvironment();
  useFrame((_state, delta) => {
    if (ring.current && !reducedMotion) ring.current.rotation.z += Math.min(delta, 0.06) * (0.08 + progress * 0.18);
  });
  return (
    <group position={[0, 0, 0]}>
      <group ref={ring}>
        <mesh onClick={(event) => { event.stopPropagation(); onSelect?.({ side: 'change-zone' }); }}>
          <torusGeometry args={[0.68, 0.045, 8, 64]} />
          <meshBasicMaterial color="#84e0e7" transparent opacity={0.48 + Math.sin(progress * Math.PI) * 0.35} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.86, 0.018, 6, 64]} />
          <meshBasicMaterial color="#8dc2e3" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function smoothstep(start: number, end: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function ReactionScene({ reactionId, reactants, products, progress, onSelectGroup }: ReactionSceneProps) {
  const sceneSize = useThree((state) => state.size);
  const aspect = sceneSize.width / Math.max(1, sceneSize.height);
  const fitScale = Math.min(1, Math.max(0.45, 6.21 * aspect / 9.8));
  const { reducedMotion } = useSceneEnvironment();
  const targetProgress = Math.max(0, Math.min(1, progress));
  const [displayProgress, setDisplayProgress] = useState(targetProgress);
  useEffect(() => {
    if (reducedMotion) setDisplayProgress(targetProgress);
  }, [reducedMotion, targetProgress]);
  useFrame((_state, delta) => {
    if (reducedMotion) return;
    setDisplayProgress((current) => {
      const difference = targetProgress - current;
      if (Math.abs(difference) < 0.003) return targetProgress;
      return current + difference * (1 - Math.exp(-Math.min(delta, 0.05) * 5));
    });
  });
  const t = displayProgress;
  const approach = Math.min(1, t / 0.5);
  const release = Math.max(0, Math.min(1, (t - 0.5) / 0.5));
  const reactantScale = 1 - smoothstep(.19, .49, t);
  const productScale = smoothstep(.58, .88, t);
  const reactantX = -2.65 + approach * 2.14;
  const productX = .5 + release * 2.15;
  const containsSymbolicFormulaUnits = [...reactants, ...products].some(({ formula }) => {
    const normalized = normalizeFormula(formula);
    return !MOLECULE_FOR_FORMULA[normalized] && !/^[A-Z][a-z]?$/.test(normalized);
  });

  return (
    <group scale={fitScale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 0]} receiveShadow>
        <planeGeometry args={[9.2, 3.2]} />
        <meshStandardMaterial color="#0d2a40" roughness={0.78} metalness={0.12} transparent opacity={0.82} />
      </mesh>
      <Line points={[[-4.4, -1.39, 1.15], [4.4, -1.39, 1.15]]} color="#3c829e" transparent opacity={0.5} />
      <Line points={[[-4.4, -1.39, -1.15], [4.4, -1.39, -1.15]]} color="#3c829e" transparent opacity={0.5} />
      <ChangeZone progress={t} onSelect={onSelectGroup} />
      <ReactionTransformation reactionId={reactionId} progress={t} />
      {reactants.map((species, index) => (
        <SpeciesGroup
          key={`r-${species.formula}-${index}`}
          species={species}
          side="reactants"
          groupIndex={index}
          speciesCount={reactants.length}
          x={reactantX}
          scale={reactantScale}
          onSelect={onSelectGroup}
        />
      ))}
      {products.map((species, index) => (
        <SpeciesGroup
          key={`p-${species.formula}-${index}`}
          species={species}
          side="products"
          groupIndex={index}
          speciesCount={products.length}
          x={productX}
          scale={productScale}
          onSelect={onSelectGroup}
        />
      ))}
      {sceneSize.width >= 520 && <>
        <SceneHtml center position={[-2.65, 2.02, 0]} distanceFactor={10}><span className="scene-formula-label">Reactants</span></SceneHtml>
        <SceneHtml center position={[0, 2.02, 0]} distanceFactor={10}><span className="scene-formula-label">Change zone</span></SceneHtml>
        <SceneHtml center position={[2.65, 2.02, 0]} distanceFactor={10}><span className="scene-formula-label">Products</span></SceneHtml>
      </>}
      {containsSymbolicFormulaUnits && <SceneHtml center position={[0, -2.08, 0]} distanceFactor={10}>
        <span className="scene-shell-label">Formula tokens show composition, not molecular geometry</span>
      </SceneHtml>}
    </group>
  );
}
