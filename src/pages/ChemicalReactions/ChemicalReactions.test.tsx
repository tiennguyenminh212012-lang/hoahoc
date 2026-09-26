import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ChemicalReactions from './index';

vi.mock('../../scenes/shared/SceneViewport', () => ({ SceneViewport: ({ fallback }: { fallback: ReactNode }) => <>{fallback}</> }));
vi.mock('../../scenes/reactions/ReactionScene', () => ({ ReactionScene: () => null }));

describe('coefficient-only equation balancing', () => {
  it('recomputes molecule counts and confirms the smallest whole-number answer', () => {
    render(<MemoryRouter><ChemicalReactions /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Balance an equation/ }));
    expect(screen.getByRole('row', { name: /O 2 1 Mismatch/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Increase coefficient for H2O' }));
    expect(screen.getByRole('row', { name: /H 2 4 Mismatch/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Increase coefficient for H2' }));
    expect(screen.getByRole('row', { name: /H 4 4 Equal/ })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /O 2 2 Equal/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Check balance' }));
    expect(screen.getByText(/smallest whole-number coefficients/)).toBeInTheDocument();
  });
});

describe('reaction fallback explanations', () => {
  it.each([
    ['water-synthesis', 'As H—H and O=O bonds break'],
    ['water-decomposition', 'As O—H bonds break'],
    ['zinc-copper-replacement', 'Zn loses two electrons → Cu²⁺ gains two electrons'],
    ['silver-chloride-precipitation', 'does not transfer electrons between the ions'],
    ['methane-combustion', 'As C—H and O=O bonds break'],
  ])('labels the schematic change for %s', (id, phrase) => {
    render(<MemoryRouter initialEntries={[`/study/reactions?reaction=${id}`]}><ChemicalReactions /></MemoryRouter>);
    const fallbackZone = screen.getByText('CHANGE ZONE / SCHEMATIC').parentElement!;
    expect(within(fallbackZone).getByText((text) => text.includes(phrase))).toBeInTheDocument();
  });
});
