import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input Component', () => {
  it('renders label correctly', () => {
    render(<Input label="Username" id="user-input" />);
    expect(screen.getByLabelText('Username')).toBeDefined();
    expect(screen.getByText('Username')).toBeDefined();
  });

  it('renders without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.queryByRole('label')).toBeNull();
    expect(screen.getByPlaceholderText('Enter text')).toBeDefined();
  });

  it('displays error message correctly', () => {
    render(<Input label="Username" error="Field required" />);
    expect(screen.getByText('Field required')).toBeDefined();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-600');
  });

  it('doesn\'t display error message when not provided', () => {
    render(<Input label="Username" />);
    expect(screen.queryByText('Field required')).toBeNull();
    expect(screen.getByRole('textbox')).not.toHaveClass('border-red-600');
  });

  it('fires onChange event correctly', () => {
    const handleChange = vi.fn();
    render(<Input label="Username" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('testuser');
  });

  it('applies standard accessibility attributes (id, auto-generated id)', () => {
    const { rerender } = render(<Input label="Email Address" />);
    const input = screen.getByRole('textbox');
    expect(input.id).toBe('email-address');

    rerender(<Input label="Email Address" id="custom-id" />);
    expect(screen.getByRole('textbox').id).toBe('custom-id');
  });

  it('passes other props correctly', () => {
    render(<Input type="password" disabled data-testid="test-input" />);
    const input = screen.getByTestId('test-input');
    expect(input).toHaveProperty('type', 'password');
    expect(input).toBeDisabled();
  });
});
