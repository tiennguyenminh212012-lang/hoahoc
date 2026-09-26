export const reactionNotes: Record<string, { family: string; change: string; bonds: string; visual: string; changeLabel: string; electronCaption: string }> = {
  'water-synthesis': {
    family: 'Synthesis',
    change: 'Two simpler substances combine to form water.',
    bonds: 'The H—H and O=O bonds break; O—H bonds form in water molecules.',
    visual: 'Hydrogen and oxygen enter from the left; water molecules leave to the right.',
    changeLabel: 'Bonds reform',
    electronCaption: 'As H—H and O=O bonds break, shared electron density reorganizes into new O—H bonds.',
  },
  'water-decomposition': {
    family: 'Decomposition',
    change: 'Water separates into hydrogen and oxygen.',
    bonds: 'O—H bonds break; H—H and O=O bonds form in the products.',
    visual: 'Water enters from the left; hydrogen and oxygen leave to the right.',
    changeLabel: 'Bonds reform',
    electronCaption: 'As O—H bonds break, shared electron density reorganizes into H—H and O=O bonds.',
  },
  'zinc-copper-replacement': {
    family: 'Single replacement',
    change: 'Zinc takes copper’s place. The sulfate group remains present on both sides.',
    bonds: 'Zinc loses two electrons and becomes Zn²⁺; Cu²⁺ gains those electrons and becomes copper metal. Sulfate remains a spectator ion.',
    visual: 'Zinc enters solution as Zn²⁺ while Cu²⁺ becomes solid copper; sulfate stays in solution.',
    changeLabel: 'Electron transfer',
    electronCaption: 'Zn loses two electrons → Cu²⁺ gains two electrons. Sulfate does not take part in the transfer.',
  },
  'silver-chloride-precipitation': {
    family: 'Double replacement',
    change: 'Ions exchange partners and solid silver chloride forms.',
    bonds: 'Ag⁺ and Cl⁻ come together in an insoluble ionic solid; Na⁺ and NO₃⁻ remain in solution.',
    visual: 'The two input ionic compounds become a precipitate and dissolved ions.',
    changeLabel: 'Ions regroup',
    electronCaption: 'Ag⁺ and Cl⁻ join a solid ionic lattice. This ion exchange does not transfer electrons between the ions.',
  },
  'methane-combustion': {
    family: 'Combustion',
    change: 'Methane reacts with oxygen to form carbon dioxide and water.',
    bonds: 'C—H and O=O bonds break; C=O and O—H bonds form in the products.',
    visual: 'Methane and oxygen enter; carbon dioxide and water resolve on the right.',
    changeLabel: 'Bonds reform',
    electronCaption: 'As C—H and O=O bonds break, electron density reorganizes into C=O and O—H bonds.',
  },
};

export const balancingHints = [
  'Count every H and O atom on both sides before changing anything.',
  'Oxygen differs: there are two O atoms in O₂ but one in H₂O.',
  'Put a 2 before H₂O. This makes two water molecules and two O atoms on the product side.',
  'Now hydrogen differs: the product side has four H atoms, but the reactant side has two.',
  'Put a 2 before H₂. This gives four H atoms on each side.',
  'Check both elements again. The balanced equation is 2H₂ + O₂ → 2H₂O.',
];
