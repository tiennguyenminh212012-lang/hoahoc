import { getElement } from '../chemistry-data/elements';

export type AtomCounts = Record<string, number>;

export class FormulaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormulaParseError';
  }
}

const subscriptDigits: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

/**
 * Count atoms in a single chemical formula. Supports nested parentheses and
 * brackets such as Ca(OH)2 and K4[Fe(CN)6]. Ionic charge may be written with
 * a caret (SO4^2-) or Unicode superscripts (SO₄²⁻).
 */
export function parseFormula(input: string): AtomCounts {
  const formula = input.trim()
    .replace(/[₀-₉]/g, (digit) => subscriptDigits[digit] ?? digit)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]$/, '')
    .replace(/\^(?:\d+)?[+-]$/, '');

  if (!formula) throw new FormulaParseError('Enter a chemical formula.');
  if (/\s/.test(formula)) throw new FormulaParseError('A chemical formula cannot contain spaces.');

  let position = 0;

  const readMultiplier = (): number => {
    const start = position;
    while (position < formula.length && /[0-9]/.test(formula.charAt(position))) position += 1;
    if (start === position) return 1;
    const multiplier = Number(formula.slice(start, position));
    if (!Number.isSafeInteger(multiplier) || multiplier < 1) {
      throw new FormulaParseError('Atom and group counts must be positive whole numbers.');
    }
    return multiplier;
  };

  const addCounts = (target: AtomCounts, source: AtomCounts, multiplier = 1): void => {
    for (const [symbol, count] of Object.entries(source)) {
      const total = (target[symbol] ?? 0) + count * multiplier;
      if (!Number.isSafeInteger(total)) throw new FormulaParseError('Atom count is too large.');
      target[symbol] = total;
    }
  };

  const readGroup = (closing?: ')' | ']'): AtomCounts => {
    const counts: AtomCounts = {};
    let hasTerm = false;

    while (position < formula.length) {
      const character = formula.charAt(position);
      if (character === ')' || character === ']') {
        if (character !== closing) throw new FormulaParseError(`Unexpected “${character}” in formula.`);
        if (!hasTerm) throw new FormulaParseError('An empty group is not a chemical formula.');
        position += 1;
        return counts;
      }
      if (character === '(' || character === '[') {
        position += 1;
        const inner = readGroup(character === '(' ? ')' : ']');
        addCounts(counts, inner, readMultiplier());
        hasTerm = true;
        continue;
      }
      if (/[A-Z]/.test(character)) {
        const start = position;
        position += 1;
        if (position < formula.length && /[a-z]/.test(formula.charAt(position))) position += 1;
        const symbol = formula.slice(start, position);
        if (!getElement(symbol)) throw new FormulaParseError(`Unknown element symbol “${symbol}”.`);
        addCounts(counts, { [symbol]: 1 }, readMultiplier());
        hasTerm = true;
        continue;
      }
      throw new FormulaParseError(`Unexpected “${character}” in formula.`);
    }

    if (closing) throw new FormulaParseError(`Missing closing “${closing}” in formula.`);
    if (!hasTerm) throw new FormulaParseError('Enter a chemical formula.');
    return counts;
  };

  return readGroup();
}

export const countAtoms = parseFormula;
