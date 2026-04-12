import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal Component', () => {
  it('renders modal content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeDefined();
    expect(screen.getByTestId('modal-content')).toBeDefined();
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('does not render modal content when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    expect(screen.queryByText('Test Modal')).toBeNull();
    expect(screen.queryByTestId('modal-content')).toBeNull();
  });

  it('calls onClose when close button (X) is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    
    const backdrop = screen.getByRole('presentation');
    fireEvent.click(backdrop);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders without a title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    expect(screen.queryByText('Test Modal')).toBeNull();
    expect(screen.getByTestId('modal-content')).toBeDefined();
  });
});
