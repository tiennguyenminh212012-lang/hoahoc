import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FreeArea from './index';
import { atomIsReady, matchBench, neutralShells, sameComposition, startingAtom, supportedReactantFormulas } from './freeAreaChemistry';

describe('Free Area chemistry guardrails', () => {
  it('fills the first twenty neutral main-shell examples and rejects unsupported shell counts', () => {
    expect(neutralShells(1)).toEqual([1, 0, 0, 0]);
    expect(neutralShells(10)).toEqual([2, 8, 0, 0]);
    expect(neutralShells(19)).toEqual([2, 8, 8, 1]);
    expect(neutralShells(20)).toEqual([2, 8, 8, 2]);
    expect(neutralShells(21)).toBeNull();
    expect(startingAtom(17)).toEqual({ protons: 17, neutrons: 18, shells: [2, 8, 7, 0] });
    expect(atomIsReady(8, [2, 6, 0, 0])).toBe(true);
    expect(atomIsReady(8, [1, 7, 0, 0])).toBe(false);
  });

  it('matches only verified species by atom counts, regardless of insertion order', () => {
    expect(sameComposition({ O: 1, H: 2 }, { H: 2, O: 1 })).toBe(true);
    const water = matchBench({ O: 1, H: 2 }, 'compound');
    expect(water?.kind).toBe('compound');
    if (water?.kind === 'compound') expect(water.compound.formula).toBe('H2O');
    const reactant = matchBench({ O: 2 }, 'reactant');
    expect(reactant?.kind).toBe('reactant');
    if (reactant?.kind === 'reactant') expect(reactant.reactions.length).toBeGreaterThan(0);
    expect(matchBench({ O: 1, H: 1 }, 'compound')).toBeNull();
    expect(supportedReactantFormulas()).toContain('NaCl');
    expect(supportedReactantFormulas()).not.toContain('CuSO4');
  });
});

describe('Free Area workbench', () => {
  it('uses a linked atom preset and checks a compound, reactant, and unsupported mix', () => {
    render(<MemoryRouter initialEntries={['/?element=8']}><FreeArea /></MemoryRouter>);
    expect(screen.getByTestId('element-identity')).toHaveTextContent('Oxygen-16');
    fireEvent.click(screen.getByRole('button', { name: /Save atom to shelf/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Load Hydrogen preset' }));
    expect(screen.getByTestId('element-identity')).toHaveTextContent('Hydrogen-1');
    fireEvent.click(screen.getByRole('button', { name: /Save atom to shelf/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Hydrogen atom to tray' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Hydrogen atom to tray' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Oxygen atom to tray' }));
    fireEvent.click(screen.getByRole('button', { name: /Check combination/ }));
    expect(screen.getByRole('heading', { name: 'Water' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reaction reactant' }));
    fireEvent.click(screen.getByRole('button', { name: /Check combination/ }));
    expect(screen.getByText('VERIFIED REACTANT')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove one Hydrogen atom from tray' }));
    fireEvent.click(screen.getByRole('button', { name: /Check combination/ }));
    expect(screen.getByRole('heading', { name: 'Not in this teaching set yet.' })).toBeInTheDocument();
  });

  it('accepts pointer drops for nucleus and shell while keeping button controls', () => {
    render(<MemoryRouter><FreeArea /></MemoryRouter>);
    const nucleus = screen.getByRole('group', { name: 'Nucleus drop zone' });
    const shell = screen.getByRole('group', { name: 'K shell drop zone' });
    const hitTest = vi.fn(() => nucleus as Element);
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hitTest });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Drag or add proton' }), { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(screen.getByTestId('element-identity')).toHaveTextContent('Hydrogen-1');
    hitTest.mockReturnValue(shell);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Drag or select electron' }), { pointerId: 2, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(window, { pointerId: 2, clientX: 100, clientY: 100 });
    expect(screen.getByText(/Neutral atom · shell arrangement 1/)).toBeInTheDocument();
    Reflect.deleteProperty(document, 'elementFromPoint');
  });
});
