import { supportedCompounds, type CompoundData } from '../../chemistry-data/compounds';
import { getElement } from '../../chemistry-data/elements';
import { reactions, type ReactionData } from '../../chemistry-data/reactions';
import { parseFormula, type AtomCounts } from '../../chemistry/formulaParser';

/** Simple main-shell picture for the first twenty neutral atoms. */
export const shellCapacities = [2, 8, 8, 2] as const;
export const shellLabels = ['K', 'L', 'M', 'N'] as const;

/** Common isotope mass numbers used only to make an optional starting preset. */
const presetMassNumbers = [1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 40, 39, 40];

export type ShellCounts = [number, number, number, number];

export function neutralShells(atomicNumber: number): ShellCounts | null {
  if (!Number.isInteger(atomicNumber) || atomicNumber < 1 || atomicNumber > 20) return null;
  let remaining = atomicNumber;
  return shellCapacities.map((capacity) => {
    const count = Math.min(capacity, remaining);
    remaining -= count;
    return count;
  }) as ShellCounts;
}

export function startingAtom(atomicNumber: number): { protons: number; neutrons: number; shells: ShellCounts } | null {
  const shells = neutralShells(atomicNumber);
  if (!shells) return null;
  return { protons: atomicNumber, neutrons: presetMassNumbers[atomicNumber - 1]! - atomicNumber, shells };
}

export function sameComposition(left: AtomCounts, right: AtomCounts): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((symbol) => (left[symbol] ?? 0) === (right[symbol] ?? 0));
}

/** One atom must be saved first before it can be added to a formula tray. */
export type SavedAtom = { symbol: string; atomicNumber: number; massNumber: number };

export type BenchMatch =
  | { kind: 'compound'; compound: CompoundData }
  | { kind: 'reactant'; formula: string; reactions: ReactionData[] };

export function matchBench(composition: AtomCounts, mode: 'compound' | 'reactant'): BenchMatch | null {
  if (Object.values(composition).every((count) => count === 0)) return null;
  if (mode === 'compound') {
    const compound = supportedCompounds.find((candidate) => sameComposition(composition, parseFormula(candidate.formula)));
    return compound ? { kind: 'compound', compound } : null;
  }
  const formulas = [...new Set(reactions.flatMap((reaction) => reaction.reactants.map(({ formula }) => formula)))];
  const formula = formulas.find((candidate) => sameComposition(composition, parseFormula(candidate)));
  if (!formula) return null;
  return { kind: 'reactant', formula, reactions: reactions.filter((reaction) => reaction.reactants.some((species) => species.formula === formula)) };
}

export function formulaFromComposition(composition: AtomCounts): string {
  const entries = Object.entries(composition).filter(([, count]) => count > 0);
  if (!entries.length) return '—';
  // This is an inventory label, never a claimed chemical formula.
  return entries.sort(([a], [b]) => (getElement(a)?.atomicNumber ?? 0) - (getElement(b)?.atomicNumber ?? 0))
    .map(([symbol, count]) => `${symbol}${count > 1 ? count : ''}`).join(' + ');
}

export function atomIsReady(protons: number, shells: ShellCounts): boolean {
  const expected = neutralShells(protons);
  return expected !== null && expected.every((count, index) => count === shells[index]);
}

export function supportedReactantFormulas(): string[] {
  return [...new Set(reactions.flatMap((reaction) => reaction.reactants.map(({ formula }) => formula)))]
    .filter((formula) => Object.keys(parseFormula(formula)).every((symbol) => (getElement(symbol)?.atomicNumber ?? Infinity) <= 20));
}
