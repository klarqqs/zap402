import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div data-testid="child">Test Child</div>
      </Card>
    );
    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByText('Test Child')).toBeDefined();
  });

  it('applies default padding (md)', () => {
    const { container } = render(<Card>Default Padding</Card>);
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('applies small padding (sm)', () => {
    const { container } = render(<Card padding="sm">Small Padding</Card>);
    expect(container.firstChild).toHaveClass('p-4');
  });

  it('applies large padding (lg)', () => {
    const { container } = render(<Card padding="lg">Large Padding</Card>);
    expect(container.firstChild).toHaveClass('p-8');
  });

  it('applies default hover classes when hover prop is true', () => {
    const { container } = render(<Card hover>Hover Card</Card>);
    expect(container.firstChild).toHaveClass('hover:-translate-x-0.5');
    expect(container.firstChild).toHaveClass('hover:-translate-y-0.5');
  });

  it('applies editorial hover classes when variant is editorial', () => {
    const { container } = render(
      <Card variant="editorial" hover>
        Editorial
      </Card>,
    );
    expect(container.firstChild).toHaveClass('rounded-3xl');
    expect(container.firstChild).toHaveClass('hover:border-zap-bg-alt/35');
  });

  it('does not apply hover classes when hover prop is false', () => {
    const { container } = render(<Card hover={false}>No Hover Card</Card>);
    expect(container.firstChild).not.toHaveClass('hover:-translate-x-0.5');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-test">Custom Class</Card>);
    expect(container.firstChild).toHaveClass('custom-test');
  });
});
