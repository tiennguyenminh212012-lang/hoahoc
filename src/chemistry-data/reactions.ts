export type ReactionType = 'synthesis' | 'decomposition' | 'single-replacement' | 'double-replacement' | 'combustion';

export interface SpeciesCoefficient {
  formula: string;
  coefficient: number;
}

export interface ReactionData {
  id: string;
  type: ReactionType;
  name: string;
  reactants: SpeciesCoefficient[];
  products: SpeciesCoefficient[];
  explanation: string;
}

/** All five required examples use the balanced coefficients. */
export const reactions: ReactionData[] = [
  {
    id: 'water-synthesis', type: 'synthesis', name: 'Forming water',
    reactants: [{ formula: 'H2', coefficient: 2 }, { formula: 'O2', coefficient: 1 }],
    products: [{ formula: 'H2O', coefficient: 2 }],
    explanation: 'Hydrogen and oxygen react to make water. Atoms rearrange into new bonds; the nuclei keep their identities.',
  },
  {
    id: 'water-decomposition', type: 'decomposition', name: 'Splitting water',
    reactants: [{ formula: 'H2O', coefficient: 2 }],
    products: [{ formula: 'H2', coefficient: 2 }, { formula: 'O2', coefficient: 1 }],
    explanation: 'Water can be decomposed into hydrogen and oxygen. The same H and O atoms appear on both sides.',
  },
  {
    id: 'zinc-copper-replacement', type: 'single-replacement', name: 'Zinc replaces copper',
    reactants: [{ formula: 'Zn', coefficient: 1 }, { formula: 'CuSO4', coefficient: 1 }],
    products: [{ formula: 'ZnSO4', coefficient: 1 }, { formula: 'Cu', coefficient: 1 }],
    explanation: 'Zinc takes copper’s place in copper(II) sulfate. The sulfate group stays together while the metal changes.',
  },
  {
    id: 'silver-chloride-precipitation', type: 'double-replacement', name: 'Forming silver chloride',
    reactants: [{ formula: 'AgNO3', coefficient: 1 }, { formula: 'NaCl', coefficient: 1 }],
    products: [{ formula: 'AgCl', coefficient: 1 }, { formula: 'NaNO3', coefficient: 1 }],
    explanation: 'The ions exchange partners. Insoluble silver chloride forms while sodium nitrate remains in solution.',
  },
  {
    id: 'methane-combustion', type: 'combustion', name: 'Burning methane',
    reactants: [{ formula: 'CH4', coefficient: 1 }, { formula: 'O2', coefficient: 2 }],
    products: [{ formula: 'CO2', coefficient: 1 }, { formula: 'H2O', coefficient: 2 }],
    explanation: 'Methane reacts with oxygen to form carbon dioxide and water. The coefficients conserve every C, H, and O atom.',
  },
];

export function getReaction(id: string): ReactionData | undefined {
  return reactions.find((reaction) => reaction.id === id);
}
