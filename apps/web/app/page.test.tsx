import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home page', () => {
  it('renders primary CTA', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: /Try the Agent/i })).toBeInTheDocument();
  });
});


