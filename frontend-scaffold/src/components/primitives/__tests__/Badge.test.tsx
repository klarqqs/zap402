import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';
import { getTierFromScore } from '@/utils/badge';

describe('Badge Component', () => {
  it('renders new tier correctly', () => {
    const { container } = render(<Badge tier="new" />);
    expect(screen.getByText('NEW')).toBeDefined();
    expect(screen.getByText('●')).toBeDefined();
    expect(container.firstChild).toHaveClass('text-zap-ink-muted');
  });

  it('renders bronze tier correctly', () => {
    const { container } = render(<Badge tier="bronze" />);
    expect(screen.getByText('BRONZE')).toBeDefined();
    expect(screen.getByText('●')).toBeDefined();
    expect(container.firstChild).toHaveClass('text-zap-gold');
  });

  it('renders silver tier correctly', () => {
    const { container } = render(<Badge tier="silver" />);
    expect(screen.getByText('SILVER')).toBeDefined();
    expect(screen.getByText('●')).toBeDefined();
    expect(container.firstChild).toHaveClass('text-zap-ink-muted');
  });

  it('renders gold tier correctly', () => {
    const { container } = render(<Badge tier="gold" />);
    expect(screen.getByText('GOLD')).toBeDefined();
    expect(screen.getByText('●')).toBeDefined();
    expect(container.firstChild).toHaveClass('text-zap-gold');
  });

  it('renders diamond tier correctly', () => {
    const { container } = render(<Badge tier="diamond" />);
    expect(screen.getByText('DIAMOND')).toBeDefined();
    expect(screen.getByText('●')).toBeDefined();
    expect(container.firstChild).toHaveClass('text-zap-teal');
  });

  it('displays score when provided', () => {
    render(<Badge tier="gold" score={50} />);
    expect(screen.getByText('(50)')).toBeDefined();
  });

  it('does not display score when not provided', () => {
    render(<Badge tier="gold" />);
    expect(screen.queryByText('(')).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(<Badge tier="bronze" className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });
});

describe('getTierFromScore utility', () => {
  it('returns correctly for various scores', () => {
    expect(getTierFromScore(0)).toBe('new');
    expect(getTierFromScore(19)).toBe('new');
    expect(getTierFromScore(20)).toBe('bronze');
    expect(getTierFromScore(39)).toBe('bronze');
    expect(getTierFromScore(40)).toBe('silver');
    expect(getTierFromScore(59)).toBe('silver');
    expect(getTierFromScore(60)).toBe('gold');
    expect(getTierFromScore(79)).toBe('gold');
    expect(getTierFromScore(80)).toBe('diamond');
    expect(getTierFromScore(100)).toBe('diamond');
  });
});
