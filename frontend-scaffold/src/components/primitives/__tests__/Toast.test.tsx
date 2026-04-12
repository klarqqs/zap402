import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders message correctly', () => {
    render(<Toast message="Operation successful" onClose={() => {}} />);
    expect(screen.getByText('Operation successful')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('applies correct styling for success type', () => {
    render(<Toast message="Success" type="success" onClose={() => {}} />);
    expect(screen.getByRole('alert')).toHaveClass('bg-green-100');
  });

  it('applies correct styling for error type', () => {
    render(<Toast message="Error" type="error" onClose={() => {}} />);
    expect(screen.getByRole('alert')).toHaveClass('bg-red-100');
  });

  it('calls onClose when dismiss button is clicked', () => {
    const handleClose = vi.fn();
    render(<Toast message="Dismissible" onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText('Dismiss');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Dismissible')).toBeNull();
  });

  it('calls onClose after default duration (4000ms)', () => {
    const handleClose = vi.fn();
    render(<Toast message="Auto-dismiss" onClose={handleClose} />);
    
    expect(handleClose).not.toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Auto-dismiss')).toBeNull();
  });

  it('calls onClose after custom duration', () => {
    const handleClose = vi.fn();
    render(<Toast message="Short-lived" duration={1000} onClose={handleClose} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
