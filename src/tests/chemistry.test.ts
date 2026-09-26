import { describe, expect, it } from 'vitest';
import { elements, getElement } from '../chemistry-data/elements';
import { isotopes } from '../chemistry-data/isotopes';
import { ions } from '../chemistry-data/ions';
import { reactions } from '../chemistry-data/reactions';
import { supportedCompounds } from '../chemistry-data/compounds';
import { parseFormula, FormulaParseError } from '../chemistry/formulaParser';
import { countEquationSide, isEquationBalanced } from '../chemistry/equationBalancer';
import { getNeutralAtomCounts, validateIonCharge, validateIsotope, findSupportedCompoundByComposition } from '../chemistry/validators';
import { getShellCountsFromConfiguration, parseElectronConfiguration } from '../chemistry/electronHelpers';

describe('the element and isotope source of truth', () => {
  it('contains each of the 118 named elements in atomic-number order', () => {
    expect(elements).toHaveLength(118);
    expect(new Set(elements.map((element) => element.symbol)).size).toBe(118);
    elements.forEach((element, index) => {
      expect(element.atomicNumber).toBe(index + 1);
      expect(element.name.length).toBeGreaterThan(0);
      expect(element.atomicMass.length).toBeGreaterThan(0);
      expect(element.period).toBeGreaterThanOrEqual(1);
      expect(element.period).toBeLessThanOrEqual(7);
      expect(element.tableColumn).toBeGreaterThanOrEqual(1);
      expect(element.tableColumn).toBeLessThanOrEqual(18);
    });
    expect(getElement('Na')?.atomicNumber).toBe(11);
    expect(getElement(118)?.symbol).toBe('Og');
    expect(getElement('Xx')).toBeUndefined();
  });

  it.each([
    ['hydrogen-1', 1, 0, 1, [1], '1s¹'],
    ['sodium-23', 11, 12, 11, [2, 8, 1], '1s² 2s² 2p⁶ 3s¹'],
    ['chlorine-35', 17, 18, 17, [2, 8, 7], '1s² 2s² 2p⁶ 3s² 3p⁵'],
  ])('%s has correct particle counts and electron arrangement', (id, protons, neutrons, electrons, shells, configuration) => {
    const isotope = isotopes.find((entry) => entry.id === id);
    expect(isotope).toMatchObject({ protons, neutrons, electrons, shellArrangement: shells, electronConfiguration: configuration });
    expect(isotope && validateIsotope(isotope)).toBe(true);
    expect(getNeutralAtomCounts(protons as number, (protons as number) + (neutrons as number))).toEqual({ protons, neutrons, electrons });
  });

  it('derives shell counts from configuration terms', () => {
    expect(getShellCountsFromConfiguration('1s² 2s² 2p⁶ 3s¹')).toEqual([2, 8, 1]);
    expect(parseElectronConfiguration('3p⁵')[0]).toMatchObject({ shell: 3, subshell: 'p', electrons: 5 });
  });
});

describe('formula parsing', () => {
  it.each([
    ['H2O', { H: 2, O: 1 }],
    ['CuSO4', { Cu: 1, S: 1, O: 4 }],
    ['AgNO3', { Ag: 1, N: 1, O: 3 }],
    ['CH4', { C: 1, H: 4 }],
    ['C2H3O2', { C: 2, H: 3, O: 2 }],
    ['Ca(OH)2', { Ca: 1, O: 2, H: 2 }],
    ['Al2(SO4)3', { Al: 2, S: 3, O: 12 }],
    ['K4[Fe(CN)6]', { K: 4, Fe: 1, C: 6, N: 6 }],
    ['SO₄²⁻', { S: 1, O: 4 }],
  ])('counts atoms in %s', (formula, expected) => {
    expect(parseFormula(formula)).toEqual(expected);
  });

  it.each(['', 'H0', '2H2O', 'Ca(OH', 'Ca)OH(', 'H2Qq', 'Na( )', 'H2O2)'])('rejects malformed formula %s', (formula) => {
    expect(() => parseFormula(formula)).toThrow(FormulaParseError);
  });
});

describe('equation balancing', () => {
  it('computes each side from immutable formula subscripts and editable coefficients', () => {
    expect(countEquationSide([{ formula: 'H2', coefficient: 2 }, { formula: 'O2', coefficient: 1 }])).toEqual({ H: 4, O: 2 });
    expect(isEquationBalanced(
      [{ formula: 'H2', coefficient: 2 }, { formula: 'O2', coefficient: 1 }],
      [{ formula: 'H2O', coefficient: 2 }],
    )).toBe(true);
    expect(isEquationBalanced(
      [{ formula: 'H2', coefficient: 1 }, { formula: 'O2', coefficient: 1 }],
      [{ formula: 'H2O', coefficient: 1 }],
    )).toBe(false);
  });

  it('keeps all five required example reactions balanced', () => {
    expect(reactions).toHaveLength(5);
    for (const reaction of reactions) {
      expect(isEquationBalanced(reaction.reactants, reaction.products), reaction.id).toBe(true);
    }
  });

  it('rejects zero and fractional coefficients', () => {
    expect(() => countEquationSide([{ formula: 'H2', coefficient: 0 }])).toThrow(RangeError);
    expect(() => countEquationSide([{ formula: 'H2', coefficient: 1.5 }])).toThrow(RangeError);
  });
});

describe('ions and the supported builder dataset', () => {
  it('contains the 11 required ions with explicit charges', () => {
    expect(ions).toHaveLength(11);
    expect(ions.map((ion) => ion.id)).toEqual([
      'ammonium', 'hydroxide', 'nitrate', 'nitrite', 'sulfate', 'sulfite',
      'carbonate', 'phosphate', 'bicarbonate', 'acetate', 'cyanide',
    ]);
    for (const ion of ions) {
      expect(Number.isInteger(ion.charge)).toBe(true);
      expect(ion.charge).not.toBe(0);
      expect(Object.keys(parseFormula(ion.formula)).length).toBeGreaterThan(0);
      expect(validateIonCharge(ion.id, ion.charge)).toBe(true);
    }
    expect(validateIonCharge('sulfate', -1)).toBe(false);
  });

  it('supports only modeled compound formulas', () => {
    expect(supportedCompounds.map((entry) => entry.formula)).toContain('NaCl');
    expect(findSupportedCompoundByComposition('OH2')?.formula).toBe('H2O');
    expect(findSupportedCompoundByComposition('H3O')).toBeUndefined();
  });
});
