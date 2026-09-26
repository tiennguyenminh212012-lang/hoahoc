import type { SpeciesCoefficient } from '../chemistry-data/reactions';
import { parseFormula, type AtomCounts } from './formulaParser';

/** Multiply each formula's atom counts by its coefficient and sum a side. */
export function countEquationSide(species: readonly SpeciesCoefficient[]): AtomCounts {
  const totals: AtomCounts = {};
  for (const { formula, coefficient } of species) {
    if (!Number.isSafeInteger(coefficient) || coefficient < 1) {
      throw new RangeError('Equation coefficients must be positive whole numbers.');
    }
    for (const [symbol, count] of Object.entries(parseFormula(formula))) {
      const total = (totals[symbol] ?? 0) + count * coefficient;
      if (!Number.isSafeInteger(total)) throw new RangeError('Equation atom count is too large.');
      totals[symbol] = total;
    }
  }
  return totals;
}

export interface EquationCounts {
  reactants: AtomCounts;
  products: AtomCounts;
}

export function getEquationCounts(
  reactants: readonly SpeciesCoefficient[],
  products: readonly SpeciesCoefficient[],
): EquationCounts {
  return { reactants: countEquationSide(reactants), products: countEquationSide(products) };
}

export function isEquationBalanced(
  reactants: readonly SpeciesCoefficient[],
  products: readonly SpeciesCoefficient[],
): boolean {
  if (reactants.length === 0 || products.length === 0) return false;
  const counts = getEquationCounts(reactants, products);
  const symbols = new Set([...Object.keys(counts.reactants), ...Object.keys(counts.products)]);
  return [...symbols].every((symbol) => counts.reactants[symbol] === counts.products[symbol]);
}
