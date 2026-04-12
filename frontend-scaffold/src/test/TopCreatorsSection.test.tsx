import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";

import TopCreatorsSection from "@/sections/landing/TopCreatorsSection";
import * as hooks from "@/hooks";

vi.mock("@/config/env", async () => {
  const actual = await vi.importActual<typeof import("@/config/env")>("@/config/env");
  return {
    ...actual,
    env: { ...actual.env, contractConfigured: true },
  };
});

const mockOpenWalletConnect = vi.fn();

vi.mock("@/components/wallet/WalletConnectModal", () => ({
  useOpenWalletConnect: () => mockOpenWalletConnect,
}));

vi.mock("@/hooks", () => ({
  useContract: vi.fn(),
  useWallet: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockNetworkData = [
  { address: "G1", username: "user1", totalTipsReceived: "100", creditScore: 500 },
  { address: "G2", username: "user2", totalTipsReceived: "200", creditScore: 600 },
  { address: "G3", username: "user3", totalTipsReceived: "300", creditScore: 700 },
  { address: "G4", username: "user4", totalTipsReceived: "400", creditScore: 800 },
  { address: "G5", username: "user5", totalTipsReceived: "500", creditScore: 900 },
  { address: "G6", username: "user6", totalTipsReceived: "600", creditScore: 910 },
];

describe("TopCreatorsSection", () => {
  const mockGetNetwork = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenWalletConnect.mockClear();
    vi.mocked(hooks.useContract).mockReturnValue({
      getNetwork: mockGetNetwork,
    } as unknown as ReturnType<typeof hooks.useContract>);
    vi.mocked(hooks.useWallet).mockReturnValue({
      connected: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      connecting: false,
      error: null,
      publicKey: "GTEST",
      network: "TESTNET",
      setNetwork: vi.fn(),
      signTransaction: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useWallet>);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <TopCreatorsSection />
      </BrowserRouter>
    );

  it("renders loading state with 6 skeleton cards", () => {
    mockGetNetwork.mockReturnValue(new Promise(() => {}));
    renderComponent();

    const grid = screen.getByTestId("top-creators-loading-grid");
    expect(within(grid).getAllByTestId("top-creator-skeleton-card")).toHaveLength(6);
    expect(
      screen.getByText(/Loading top earners by zap volume/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open terminal for balances and activity/i }),
    ).toBeInTheDocument();
  });

  it("renders empty state when no creators exist", async () => {
    mockGetNetwork.mockResolvedValue([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No earners in this view/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        /Creators are registered, but this list only fills after completed zaps/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^SHARE PAGE$/i })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      screen.getByRole("link", { name: /^ACCESS TERMINAL$/i }),
    ).toHaveAttribute("href", "/terminal");
    expect(screen.queryByTestId("top-creator-card")).not.toBeInTheDocument();
    expect(screen.getByText(/No earners in this view/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open terminal for balances and activity/i }),
    ).toBeInTheDocument();
  });

  it("shows only Connect Wallet when disconnected and board is empty", async () => {
    vi.mocked(hooks.useWallet).mockReturnValue({
      connected: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      connecting: false,
      error: null,
      publicKey: null,
      network: "TESTNET",
      setNetwork: vi.fn(),
      signTransaction: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useWallet>);
    mockGetNetwork.mockResolvedValue([]);
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Connect Wallet/i }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: /^SHARE PAGE$/i })).toBeNull();
    expect(
      screen.queryByRole("link", { name: /^ACCESS TERMINAL$/i }),
    ).toBeNull();
  });

  it("renders top 6 creators when data is available", async () => {
    mockGetNetwork.mockResolvedValue(mockNetworkData);
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId("top-creator-card")).toHaveLength(6);
    });

    mockNetworkData.forEach((creator) => {
      expect(screen.getByText(`@${creator.username}`)).toBeInTheDocument();
    });

    expect(mockGetNetwork).toHaveBeenCalledWith(6);
    const terminalLinks = screen.getAllByRole("link", {
      name: /open terminal for balances and activity/i,
    });
    expect(terminalLinks).toHaveLength(2);
    terminalLinks.forEach((el) => {
      expect(el).toHaveAttribute("href", "/terminal");
    });
  });

  it("handles error state gracefully", async () => {
    mockGetNetwork.mockRejectedValue(new Error("Fetch failed"));
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /^Connection issue$/i }),
      ).toBeInTheDocument();
    });
  });

  it("links to Terminal from section CTAs", async () => {
    mockGetNetwork.mockResolvedValue(mockNetworkData);
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId("top-creator-card")).toHaveLength(6);
    });

    screen.getAllByRole("link", { name: /open terminal for balances and activity/i }).forEach((el) => {
      expect(el).toHaveAttribute("href", "/terminal");
    });
  });
});
