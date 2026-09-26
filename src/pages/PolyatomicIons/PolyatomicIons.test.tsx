import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import PolyatomicIons from './index';

describe('polyatomic ion practice', () => {
  beforeEach(() => localStorage.clear());

  it('hides and reveals a field, then records recall locally', () => {
    render(<MemoryRouter><PolyatomicIons /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Memory practice/ }));
    expect(screen.getByText('Formula hidden')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }));
    expect(screen.queryByText('Formula hidden')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'I remembered' }));
    expect(JSON.parse(localStorage.getItem('chemistry-site-progress-v1') ?? '{}').ionPractice.ammonium).toMatchObject({ correct: 1, review: 0 });
    expect(screen.getByText('Hydroxide')).toBeInTheDocument();
  });
});
