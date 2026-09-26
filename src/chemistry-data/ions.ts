/** Starter ions and charges follow the names/formulas specified for this course. */
export interface IonData {
  id: string;
  name: string;
  /** ASCII formula without charge; use semantic markup to render subscripts. */
  formula: string;
  charge: number;
  family?: string;
  note?: string;
  alternativeFormula?: string;
}

export const ions: IonData[] = [
  { id: 'ammonium', name: 'Ammonium', formula: 'NH4', charge: 1, note: 'A common positive polyatomic ion; most other starter ions here are negative.' },
  { id: 'hydroxide', name: 'Hydroxide', formula: 'OH', charge: -1, note: 'An important -ide exception: it contains two atoms.' },
  { id: 'nitrate', name: 'Nitrate', formula: 'NO3', charge: -1, family: 'nitrogen oxyanions', note: 'Nitrate has one more oxygen atom than nitrite, with the same charge.' },
  { id: 'nitrite', name: 'Nitrite', formula: 'NO2', charge: -1, family: 'nitrogen oxyanions', note: 'Nitrite has one fewer oxygen atom than nitrate, with the same charge.' },
  { id: 'sulfate', name: 'Sulfate', formula: 'SO4', charge: -2, family: 'sulfur oxyanions', note: 'Sulfate has one more oxygen atom than sulfite, with the same charge.' },
  { id: 'sulfite', name: 'Sulfite', formula: 'SO3', charge: -2, family: 'sulfur oxyanions', note: 'Sulfite has one fewer oxygen atom than sulfate, with the same charge.' },
  { id: 'carbonate', name: 'Carbonate', formula: 'CO3', charge: -2, family: 'carbon oxyanions', note: 'Carbonate contains one carbon and three oxygen atoms.' },
  { id: 'phosphate', name: 'Phosphate', formula: 'PO4', charge: -3, family: 'phosphorus oxyanions', note: 'The 3− charge is part of this ion’s identity and must be remembered.' },
  { id: 'bicarbonate', name: 'Bicarbonate', formula: 'HCO3', charge: -1, family: 'carbon oxyanions', note: 'Also called hydrogen carbonate; it differs from carbonate by one hydrogen and its charge.' },
  { id: 'acetate', name: 'Acetate', formula: 'C2H3O2', alternativeFormula: 'CH3COO', charge: -1, note: 'Both formulas show the same numbers of C, H, and O atoms.' },
  { id: 'cyanide', name: 'Cyanide', formula: 'CN', charge: -1, note: 'Another important -ide exception: the ion contains both carbon and nitrogen.' },
];

export function getIon(idOrFormula: string): IonData | undefined {
  return ions.find((ion) => ion.id === idOrFormula || ion.formula === idOrFormula || ion.alternativeFormula === idOrFormula);
}
