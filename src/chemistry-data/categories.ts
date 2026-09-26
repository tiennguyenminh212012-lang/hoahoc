import type { ElementCategory } from './elements';

export const elementCategoryLabels: Record<ElementCategory, string> = {
  'alkali-metal': 'Alkali metals',
  'alkaline-earth-metal': 'Alkaline earth metals',
  'transition-metal': 'Transition metals',
  'post-transition-metal': 'Post-transition metals',
  metalloid: 'Metalloids',
  nonmetal: 'Nonmetals',
  halogen: 'Halogens',
  'noble-gas': 'Noble gases',
  lanthanoid: 'Lanthanoids',
  actinoid: 'Actinoids',
};

export const groupDescriptions: Record<number, string> = {
  1: 'Alkali metals have one outer electron (hydrogen is a separate nonmetal exception).',
  2: 'Alkaline earth metals usually have two outer electrons.',
  17: 'Halogens generally have seven outer electrons and often form 1− ions.',
  18: 'Noble gases have full outer shells in the simplified shell model (helium has two).',
};
