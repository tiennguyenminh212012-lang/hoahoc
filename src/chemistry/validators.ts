import { getCompound, supportedCompounds } from '../chemistry-data/compounds';
import type { IsotopeData } from '../chemistry-data/isotopes';
import { getIon } from '../chemistry-data/ions';
import { parseFormula } from './formulaParser';

export interface AtomParticleCounts {
  protons: number;
  neutrons: number;
  electrons: number;
}

/** A neutral isotope has Z protons/electrons and A−Z neutrons. */
export function getNeutralAtomCounts(atomicNumber: number, massNumber: number): AtomParticleCounts {
  if (!Number.isSafeInteger(atomicNumber) || atomicNumber < 1 || !Number.isSafeInteger(massNumber) || massNumber < atomicNumber) {
    throw new RangeError('Use a valid atomic number and mass number.');
  }
  return { protons: atomicNumber, neutrons: massNumber - atomicNumber, electrons: atomicNumber };
}

export function validateIsotope(isotope: IsotopeData): boolean {
  const { protons, neutrons, electrons } = getNeutralAtomCounts(isotope.atomicNumber, isotope.massNumber);
  return isotope.protons === protons
    && isotope.neutrons === neutrons
    && isotope.electrons === electrons
    && isotope.shellArrangement.reduce((sum, count) => sum + count, 0) === electrons;
}

export function validateIonCharge(idOrFormula: string, proposedCharge: number): boolean {
  const ion = getIon(idOrFormula);
  return ion !== undefined && ion.charge === proposedCharge;
}

/** Free exploration is limited to compounds represented by the dataset. */
export function isSupportedCompound(formula: string): boolean {
  return getCompound(formula) !== undefined;
}

/** Match atom counts, independent of formula element order (e.g. OH2 and H2O). */
export function findSupportedCompoundByComposition(formula: string) {
  const target = parseFormula(formula);
  return supportedCompounds.find((compound) => {
    const candidate = parseFormula(compound.formula);
    const symbols = new Set([...Object.keys(target), ...Object.keys(candidate)]);
    return [...symbols].every((symbol) => target[symbol] === candidate[symbol]);
  });
}
