import { Line } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';
import type { BondingSceneProps, BondingSelection, Point3 } from '../types';
import { SceneHtml, useSceneEnvironment } from '../shared/SceneViewport';

function Particle({
  position, color, radius = 0.1, emissive = 0.4, onClick,
}: {
  position: Point3;
  color: string;
  radius?: number;
  emissive?: number;
  onClick?: () => void;
}) {
  return (
    <mesh position={[...position]} onClick={(event) => { event.stopPropagation(); onClick?.(); }} castShadow>
      <sphereGeometry args={[radius, 18, 14]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.3} />
    </mesh>
  );
}

function ElementSphere({
  position, symbol, color, radius, onClick,
}: {
  position: Point3;
  symbol: string;
  color: string;
  radius: number;
  onClick: () => void;
}) {
  return (
    <group position={[...position]}>
      <Particle position={[0, 0, 0]} color={color} radius={radius} emissive={0.16} onClick={onClick} />
      <SceneHtml center position={[0, radius + 0.3, 0]} distanceFactor={9}>
        <span className="scene-atom-label">{symbol}</span>
      </SceneHtml>
    </group>
  );
}

function ValenceDots({
  center, count, radius, color, offset = 0, onSelect,
}: {
  center: Point3;
  count: number;
  radius: number;
  color: string;
  offset?: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const angle = offset + index / Math.max(1, count) * Math.PI * 2;
        return (
          <Particle
            key={index}
            position={[center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, 0.14]}
            color={color}
            radius={0.09}
            emissive={0.7}
            onClick={() => onSelect?.(index)}
          />
        );
      })}
    </group>
  );
}

function IonicLattice({ onSelect }: { onSelect?: (selection: BondingSelection) => void }) {
  const { quality } = useSceneEnvironment();
  const mesh = useRef<InstancedMesh>(null);
  const columns = quality === 'high' ? 5 : 4;
  const rows = quality === 'high' ? 5 : 4;
  const layers = quality === 'high' ? 3 : 2;
  const cells = useMemo(() => {
    const output: { position: Point3; sodium: boolean }[] = [];
    for (let z = 0; z < layers; z += 1) {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          output.push({
            position: [(x - (columns - 1) / 2) * 0.9, (y - (rows - 1) / 2) * 0.9, (z - (layers - 1) / 2) * 0.9],
            sodium: (x + y + z) % 2 === 0,
          });
        }
      }
    }
    return output;
  }, [columns, rows, layers]);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new Object3D();
    cells.forEach((cell, index) => {
      dummy.position.set(...cell.position);
      dummy.scale.setScalar(cell.sodium ? 0.75 : 1.03);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
      mesh.current?.setColorAt(index, new Color(cell.sodium ? '#ffc987' : '#88e0ae'));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [cells]);

  return (
    <group rotation={[-0.28, 0.38, 0]}>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, cells.length]}
        onClick={(event) => {
          event.stopPropagation();
          const cell = cells[event.instanceId ?? 0];
          if (cell) onSelect?.({ kind: 'lattice', id: cell.sodium ? 'sodium-ion' : 'chloride-ion' });
        }}
      >
        <sphereGeometry args={[0.35, 16, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.37} metalness={0.12} />
      </instancedMesh>
      <SceneHtml center position={[0, -2.35, 0]} distanceFactor={9}>
        <span className="scene-ion-label">Repeating Na⁺ / Cl⁻ ionic lattice</span>
      </SceneHtml>
    </group>
  );
}

function IonicBonding({ step, onSelect }: Pick<BondingSceneProps, 'step' | 'onSelect'>) {
  if (step >= 6) return <IonicLattice onSelect={onSelect} />;

  const close = step >= 5;
  const sodiumX = close ? -1.15 : -1.75;
  const chlorineX = close ? 1.15 : 1.75;
  const transferred = step >= 4;
  const moving = step === 3;
  const electronX = moving ? 0 : transferred ? chlorineX + 0.84 : sodiumX + 0.76;
  const sodiumLabel = transferred ? 'Na⁺' : 'Na';
  const chlorineLabel = transferred ? 'Cl⁻' : 'Cl';

  return (
    <group>
      {step >= 5 && <Line points={[[sodiumX + 0.45, 0, 0], [chlorineX - 0.58, 0, 0]]} color="#c6eafa" transparent opacity={0.68} lineWidth={2} />}
      <ElementSphere
        position={[sodiumX, 0, 0]}
        symbol={sodiumLabel}
        color="#ffc489"
        radius={0.43}
        onClick={() => onSelect?.({ kind: transferred ? 'ion' : 'atom', id: 'sodium' })}
      />
      <ElementSphere
        position={[chlorineX, 0, 0]}
        symbol={chlorineLabel}
        color="#8de0ac"
        radius={0.55}
        onClick={() => onSelect?.({ kind: transferred ? 'ion' : 'atom', id: 'chlorine' })}
      />
      {step >= 1 && (
        <>
          <ValenceDots
            center={[chlorineX, 0, 0]}
            count={7}
            radius={0.84}
            color="#97e9f8"
            offset={Math.PI / 7}
            onSelect={(index) => onSelect?.({ kind: 'electron', id: `chlorine-${index}` })}
          />
          <Particle
            position={[electronX, moving ? 0.28 : 0, 0.22]}
            color={moving ? '#ffe6a1' : '#91e8f7'}
            radius={moving ? 0.14 : 0.1}
            emissive={0.9}
            onClick={() => onSelect?.({ kind: 'electron', id: 'transferred-electron' })}
          />
        </>
      )}
      {step >= 5 && <SceneHtml center position={[0, -0.6, 0]} distanceFactor={10}>
        <span className="scene-ion-label">Opposite charges attract</span>
      </SceneHtml>}
    </group>
  );
}

function CovalentBonding({ example, step, onSelect }: BondingSceneProps) {
  const polar = example === 'hcl';
  const bonded = step >= (polar ? 3 : 2);
  const close = step >= (polar ? 2 : 1);
  const leftX = close ? -0.74 : -1.75;
  const rightX = close ? 0.74 : 1.75;
  const rightSymbol = polar ? 'Cl' : 'H';
  const rightRadius = polar ? 0.58 : 0.37;
  const rightColor = polar ? '#8de0ac' : '#ecf8ff';
  const leftSymbol = polar && step >= 6 ? 'Hδ⁺' : 'H';
  const rightLabel = polar && step >= 6 ? 'Clδ⁻' : rightSymbol;

  return (
    <group>
      {bonded && (
        <Line
          points={[[leftX + 0.22, 0, 0], [rightX - rightRadius * 0.58, 0, 0]]}
          color="#b8dce9"
          lineWidth={3}
          onClick={(event) => { event.stopPropagation(); onSelect?.({ kind: 'bond', id: example }); }}
        />
      )}
      <ElementSphere
        position={[leftX, 0, 0]}
        symbol={leftSymbol}
        color="#edf8ff"
        radius={0.37}
        onClick={() => onSelect?.({ kind: 'atom', id: 'hydrogen-left' })}
      />
      <ElementSphere
        position={[rightX, 0, 0]}
        symbol={rightLabel}
        color={rightColor}
        radius={rightRadius}
        onClick={() => onSelect?.({ kind: 'atom', id: polar ? 'chlorine' : 'hydrogen-right' })}
      />
      {step >= 1 && !bonded && (
        <>
          <Particle position={[leftX + 0.65, 0.15, 0.1]} color="#9fe5f4" onClick={() => onSelect?.({ kind: 'electron', id: 'hydrogen-valence' })} />
          {polar ? (
            <ValenceDots center={[rightX, 0, 0]} count={7} radius={0.86} color="#9fe5f4" offset={Math.PI / 7} onSelect={(index) => onSelect?.({ kind: 'electron', id: `chlorine-${index}` })} />
          ) : (
            <Particle position={[rightX - 0.65, -0.15, 0.1]} color="#9fe5f4" onClick={() => onSelect?.({ kind: 'electron', id: 'hydrogen-right-valence' })} />
          )}
        </>
      )}
      {bonded && (
        <>
          <Particle position={[-0.13, 0.19, 0.28]} color="#c8f8ff" radius={0.11} onClick={() => onSelect?.({ kind: 'electron', id: 'shared-pair-1' })} />
          <Particle position={[0.13, -0.19, 0.28]} color="#c8f8ff" radius={0.11} onClick={() => onSelect?.({ kind: 'electron', id: 'shared-pair-2' })} />
          {polar && <ValenceDots center={[rightX, 0, 0]} count={6} radius={0.9} color="#9fe5f4" offset={0.3} onSelect={(index) => onSelect?.({ kind: 'electron', id: `chlorine-lone-${index}` })} />}
        </>
      )}
      {step >= (polar ? 6 : 3) && <SceneHtml center position={[0, -1.2, 0]} distanceFactor={10}>
        <span className="scene-ion-label">{polar ? 'Unequal sharing: polar bond' : 'Equal sharing: nonpolar bond'}</span>
      </SceneHtml>}
    </group>
  );
}

export function BondingScene({ example, step, onSelect }: BondingSceneProps) {
  return example === 'nacl'
    ? <IonicBonding step={step} onSelect={onSelect} />
    : <CovalentBonding example={example} step={step} onSelect={onSelect} />;
}
