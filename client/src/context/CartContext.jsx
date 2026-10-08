import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

// Stok listesi tarayıcıda kullanıcı başına saklanır; sayfa yenilense de kaybolmaz.
export function CartProvider({ children }) {
  const { user } = useAuth();
  const storageKey = user ? `cart:${user.id}` : null;
  const [cart, setCart] = useState([]); // ürün objelerinin listesi

  useEffect(() => {
    if (!storageKey) {
      setCart([]);
      return;
    }
    try {
      setCart(JSON.parse(localStorage.getItem(storageKey)) || []);
    } catch {
      setCart([]);
    }
  }, [storageKey]);

  function update(fn) {
    setCart((prev) => {
      const next = fn(prev);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // depolama dolu ya da kapalıysa sadece bellekte kalır
        }
      }
      return next;
    });
  }

  function addToCart(product) {
    update((prev) =>
      prev.some((p) => p.id === product.id) ? prev : [...prev, product],
    );
  }

  function removeFromCart(productId) {
    update((prev) => prev.filter((p) => p.id !== productId));
  }

  function isInCart(productId) {
    return cart.some((p) => p.id === productId);
  }

  function clearCart() {
    update(() => []);
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, isInCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
