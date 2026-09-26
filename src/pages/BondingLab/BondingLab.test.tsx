import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BondingLab from './index';

vi.mock('../../scenes/shared/SceneViewport', () => ({ SceneViewport: () => null }));
vi.mock('../../scenes/bonding/BondingScene', () => ({ BondingScene: () => null }));
vi.mock('../../scenes/molecules/MoleculeScene', () => ({ MoleculeScene: () => null }));

describe('the supported compound builder', () => {
  it('forms a supported example and explains an unsupported combination', () => {
    render(<MemoryRouter><BondingLab /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Compound builder' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Hydrogen atom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Hydrogen atom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Oxygen atom' }));
    fireEvent.click(screen.getByRole('button', { name: /Form bond/ }));
    expect(screen.getByText(/Water formed in this supported model/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Free exploration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Sodium atom' }));
    fireEvent.click(screen.getByRole('button', { name: /Form bond/ }));
    expect(screen.getByText(/does not currently model this combination/)).toBeInTheDocument();
  });
});
