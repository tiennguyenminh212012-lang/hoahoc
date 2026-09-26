/**
 * Element names and abridged standard atomic weights follow CIAAW (2024):
 * https://www.ciaaw.org/abridged-atomic-weights.htm
 * Bracketed values are mass numbers of representative long-lived nuclides,
 * not standard atomic weights:
 * https://www.ciaaw.org/radioactive-elements.htm
 */

export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth-metal'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanoid'
  | 'actinoid';

export interface ElementData {
  atomicNumber: number;
  symbol: string;
  name: string;
  /** Abridged standard atomic weight; [A] marks a nuclide mass number. */
  atomicMass: string;
  /** F-block elements generally have no universally assigned group. */
  group?: number;
  period: number;
  category: ElementCategory;
  /** CSS grid position. Rows 8 and 9 hold the f block. */
  tableRow: number;
  tableColumn: number;
  stateAtRoomTemperature?: 'solid' | 'liquid' | 'gas';
  electronConfiguration?: string;
  shellArrangement?: number[];
  facts?: string[];
}

type ElementTuple = readonly [symbol: string, name: string, atomicMass: string];

// Ordered by atomic number. Precise values are rounded for compact tile display.
const rows: ElementTuple[] = [
  ['H', 'Hydrogen', '1.0080'], ['He', 'Helium', '4.0026'],
  ['Li', 'Lithium', '6.94'], ['Be', 'Beryllium', '9.0122'], ['B', 'Boron', '10.81'], ['C', 'Carbon', '12.011'], ['N', 'Nitrogen', '14.007'], ['O', 'Oxygen', '15.999'], ['F', 'Fluorine', '18.998'], ['Ne', 'Neon', '20.180'],
  ['Na', 'Sodium', '22.990'], ['Mg', 'Magnesium', '24.305'], ['Al', 'Aluminium', '26.982'], ['Si', 'Silicon', '28.085'], ['P', 'Phosphorus', '30.974'], ['S', 'Sulfur', '32.06'], ['Cl', 'Chlorine', '35.45'], ['Ar', 'Argon', '39.95'],
  ['K', 'Potassium', '39.098'], ['Ca', 'Calcium', '40.078'], ['Sc', 'Scandium', '44.956'], ['Ti', 'Titanium', '47.867'], ['V', 'Vanadium', '50.942'], ['Cr', 'Chromium', '51.996'], ['Mn', 'Manganese', '54.938'], ['Fe', 'Iron', '55.845'], ['Co', 'Cobalt', '58.933'], ['Ni', 'Nickel', '58.693'], ['Cu', 'Copper', '63.546'], ['Zn', 'Zinc', '65.38'], ['Ga', 'Gallium', '69.723'], ['Ge', 'Germanium', '72.630'], ['As', 'Arsenic', '74.922'], ['Se', 'Selenium', '78.971'], ['Br', 'Bromine', '79.904'], ['Kr', 'Krypton', '83.798'],
  ['Rb', 'Rubidium', '85.468'], ['Sr', 'Strontium', '87.62'], ['Y', 'Yttrium', '88.906'], ['Zr', 'Zirconium', '91.222'], ['Nb', 'Niobium', '92.906'], ['Mo', 'Molybdenum', '95.95'], ['Tc', 'Technetium', '[97]'], ['Ru', 'Ruthenium', '101.07'], ['Rh', 'Rhodium', '102.91'], ['Pd', 'Palladium', '106.42'], ['Ag', 'Silver', '107.87'], ['Cd', 'Cadmium', '112.41'], ['In', 'Indium', '114.82'], ['Sn', 'Tin', '118.71'], ['Sb', 'Antimony', '121.76'], ['Te', 'Tellurium', '127.60'], ['I', 'Iodine', '126.90'], ['Xe', 'Xenon', '131.29'],
  ['Cs', 'Caesium', '132.91'], ['Ba', 'Barium', '137.33'], ['La', 'Lanthanum', '138.91'], ['Ce', 'Cerium', '140.12'], ['Pr', 'Praseodymium', '140.91'], ['Nd', 'Neodymium', '144.24'], ['Pm', 'Promethium', '[145]'], ['Sm', 'Samarium', '150.36'], ['Eu', 'Europium', '151.96'], ['Gd', 'Gadolinium', '157.25'], ['Tb', 'Terbium', '158.93'], ['Dy', 'Dysprosium', '162.50'], ['Ho', 'Holmium', '164.93'], ['Er', 'Erbium', '167.26'], ['Tm', 'Thulium', '168.93'], ['Yb', 'Ytterbium', '173.05'], ['Lu', 'Lutetium', '174.97'], ['Hf', 'Hafnium', '178.49'], ['Ta', 'Tantalum', '180.95'], ['W', 'Tungsten', '183.84'], ['Re', 'Rhenium', '186.21'], ['Os', 'Osmium', '190.23'], ['Ir', 'Iridium', '192.22'], ['Pt', 'Platinum', '195.08'], ['Au', 'Gold', '196.97'], ['Hg', 'Mercury', '200.59'], ['Tl', 'Thallium', '204.38'], ['Pb', 'Lead', '207.2'], ['Bi', 'Bismuth', '208.98'], ['Po', 'Polonium', '[209]'], ['At', 'Astatine', '[210]'], ['Rn', 'Radon', '[222]'],
  ['Fr', 'Francium', '[223]'], ['Ra', 'Radium', '[226]'], ['Ac', 'Actinium', '[227]'], ['Th', 'Thorium', '232.04'], ['Pa', 'Protactinium', '231.04'], ['U', 'Uranium', '238.03'], ['Np', 'Neptunium', '[237]'], ['Pu', 'Plutonium', '[244]'], ['Am', 'Americium', '[243]'], ['Cm', 'Curium', '[247]'], ['Bk', 'Berkelium', '[247]'], ['Cf', 'Californium', '[251]'], ['Es', 'Einsteinium', '[252]'], ['Fm', 'Fermium', '[257]'], ['Md', 'Mendelevium', '[258]'], ['No', 'Nobelium', '[259]'], ['Lr', 'Lawrencium', '[262]'], ['Rf', 'Rutherfordium', '[267]'], ['Db', 'Dubnium', '[268]'], ['Sg', 'Seaborgium', '[269]'], ['Bh', 'Bohrium', '[270]'], ['Hs', 'Hassium', '[269]'], ['Mt', 'Meitnerium', '[277]'], ['Ds', 'Darmstadtium', '[281]'], ['Rg', 'Roentgenium', '[282]'], ['Cn', 'Copernicium', '[285]'], ['Nh', 'Nihonium', '[286]'], ['Fl', 'Flerovium', '[289]'], ['Mc', 'Moscovium', '[290]'], ['Lv', 'Livermorium', '[293]'], ['Ts', 'Tennessine', '[294]'], ['Og', 'Oganesson', '[294]'],
];

const inSet = (number: number, values: readonly number[]) => values.includes(number);

function periodOf(number: number): number {
  if (number <= 2) return 1;
  if (number <= 10) return 2;
  if (number <= 18) return 3;
  if (number <= 36) return 4;
  if (number <= 54) return 5;
  if (number <= 86) return 6;
  return 7;
}

function groupOf(number: number): number | undefined {
  if (number === 1) return 1;
  if (number === 2) return 18;
  if (number >= 3 && number <= 10) return number <= 4 ? number - 2 : number + 8;
  if (number >= 11 && number <= 18) return number <= 12 ? number - 10 : number;
  if (number >= 19 && number <= 36) return number - 18;
  if (number >= 37 && number <= 54) return number - 36;
  if (number >= 55 && number <= 56) return number - 54;
  if (number === 57) return 3;
  if (number >= 58 && number <= 71) return undefined;
  if (number >= 72 && number <= 86) return number - 68;
  if (number >= 87 && number <= 88) return number - 86;
  if (number === 89) return 3;
  if (number >= 90 && number <= 103) return undefined;
  return number - 100;
}

function categoryOf(number: number, group: number | undefined): ElementCategory {
  if (number >= 57 && number <= 71) return 'lanthanoid';
  if (number >= 89 && number <= 103) return 'actinoid';
  if (number !== 1 && group === 1) return 'alkali-metal';
  if (group === 2) return 'alkaline-earth-metal';
  if (group === 17) return 'halogen';
  if (group === 18) return 'noble-gas';
  if (inSet(number, [5, 14, 32, 33, 51, 52])) return 'metalloid';
  if (inSet(number, [1, 6, 7, 8, 15, 16, 34])) return 'nonmetal';
  if (inSet(number, [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116])) return 'post-transition-metal';
  return 'transition-metal';
}

function stateOf(number: number): ElementData['stateAtRoomTemperature'] {
  if (inSet(number, [1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86])) return 'gas';
  if (inSet(number, [35, 80])) return 'liquid';
  // Bulk properties of some synthetic superheavy elements are not established.
  if (number >= 104 || number === 85) return undefined;
  return 'solid';
}

const detailed: Record<number, Partial<ElementData>> = {
  1: {
    electronConfiguration: '1s¹', shellArrangement: [1],
    facts: ['One proton defines every hydrogen atom.', 'Hydrogen-1 has no neutron.'],
  },
  11: {
    electronConfiguration: '1s² 2s² 2p⁶ 3s¹', shellArrangement: [2, 8, 1],
    facts: ['Its one outer electron can be lost to form Na⁺.', 'Solid sodium chloride forms a repeating ionic lattice.'],
  },
  17: {
    electronConfiguration: '1s² 2s² 2p⁶ 3s² 3p⁵', shellArrangement: [2, 8, 7],
    facts: ['Seven outer electrons make chlorine one electron short of a filled outer shell in the simplified model.', 'Chloride is Cl⁻ after chlorine gains one electron.'],
  },
};

export const elements: ElementData[] = rows.map(([symbol, name, atomicMass], index) => {
  const atomicNumber = index + 1;
  const period = periodOf(atomicNumber);
  const group = groupOf(atomicNumber);
  const fBlock = (atomicNumber >= 57 && atomicNumber <= 71) || (atomicNumber >= 89 && atomicNumber <= 103);
  return {
    atomicNumber, symbol, name, atomicMass, group, period,
    category: categoryOf(atomicNumber, group),
    tableRow: fBlock ? period + 2 : period,
    tableColumn: fBlock ? atomicNumber - (period === 6 ? 54 : 86) : (group ?? 3),
    stateAtRoomTemperature: stateOf(atomicNumber),
    ...detailed[atomicNumber],
  };
});

/** Look up by atomic number or exact symbol; unknown entries return undefined. */
export function getElement(numberOrSymbol: number | string): ElementData | undefined {
  return typeof numberOrSymbol === 'number'
    ? elements[numberOrSymbol - 1]
    : elements.find((element) => element.symbol === numberOrSymbol);
}
