export const valenceElectrons: Record<string, number> = {
  H: 1, C: 4, O: 6, Na: 1, Mg: 2, Cl: 7, Ca: 2,
};

export const ionicProducts: Record<string, string> = {
  NaCl: 'Na⁺ and Cl⁻ form an extended ionic lattice.',
  MgO: 'Mg²⁺ and O²⁻ balance in a 1:1 formula unit.',
  CaCl2: 'Ca²⁺ is balanced by two Cl⁻ ions in the ionic solid.',
};

export const atomChargeLabels: Record<string, Record<string, string>> = {
  NaCl: { Na: 'Na⁺', Cl: 'Cl⁻' },
  MgO: { Mg: 'Mg²⁺', O: 'O²⁻' },
  CaCl2: { Ca: 'Ca²⁺', Cl: 'Cl⁻' },
  HCl: { H: 'Hδ⁺', Cl: 'Clδ⁻' },
};
