import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useWallet } from '../useWallet';
import { useWalletStore } from '@/state/walletStore';

// Mock the StellarWalletsKit (Vitest 4 requires a constructible mock, not an arrow factory)
vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: vi.fn(function MockStellarWalletsKit() {
    return {
      openModal: vi.fn(),
      setWallet: vi.fn(),
      getAddress: vi.fn(),
      signTransaction: vi.fn(),
    };
  }),
  WalletNetwork: {
    TESTNET: 'TESTNET',
    PUBLIC: 'PUBLIC',
  },
  FREIGHTER_ID: 'freighter',
  FreighterModule: vi.fn(function MockFreighterModule() {}),
  xBullModule: vi.fn(function MockXBullModule() {}),
}));

// Mock window.freighter
Object.defineProperty(window, 'freighter', {
  value: {
    getNetwork: vi.fn(),
    getAddress: vi.fn(),
  },
  writable: true,
});

type MockKit = {
  openModal: Mock;
  setWallet: Mock;
  getAddress: Mock;
  signTransaction: Mock;
};

async function getLatestMockKit(): Promise<MockKit> {
  const mod = await import('@creit.tech/stellar-wallets-kit');
  const Ctor = mod.StellarWalletsKit as Mock;
  const kit = Ctor.mock.results.at(-1)?.value as MockKit | undefined;
  if (!kit) throw new Error('StellarWalletsKit mock has no instances yet — render useWallet first');
  return kit;
}

describe('useWallet', () => {
  beforeEach(() => {
    // Reset the store before each test (do not vi.clearAllMocks — useWallet caches one kit instance)
    useWalletStore.setState({
      publicKey: null,
      connected: false,
      connecting: false,
      error: null,
      network: 'TESTNET',
    });
  });

  it('should return initial wallet state', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.publicKey).toBeNull();
    expect(result.current.connected).toBe(false);
    expect(result.current.connecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.network).toBe('TESTNET');
  });

  it('should connect wallet and set publicKey', async () => {
    const { result } = renderHook(() => useWallet());
    
    const mockAddress = 'GD1234567890ABCDEF';
    const mockOnWalletSelected = vi.fn();
    
    // Mock the kit.openModal to call the callback with address
    const mockKit = await getLatestMockKit();
    mockKit.openModal.mockImplementation((opts: { onWalletSelected: (o: unknown) => void }) => {
      const { onWalletSelected } = opts;
      mockOnWalletSelected.mockImplementation(async (option: any) => {
        mockKit.setWallet(option.id);
        mockKit.getAddress.mockResolvedValue({ address: mockAddress });
        await onWalletSelected(option);
      });
      return Promise.resolve();
    });

    await act(async () => {
      result.current.connect();
    });

    // Simulate wallet selection
    await act(async () => {
      await mockOnWalletSelected({ id: 'freighter' });
    });

    await waitFor(() => {
      expect(result.current.publicKey).toBe(mockAddress);
      expect(result.current.connected).toBe(true);
      expect(result.current.connecting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should disconnect wallet and clear state', () => {
    // First set up a connected state
    useWalletStore.setState({
      publicKey: 'GD1234567890ABCDEF',
      connected: true,
      connecting: false,
      error: null,
      network: 'TESTNET',
    });

    const { result } = renderHook(() => useWallet());

    expect(result.current.publicKey).toBe('GD1234567890ABCDEF');
    expect(result.current.connected).toBe(true);

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.publicKey).toBeNull();
    expect(result.current.connected).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('connectWithWallet surfaces Freighter hint when getAddress rejects a non-Error', async () => {
    const { result } = renderHook(() => useWallet());
    const mockKit = await getLatestMockKit();
    mockKit.getAddress.mockRejectedValue({ err: 'extension missing' });

    let out: { ok: boolean; errorMessage: string | null } = {
      ok: true,
      errorMessage: null,
    };

    await act(async () => {
      out = await result.current.connectWithWallet('freighter');
    });

    expect(out.ok).toBe(false);
    expect(out.errorMessage).toMatch(/freighter\.app/i);
    expect(result.current.error).toMatch(/freighter\.app/i);
  });

  it('should handle connection errors', async () => {
    const { result } = renderHook(() => useWallet());
    
    const mockOnWalletSelected = vi.fn();
    
    const mockKit = await getLatestMockKit();
    mockKit.openModal.mockImplementation((opts: { onWalletSelected: (o: unknown) => void }) => {
      const { onWalletSelected } = opts;
      mockOnWalletSelected.mockImplementation(async (option: any) => {
        mockKit.setWallet(option.id);
        mockKit.getAddress.mockRejectedValue(new Error('Connection failed'));
        await onWalletSelected(option);
      });
      return Promise.resolve();
    });

    await act(async () => {
      result.current.connect();
    });

    // Simulate wallet selection with error
    await act(async () => {
      await mockOnWalletSelected({ id: 'freighter' });
    });

    await waitFor(() => {
      expect(result.current.publicKey).toBeNull();
      expect(result.current.connected).toBe(false);
      expect(result.current.connecting).toBe(false);
      expect(result.current.error).toBe('Connection failed');
    });
  });

  it('should set network', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.network).toBe('TESTNET');

    act(() => {
      result.current.setNetwork('PUBLIC');
    });

    expect(result.current.network).toBe('PUBLIC');
  });

  it('should sign transaction', async () => {
    const mockXdr = 'AAAAAgAAAAA=';
    const mockSignedXdr = 'AAAAAwAAAAA=';
    
    // Set up connected state
    useWalletStore.setState({
      publicKey: 'GD1234567890ABCDEF',
      connected: true,
      connecting: false,
      error: null,
      network: 'TESTNET',
    });

    const { result } = renderHook(() => useWallet());
    
    const mockKit = await getLatestMockKit();
    mockKit.signTransaction.mockResolvedValue({ signedTxXdr: mockSignedXdr });

    const signedTx = await result.current.signTransaction(mockXdr);

    expect(signedTx).toBe(mockSignedXdr);
    expect(mockKit.signTransaction).toHaveBeenCalledWith(mockXdr, {
      address: 'GD1234567890ABCDEF',
    });
  });
});
