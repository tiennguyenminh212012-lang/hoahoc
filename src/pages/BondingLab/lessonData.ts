export type BondExample = 'nacl' | 'hcl' | 'h2';
export type BondMode = 'ionic' | 'covalent';

export interface BondStep {
  title: string;
  explanation: string;
  modelLabel: string;
  formula: string;
  whatChanged: string;
}

export const bondLessons: Record<BondExample, { title: string; mode: BondMode; formula: string; steps: BondStep[] }> = {
  nacl: {
    title: 'Sodium + chlorine', mode: 'ionic', formula: 'NaCl', steps: [
      { title: 'Two neutral atoms', explanation: 'Sodium has 2, 8, 1 electrons across its simplified shells. Chlorine has 2, 8, 7. Each atom is neutral because it has the same number of protons and electrons.', modelLabel: 'Na (2, 8, 1)     Cl (2, 8, 7)', formula: 'Na + Cl', whatChanged: 'Nothing yet. Both atoms are neutral.' },
      { title: 'Look at the outer electrons', explanation: 'Sodium has one outer electron. Chlorine needs one more electron to complete its outer shell in this simple model.', modelLabel: 'Na: 1 outer electron     Cl: 7 outer electrons', formula: 'Na + Cl', whatChanged: 'The outer electron arrangements are highlighted.' },
      { title: 'Transfer an electron', explanation: 'Move sodium’s outer electron to chlorine. Use the transfer button or drag the highlighted electron into chlorine’s drop area.', modelLabel: 'Transfer the highlighted electron →', formula: 'Na + Cl', whatChanged: 'The atoms remain neutral until the electron moves.' },
      { title: 'Electron in motion', explanation: 'The electron leaves sodium and arrives at chlorine. This is electron transfer, the key change in this ionic example.', modelLabel: 'Na electron → Cl', formula: 'Na + Cl', whatChanged: 'One electron moves from sodium to chlorine.' },
      { title: 'Opposite ions form', explanation: 'Sodium has lost an electron and is now Na⁺. Chlorine has gained it and is now Cl⁻. These are full electrical charges.', modelLabel: 'Na⁺      Cl⁻', formula: 'Na⁺ + Cl⁻', whatChanged: 'Na lost one electron; Cl gained one electron.' },
      { title: 'Attraction holds ions together', explanation: 'The positive and negative ions attract through electrostatic force. The attraction acts in every direction around the ions.', modelLabel: 'Na⁺ ↔ Cl⁻', formula: 'Na⁺ + Cl⁻', whatChanged: 'Opposite charges now attract.' },
      { title: 'A repeating solid lattice', explanation: 'In solid sodium chloride, many Na⁺ and Cl⁻ ions form an alternating three-dimensional lattice. NaCl is a formula unit, not one isolated molecule.', modelLabel: '… Na⁺ Cl⁻ Na⁺ Cl⁻ …', formula: 'NaCl', whatChanged: 'The view expands from one transfer to the repeating ionic solid.' },
    ],
  },
  hcl: {
    title: 'Hydrogen + chlorine', mode: 'covalent', formula: 'HCl', steps: [
      { title: 'Two neutral atoms', explanation: 'Hydrogen has one electron; chlorine has seven outer electrons. They begin as separate neutral atoms.', modelLabel: 'H      Cl', formula: 'H + Cl', whatChanged: 'The atoms are separate.' },
      { title: 'Show the valence electrons', explanation: 'The electrons in the outer region are the ones involved in bonding. Hydrogen contributes one, and chlorine contributes one to a shared pair.', modelLabel: 'H·      ·Cl', formula: 'H + Cl', whatChanged: 'The bonding electrons are highlighted.' },
      { title: 'Bring atoms closer', explanation: 'As the atoms approach, each nucleus attracts the shared electrons. Their electron regions begin to overlap.', modelLabel: 'H   Cl', formula: 'H + Cl', whatChanged: 'The atoms move close enough to share electrons.' },
      { title: 'A shared pair forms', explanation: 'The two bonding electrons occupy a shared region between hydrogen and chlorine. No whole electron transfers from one atom to the other.', modelLabel: 'H : Cl', formula: 'HCl', whatChanged: 'A shared electron pair forms.' },
      { title: 'Inspect the shared region', explanation: 'The shared pair helps hold the atoms together. This model highlights the bonding region rather than showing electrons on fixed paths.', modelLabel: 'H [shared pair] Cl', formula: 'HCl', whatChanged: 'The shared region is highlighted.' },
      { title: 'Name the bond', explanation: 'Sharing electrons creates a covalent bond. HCl is a molecule with one covalent bond between hydrogen and chlorine.', modelLabel: 'H—Cl', formula: 'HCl', whatChanged: 'The connection is identified as a covalent bond.' },
      { title: 'The sharing is unequal', explanation: 'Chlorine attracts the shared electrons more strongly, so H is partially positive and Cl is partially negative: Hδ⁺—Clδ⁻. These partial charges are not full ionic charges.', modelLabel: 'Hδ⁺—Clδ⁻', formula: 'HCl', whatChanged: 'Polarity is revealed. The electron pair is shared unequally.' },
    ],
  },
  h2: {
    title: 'Hydrogen + hydrogen', mode: 'covalent', formula: 'H2', steps: [
      { title: 'Two identical atoms', explanation: 'Each hydrogen atom contributes one electron. The two atoms are the same element.', modelLabel: 'H      H', formula: 'H + H', whatChanged: 'The atoms are separate.' },
      { title: 'They approach', explanation: 'The atoms move close enough for their electron regions to overlap.', modelLabel: 'H   H', formula: 'H + H', whatChanged: 'The atoms approach one another.' },
      { title: 'A shared pair', explanation: 'The atoms share a pair of electrons in a covalent bond.', modelLabel: 'H : H', formula: 'H2', whatChanged: 'A shared pair forms.' },
      { title: 'Equal sharing', explanation: 'Because the two hydrogen atoms attract electrons equally, the shared pair is distributed evenly. H₂ does not have the bond polarity shown in HCl.', modelLabel: 'H—H', formula: 'H2', whatChanged: 'The equal-sharing relationship is clear.' },
    ],
  },
};
