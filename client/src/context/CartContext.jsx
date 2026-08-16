import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // vehicle objelerinin listesi

  function addToCart(vehicle) {
    setCart((prev) => {
      if (prev.some((v) => v.id === vehicle.id)) return prev; // zaten ekliyse tekrar ekleme
      return [...prev, vehicle];
    });
  }

  function removeFromCart(vehicleId) {
    setCart((prev) => prev.filter((v) => v.id !== vehicleId));
  }

  function isInCart(vehicleId) {
    return cart.some((v) => v.id === vehicleId);
  }

  function clearCart() {
    setCart([]);
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
