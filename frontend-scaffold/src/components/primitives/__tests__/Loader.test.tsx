import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader Component', () => {
  it('renders correctly with default size (md)', () => {
    const { container } = render(<Loader />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeDefined();
    expect(spinner).toHaveClass('w-8');
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('border-t-zap-teal');
  });

  it('renders small size (sm)', () => {
    const { container } = render(<Loader size="sm" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-4');
    expect(spinner).toHaveClass('h-4');
    expect(spinner).toHaveClass('border-2');
  });

  it('renders large size (lg)', () => {
    const { container } = render(<Loader size="lg" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-12');
    expect(spinner).toHaveClass('h-12');
    expect(spinner).toHaveClass('border-t-zap-teal');
  });

  it('displays loading text when provided', () => {
    render(<Loader text="Calculating tipping points..." />);
    expect(screen.getByText('Calculating tipping points...')).toBeDefined();
  });

  it('does not display text when not provided', () => {
    const { container } = render(<Loader />);
    expect(container.querySelector('p')).toBeNull();
  });
});
