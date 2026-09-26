import { getElement } from './elements';

export interface IsotopeData {
  id: string;
  atomicNumber: number;
  massNumber: number;
  protons: number;
  neutrons: number;
  /** Electron count for the neutral atom. */
  electrons: number;
  shellArrangement: number[];
  electronConfiguration: string;
  valenceElectrons: number;
  explanation: string;
}

/** Detailed neutral-atom exhibits. Other elements remain selectable in the table. */
export const isotopes: IsotopeData[] = [
  {
    id: 'hydrogen-1', atomicNumber: 1, massNumber: 1,
    protons: 1, neutrons: 0, electrons: 1,
    shellArrangement: [1], electronConfiguration: '1s¹', valenceElectrons: 1,
    explanation: 'Hydrogen-1 has one proton and no neutrons. Its single electron is described by a probability cloud, not a tiny planet-like path.',
  },
  {
    id: 'sodium-23', atomicNumber: 11, massNumber: 23,
    protons: 11, neutrons: 12, electrons: 11,
    shellArrangement: [2, 8, 1], electronConfiguration: '1s² 2s² 2p⁶ 3s¹', valenceElectrons: 1,
    explanation: 'Sodium-23 has 11 protons and 12 neutrons. Its one outer electron can be transferred during ionic bonding.',
  },
  {
    id: 'chlorine-35', atomicNumber: 17, massNumber: 35,
    protons: 17, neutrons: 18, electrons: 17,
    shellArrangement: [2, 8, 7], electronConfiguration: '1s² 2s² 2p⁶ 3s² 3p⁵', valenceElectrons: 7,
    explanation: 'Chlorine-35 has 17 protons and 18 neutrons. Seven electrons occupy its outer shell in the simplified shell model.',
  },
];

export function getIsotope(id: string): IsotopeData | undefined {
  return isotopes.find((isotope) => isotope.id === id);
}

export function getIsotopeForElement(atomicNumber: number): IsotopeData | undefined {
  return isotopes.find((isotope) => isotope.atomicNumber === atomicNumber);
}

export function isotopeLabel(isotope: IsotopeData): string {
  const element = getElement(isotope.atomicNumber);
  return `${element?.name ?? 'Unknown'}-${isotope.massNumber}`;
}
