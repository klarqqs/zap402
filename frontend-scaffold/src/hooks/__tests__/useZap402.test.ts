import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useZap402 } from '../useZap402';
import { useContract } from '../useContract';

// Mock the useContract hook
vi.mock('../useContract');
const mockUseContract = vi.mocked(useContract);

describe('useZap402', () => {
  const mockContractSendZap = vi.fn();
  const mockContractWithdrawTips = vi.fn();

  beforeEach(() => {
    mockContractSendZap.mockClear();
    mockContractWithdrawTips.mockClear();
    
    mockUseContract.mockReturnValue({
      sendZap: mockContractSendZap,
      withdrawTips: mockContractWithdrawTips,
    } as any);
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useZap402());

    expect(result.current.sending).toBe(false);
    expect(result.current.withdrawing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBeNull();
    expect(result.current.txStatus).toBe('idle');
    expect(typeof result.current.sendZap).toBe('function');
    expect(typeof result.current.withdrawTips).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should handle successful tip sending', async () => {
    const { result } = renderHook(() => useZap402());
    
    const mockTxHash = 'tx_hash_123';
    mockContractSendZap.mockResolvedValue(mockTxHash);

    await act(async () => {
      await result.current.sendZap('creator_address', '1000', 'Great content!');
    });

    expect(mockContractSendZap).toHaveBeenCalledWith('creator_address', '1000', 'Great content!');

    await waitFor(() => {
      expect(result.current.txStatus).toBe('success');
      expect(result.current.sending).toBe(false);
      expect(result.current.txHash).toBe(mockTxHash);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle tip sending error', async () => {
    const { result } = renderHook(() => useZap402());
    
    const errorMessage = 'Insufficient balance';
    mockContractSendZap.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      try {
        await result.current.sendZap('creator_address', '1000', 'Great content!');
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.txStatus).toBe('error');
      expect(result.current.sending).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.txHash).toBeNull();
    });
  });

  it('should handle successful withdrawal', async () => {
    const { result } = renderHook(() => useZap402());
    
    const mockTxHash = 'withdraw_tx_hash_456';
    mockContractWithdrawTips.mockResolvedValue(mockTxHash);

    await act(async () => {
      await result.current.withdrawTips('5000');
    });

    expect(mockContractWithdrawTips).toHaveBeenCalledWith('5000');

    await waitFor(() => {
      expect(result.current.txStatus).toBe('success');
      expect(result.current.withdrawing).toBe(false);
      expect(result.current.txHash).toBe(mockTxHash);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle withdrawal error', async () => {
    const { result } = renderHook(() => useZap402());
    
    const errorMessage = 'Withdrawal failed';
    mockContractWithdrawTips.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      try {
        await result.current.withdrawTips('5000');
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.txStatus).toBe('error');
      expect(result.current.withdrawing).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.txHash).toBeNull();
    });
  });

  it('should reset state', async () => {
    const { result } = renderHook(() => useZap402());
    
    // First, trigger an error state
    mockContractSendZap.mockRejectedValue(new Error('Test error'));

    await act(async () => {
      try {
        await result.current.sendZap('creator_address', '1000', 'Test');
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.txStatus).toBe('error');
      expect(result.current.error).toBe('Test error');
    });

    // Reset the state
    act(() => {
      result.current.reset();
    });

    expect(result.current.sending).toBe(false);
    expect(result.current.withdrawing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBeNull();
    expect(result.current.txStatus).toBe('idle');
  });

  it('should show signing state during tip sending', async () => {
    const { result } = renderHook(() => useZap402());
    
    let resolveTip: (value: string) => void;
    const tipPromise = new Promise<string>((resolve) => {
      resolveTip = resolve;
    });

    mockContractSendZap.mockReturnValue(tipPromise);

    await act(async () => {
      result.current.sendZap('creator_address', '1000', 'Test');
    });

    expect(result.current.txStatus).toBe('signing');
    expect(result.current.sending).toBe(true);

    // Resolve the promise
    act(() => {
      resolveTip!('tx_hash_123');
    });

    await waitFor(() => {
      expect(result.current.txStatus).toBe('success');
      expect(result.current.sending).toBe(false);
    });
  });

  it('should show signing state during withdrawal', async () => {
    const { result } = renderHook(() => useZap402());
    
    let resolveWithdraw: (value: string) => void;
    const withdrawPromise = new Promise<string>((resolve) => {
      resolveWithdraw = resolve;
    });

    mockContractWithdrawTips.mockReturnValue(withdrawPromise);

    await act(async () => {
      result.current.withdrawTips('5000');
    });

    expect(result.current.txStatus).toBe('signing');
    expect(result.current.withdrawing).toBe(true);

    // Resolve the promise
    act(() => {
      resolveWithdraw!('withdraw_tx_hash_456');
    });

    await waitFor(() => {
      expect(result.current.txStatus).toBe('success');
      expect(result.current.withdrawing).toBe(false);
    });
  });

  it('should handle non-Error objects in error handling', async () => {
    const { result } = renderHook(() => useZap402());
    
    // Mock rejection with a string instead of Error
    mockContractSendZap.mockRejectedValue('String error');

    await act(async () => {
      try {
        await result.current.sendZap('creator_address', '1000', 'Test');
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.txStatus).toBe('error');
      expect(result.current.sending).toBe(false);
      expect(result.current.error).toBe('Failed to send zap');
    });
  });

  it('should clear previous state when starting new operation', async () => {
    const { result } = renderHook(() => useZap402());
    
    // Start with an error state
    mockContractSendZap.mockRejectedValueOnce(new Error('First error'));

    await act(async () => {
      try {
        await result.current.sendZap('creator_address', '1000', 'Test');
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.txStatus).toBe('error');
      expect(result.current.error).toBe('First error');
    });

    // Start a successful tip
    mockContractSendZap.mockResolvedValue('tx_hash_123');

    await act(async () => {
      await result.current.sendZap('creator_address', '2000', 'Another tip');
    });

    // State should be reset before the new operation
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBe('tx_hash_123');
    expect(result.current.txStatus).toBe('success');
  });
});
