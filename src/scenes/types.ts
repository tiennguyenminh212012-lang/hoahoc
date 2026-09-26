import type { ReactNode } from 'react';

export type SceneQuality = 'auto' | 'high' | 'low';
export type Point3 = readonly [number, number, number];

export interface SceneViewportProps {
  label: string;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  cameraPosition?: Point3;
  quality?: SceneQuality;
  /** Overrides the operating-system motion preference when supplied. */
  reducedMotion?: boolean;
  onQualityChange?: (quality: SceneQuality) => void;
  showQualitySelector?: boolean;
  showControls?: boolean;
}

export type AtomView = 'cloud' | 'shell' | 'nucleus';
export type AtomSelection =
  | { kind: 'nucleus' }
  | { kind: 'proton' | 'neutron'; index: number }
  | { kind: 'electron'; shell: number; index?: number };

export interface AtomSceneProps {
  atomicNumber: number;
  massNumber: number;
  symbol: string;
  /** Verified shell arrangement for this element; supplied by the chemistry dataset. */
  shellElectrons: readonly number[];
  mode?: AtomView;
  selectedSubshell?: string;
  /** Optional welcome animation phase: 0 = scattered particles, 1 = complete atom. */
  formation?: number;
  onSelect?: (selection: AtomSelection) => void;
}

export type BondingExample = 'nacl' | 'hcl' | 'h2';
export type BondingSelection = {
  kind: 'atom' | 'electron' | 'ion' | 'bond' | 'lattice';
  id: string;
};

export interface BondingSceneProps {
  example: BondingExample;
  step: number;
  onSelect?: (selection: BondingSelection) => void;
}

export interface MoleculeAtom {
  element: string;
  position: Point3;
  radius?: number;
  color?: string;
}

export interface MoleculeBond {
  from: number;
  to: number;
  order?: 1 | 2 | 3;
}

export interface MoleculeModel {
  id: string;
  name: string;
  formula: string;
  atoms: readonly MoleculeAtom[];
  bonds: readonly MoleculeBond[];
}

export type MoleculePreset = 'h2' | 'o2' | 'h2o' | 'hcl' | 'ch4' | 'co2' | 'nh3';

export type MoleculeSelection =
  | { kind: 'atom'; index: number; element: string }
  | { kind: 'bond'; index: number };

export interface MoleculeSceneProps {
  model: MoleculeModel | MoleculePreset;
  showLabels?: boolean;
  onSelect?: (selection: MoleculeSelection) => void;
}

export interface ReactionSpecies {
  formula: string;
  coefficient: number;
  label?: string;
}

export interface ReactionSelection {
  side: 'reactants' | 'products' | 'change-zone';
  formula?: string;
}

export interface ReactionSceneProps {
  reactionId: string;
  reactants: readonly ReactionSpecies[];
  products: readonly ReactionSpecies[];
  /** 0 = reactants, 0.5 = change, 1 = products. */
  progress: number;
  onSelectGroup?: (selection: ReactionSelection) => void;
}
