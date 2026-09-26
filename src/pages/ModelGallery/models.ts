import { reactions } from '../../chemistry-data/reactions'
import type { MoleculePreset } from '../../scenes/types'

export type ModelCategory = 'Atoms' | 'Ions' | 'Molecules' | 'Bonding' | 'Reactions'
export type ModelDefinition = {
  id: string
  name: string
  category: ModelCategory
  formula: string
  description: string
  kind: 'atom' | 'molecule' | 'bonding' | 'reaction'
  atomNumber?: 1 | 11 | 17
  preset?: MoleculePreset
  bondingExample?: 'nacl' | 'hcl' | 'h2'
  bondingStep?: number
  reactionId?: string
  relatedLesson: string
}

const atomModels: ModelDefinition[] = [
  { id: 'hydrogen-1', name: 'Hydrogen-1', category: 'Atoms', formula: 'H', description: 'A single proton and one electron probability region.', kind: 'atom', atomNumber: 1, relatedLesson: '/study/atoms?element=1&isotope=1&view=cloud' },
  { id: 'sodium-23', name: 'Sodium-23', category: 'Atoms', formula: 'Na', description: 'Eleven protons, twelve neutrons, and an outer electron.', kind: 'atom', atomNumber: 11, relatedLesson: '/study/atoms?element=11&isotope=23&view=cloud' },
  { id: 'chlorine-35', name: 'Chlorine-35', category: 'Atoms', formula: 'Cl', description: 'Seven outer-shell electrons in a neutral chlorine atom.', kind: 'atom', atomNumber: 17, relatedLesson: '/study/atoms?element=17&isotope=35&view=cloud' },
]

const moleculeModels: ModelDefinition[] = [
  { id: 'hydrogen-molecule', name: 'Hydrogen molecule', category: 'Molecules', formula: 'H₂', description: 'Two identical atoms share one electron pair equally.', kind: 'molecule', preset: 'h2', relatedLesson: '/study/bonding?mode=covalent&example=h2&step=3' },
  { id: 'oxygen-molecule', name: 'Oxygen molecule', category: 'Molecules', formula: 'O₂', description: 'Two oxygen atoms joined by a double bond.', kind: 'molecule', preset: 'o2', relatedLesson: '/study/reactions?reaction=water-synthesis' },
  { id: 'water-molecule', name: 'Water molecule', category: 'Molecules', formula: 'H₂O', description: 'A bent molecule with two O–H covalent bonds.', kind: 'molecule', preset: 'h2o', relatedLesson: '/study/reactions?reaction=water-synthesis' },
  { id: 'hydrogen-chloride', name: 'Hydrogen chloride', category: 'Molecules', formula: 'HCl', description: 'A shared electron pair creates a polar covalent bond.', kind: 'molecule', preset: 'hcl', relatedLesson: '/study/bonding?mode=covalent&example=hcl&step=6' },
  { id: 'methane-molecule', name: 'Methane', category: 'Molecules', formula: 'CH₄', description: 'Carbon shares four electron pairs with hydrogen atoms.', kind: 'molecule', preset: 'ch4', relatedLesson: '/study/reactions?reaction=methane-combustion' },
  { id: 'carbon-dioxide', name: 'Carbon dioxide', category: 'Molecules', formula: 'CO₂', description: 'A linear molecule with two C=O double bonds.', kind: 'molecule', preset: 'co2', relatedLesson: '/study/reactions?reaction=methane-combustion' },
  { id: 'ammonia-molecule', name: 'Ammonia', category: 'Molecules', formula: 'NH₃', description: 'Nitrogen bonded to three hydrogen atoms.', kind: 'molecule', preset: 'nh3', relatedLesson: '/study/bonding?mode=covalent' },
]

const bondModels: ModelDefinition[] = [
  { id: 'sodium-chloride-ions', name: 'Sodium and chloride ions', category: 'Ions', formula: 'Na⁺ · Cl⁻', description: 'Electron transfer gives these particles opposite full charges.', kind: 'bonding', bondingExample: 'nacl', bondingStep: 4, relatedLesson: '/study/bonding?mode=ionic&example=nacl&step=4' },
  { id: 'sodium-chloride-lattice', name: 'Sodium chloride lattice', category: 'Bonding', formula: 'NaCl', description: 'A repeating alternating ionic structure, not an isolated NaCl molecule.', kind: 'bonding', bondingExample: 'nacl', bondingStep: 6, relatedLesson: '/study/bonding?mode=ionic&example=nacl&step=6' },
  { id: 'hcl-bond-formation', name: 'HCl bond formation', category: 'Bonding', formula: 'Hδ⁺—Clδ⁻', description: 'A shared pair sits closer to chlorine, creating partial charges.', kind: 'bonding', bondingExample: 'hcl', bondingStep: 6, relatedLesson: '/study/bonding?mode=covalent&example=hcl&step=6' },
  { id: 'h2-equal-sharing', name: 'H₂ equal sharing', category: 'Bonding', formula: 'H—H', description: 'Identical atoms share the pair equally.', kind: 'bonding', bondingExample: 'h2', bondingStep: 3, relatedLesson: '/study/bonding?mode=covalent&example=h2&step=3' },
]

const reactionModels: ModelDefinition[] = reactions.map((reaction) => ({
  id: reaction.id,
  name: reaction.name,
  category: 'Reactions' as const,
  formula: `${reaction.reactants.map((part) => `${part.coefficient > 1 ? part.coefficient : ''}${part.formula}`).join(' + ')} → ${reaction.products.map((part) => `${part.coefficient > 1 ? part.coefficient : ''}${part.formula}`).join(' + ')}`,
  description: reaction.explanation,
  kind: 'reaction' as const,
  reactionId: reaction.id,
  relatedLesson: `/study/reactions?reaction=${reaction.id}`,
}))

export const models: ModelDefinition[] = [...atomModels, ...moleculeModels, ...bondModels, ...reactionModels]
export const modelCategories: ModelCategory[] = ['Atoms', 'Ions', 'Molecules', 'Bonding', 'Reactions']
export function getModel(id: string) { return models.find((model) => model.id === id) }
