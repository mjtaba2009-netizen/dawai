import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// عنصر السلة — يحمل بيانات سطر الطلب كاملةً حتى نتمكن من إنشاء طلب لكل صيدلية
export interface CartItem {
  id: number;            // معرّف مخزون الصيدلية (pharmacy_medication) — مفتاح فريد للسطر
  medicationId: number;
  pharmacyId: number;
  pharmacyName: string;
  name: string;
  price: number;
  requiresPrescription: boolean;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
  hasPrescriptionItem: boolean;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'dawai_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // المزامنة مع التخزين المحلي عند كل تغيير
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* تجاهل أخطاء التخزين (وضع التصفح الخاص مثلاً) */
    }
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: number, qty: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const hasPrescriptionItem = items.some((i) => i.requiresPrescription);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, totalCount, totalPrice, hasPrescriptionItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
