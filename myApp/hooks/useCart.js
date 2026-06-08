/**
 * useCart.js — Shopping cart context and hook
 *
 * The cart holds investment "items" — each item is:
 *   { project, amount, currency, minAmount }
 *
 * Cart state lives entirely in memory (no persistence).  When the user
 * navigates away or restarts the app the cart resets — this is intentional
 * because investment amounts are time-sensitive and the user should
 * consciously re-select them each session.
 *
 * Null-context fallback
 * ─────────────────────
 * useCart() outside CartProvider returns an inert object so isolated
 * component tests never throw.
 */

import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

/**
 * Coerce an amount to a safe positive integer.
 * Returns `fallback` when the value is non-finite, zero, or negative.
 */
const sanitizeAmount = (amount, fallback = 100) => {
  const next = Number(amount);
  if (!Number.isFinite(next) || next <= 0) return fallback;
  return Math.round(next);
};

// ─── useCart hook ─────────────────────────────────────────────────────────────
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    return {
      items:               [],
      addToCart:           () => {},
      removeFromCart:      () => {},
      updateAmount:        () => {},
      clearCart:           () => {},
      totalAmount:         0,
      totalCount:          0,
      isInCart:            () => false,
      getItemByProjectId:  () => null,
    };
  }

  return context;
};

// ─── CartProvider ─────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  /**
   * Add a project to the cart or update its amount if already present.
   * Amount is always clamped to minAmount so the user can never invest below
   * the project's minimum — even if the UI passes a lower value.
   *
   * @param {object} project - Normalised project object
   * @param {number} amount  - Requested investment amount
   * @param {object} meta    - Optional overrides: { minAmount, currency }
   */
  const addToCart = (project, amount = 100, meta = {}) => {
    const minAmount  = Number(meta.minAmount || project?.minInvestment || 5);
    const nextAmount = Math.max(minAmount, sanitizeAmount(amount, minAmount));

    setItems((prev) => {
      const existing = prev.find((item) => item.project.id === project.id);

      if (existing) {
        // Project already in cart — update amount and currency only
        return prev.map((item) =>
          item.project.id === project.id
            ? { ...item, amount: nextAmount, currency: meta.currency || item.currency || 'LYD', minAmount }
            : item
        );
      }

      // New item — append to the end
      return [
        ...prev,
        {
          project,
          amount:   nextAmount,
          currency: meta.currency || project?.currencyCode || 'LYD',
          minAmount,
        },
      ];
    });
  };

  const removeFromCart = (projectId) => {
    setItems((prev) => prev.filter((item) => item.project.id !== projectId));
  };

  /**
   * Update the investment amount for one cart item.
   * Amount is clamped to the item's minAmount so validation is always enforced.
   */
  const updateAmount = (projectId, amount) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.project.id !== projectId) return item;
        const minAmount = Number(item.minAmount || item.project?.minInvestment || 5);
        return { ...item, amount: Math.max(minAmount, sanitizeAmount(amount, minAmount)) };
      })
    );
  };

  const clearCart = () => setItems([]);

  // Derived values — recomputed on every render (cheap because cart is small)
  const totalAmount         = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalCount          = items.length;
  const isInCart            = (projectId) => items.some((item) => item.project.id === projectId);
  const getItemByProjectId  = (projectId) => items.find((item) => item.project.id === projectId) || null;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateAmount,
        clearCart,
        totalAmount,
        totalCount,
        isInCart,
        getItemByProjectId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
