import type { IsotopeData } from '../chemistry-data/isotopes';

const superscriptDigits: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
};

export interface ConfigurationTerm {
  label: string;
  shell: number;
  subshell: 's' | 'p' | 'd' | 'f';
  electrons: number;
}

export function parseElectronConfiguration(configuration: string): ConfigurationTerm[] {
  return configuration.trim().split(/\s+/).filter(Boolean).map((label) => {
    const match = /^(\d+)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/.exec(label);
    if (!match) throw new Error(`Invalid electron configuration term: ${label}`);
    const [, shell, subshell, superscripts] = match;
    if (!shell || !subshell || !superscripts) throw new Error(`Invalid electron configuration term: ${label}`);
    const electrons = Number([...superscripts].map((digit) => superscriptDigits[digit] ?? '').join(''));
    return { label, shell: Number(shell), subshell: subshell as ConfigurationTerm['subshell'], electrons };
  });
}

export function getValenceElectronCount(isotope: IsotopeData): number {
  return isotope.shellArrangement.at(-1) ?? 0;
}

export function getShellCountsFromConfiguration(configuration: string): number[] {
  const terms = parseElectronConfiguration(configuration);
  const shellCounts: number[] = [];
  for (const term of terms) shellCounts[term.shell - 1] = (shellCounts[term.shell - 1] ?? 0) + term.electrons;
  return shellCounts;
}
