export type BondType = 'ionic' | 'covalent';

export interface CompoundData {
  id: string;
  name: string;
  formula: string;
  type: BondType;
  /** Element symbols; atom counts come from `parseFormula`. */
  elements: string[];
  explanation: string;
}

/** The builder accepts only these intentional learning examples. */
export const supportedCompounds: CompoundData[] = [
  {
    id: 'sodium-chloride', name: 'Sodium chloride', formula: 'NaCl', type: 'ionic', elements: ['Na', 'Cl'],
    explanation: 'Sodium transfers an electron to chlorine. Na⁺ and Cl⁻ attract; solid sodium chloride forms a repeating ionic lattice, not isolated NaCl molecules.',
  },
  {
    id: 'hydrogen-chloride', name: 'Hydrogen chloride', formula: 'HCl', type: 'covalent', elements: ['H', 'Cl'],
    explanation: 'Hydrogen and chlorine share an electron pair. Chlorine draws the shared pair more strongly, giving partial charges rather than full ionic charges.',
  },
  {
    id: 'hydrogen-molecule', name: 'Hydrogen molecule', formula: 'H2', type: 'covalent', elements: ['H'],
    explanation: 'Two identical hydrogen atoms share one electron pair equally. H₂ is a molecule of an element, not a compound of different elements.',
  },
  {
    id: 'water', name: 'Water', formula: 'H2O', type: 'covalent', elements: ['H', 'O'],
    explanation: 'One oxygen atom shares electron pairs with two hydrogen atoms. The molecule is bent and its bonds are polar.',
  },
  {
    id: 'methane', name: 'Methane', formula: 'CH4', type: 'covalent', elements: ['C', 'H'],
    explanation: 'Carbon shares four electron pairs with four hydrogen atoms, making four covalent bonds.',
  },
  {
    id: 'carbon-dioxide', name: 'Carbon dioxide', formula: 'CO2', type: 'covalent', elements: ['C', 'O'],
    explanation: 'Carbon forms a double covalent bond with each oxygen atom in a linear molecule.',
  },
  {
    id: 'magnesium-oxide', name: 'Magnesium oxide', formula: 'MgO', type: 'ionic', elements: ['Mg', 'O'],
    explanation: 'Magnesium forms Mg²⁺ and oxygen forms O²⁻. Their charges balance in a 1:1 formula unit.',
  },
  {
    id: 'calcium-chloride', name: 'Calcium chloride', formula: 'CaCl2', type: 'ionic', elements: ['Ca', 'Cl'],
    explanation: 'Calcium forms Ca²⁺ and each chlorine forms Cl⁻. Two chloride ions balance one calcium ion.',
  },
];

export function getCompound(idOrFormula: string): CompoundData | undefined {
  return supportedCompounds.find((compound) => compound.id === idOrFormula || compound.formula === idOrFormula);
}
