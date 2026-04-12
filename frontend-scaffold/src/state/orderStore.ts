import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrderStatus = "ongoing" | "completed" | "failed";

export type OrderItem = {
  name: string;
  price: number;
  imageUrl?: string;
  link?: string;
};

export type Order = {
  id: string;
  title: string;
  category: string;
  status: OrderStatus;
  items: OrderItem[];
  totalPaid: number;
  txHash?: string;
  createdAt: number;
  updatedAt: number;
  chatId?: string;
  notes?: string;
};

type OrderStore = {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => string;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  completeOrder: (id: string) => void;
  failOrder: (id: string) => void;
  getOrder: (id: string) => Order | undefined;
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => {
        const id = `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = Date.now();
        set((s) => ({
          orders: [
            ...s.orders,
            { ...order, id, createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },
      updateOrder: (id, patch) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, ...patch, updatedAt: Date.now() } : o
          ),
        }));
      },
      completeOrder: (id) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? { ...o, status: "completed", updatedAt: Date.now() }
              : o
          ),
        }));
      },
      failOrder: (id) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? { ...o, status: "failed", updatedAt: Date.now() }
              : o
          ),
        }));
      },
      getOrder: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: "sumr-orders" }
  )
);