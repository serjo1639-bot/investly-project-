/**
 * useCart.js — My Investments context and hook
 *
 * This small in-memory store powers the "My Investments" screen.
 * Each item is either:
 *   { status: 'saved', project, amount, currency, minAmount }
 *   { status: 'invested', project, amount, currency, minAmount, investedAt }
 *
 * State lives in memory and is cleared when the active role is not investor.
 * That keeps this graduation-project version simple and prevents one role
 * from seeing another role's local saved/invested list on the same device.
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
      savedItems:          [],
      investedItems:       [],
      addToCart:           () => {},
      addSavedProject:     () => {},
      toggleSavedProject:  () => {},
      markProjectInvested: () => {},
      removeFromCart:      () => {},
      removeSavedProject:  () => {},
      updateAmount:        () => {},
      clearCart:           () => {},
      totalAmount:         0,
      totalCount:          0,
      isInCart:            () => false,
      isSaved:             () => false,
      isInvested:          () => false,
      getItemByProjectId:  () => null,
    };
  }

  return context;
};

// ─── CartProvider ─────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  /**
   * Add or update a project in the My Investments store.
   * Amount is always clamped to minAmount so the user can never invest below
   * the project's minimum — even if the UI passes a lower value.
   *
   * @param {object} project - Normalised project object
   * @param {number} amount  - Requested investment amount
   * @param {object} meta    - Optional overrides: { minAmount, currency }
   */
  const upsertProject = (project, amount = 100, meta = {}) => {
    const minAmount  = Number(meta.minAmount || project?.minInvestment || 5);
    const nextAmount = Math.max(minAmount, sanitizeAmount(amount, minAmount));
    const nextStatus = meta.status || 'saved';

    setItems((prev) => {
      const existing = prev.find((item) => item.project.id === project.id);

      if (existing) {
        // Keep invested projects invested unless this call explicitly changes status.
        const status = meta.status || existing.status || 'saved';
        return prev.map((item) =>
          item.project.id === project.id
            ? {
                ...item,
                project,
                status,
                amount: nextAmount,
                currency: meta.currency || item.currency || 'LYD',
                minAmount,
                investedAt: status === 'invested' ? (item.investedAt || new Date().toISOString()) : item.investedAt,
              }
            : item
        );
      }

      // New item — append to the end so the newest saved project is easy to find.
      return [
        ...prev,
        {
          project,
          status:   nextStatus,
          amount:   nextAmount,
          currency: meta.currency || project?.currencyCode || 'LYD',
          minAmount,
          investedAt: nextStatus === 'invested' ? new Date().toISOString() : null,
        },
      ];
    });
  };

  // Backwards-compatible name used by existing screens; now it means "save".
  const addToCart = (project, amount = 100, meta = {}) =>
    upsertProject(project, amount, { ...meta, status: meta.status || 'saved' });

  const addSavedProject = addToCart;

  const markProjectInvested = (project, amount = 100, meta = {}) =>
    upsertProject(project, amount, { ...meta, status: 'invested' });

  const toggleSavedProject = (project, amount = 100, meta = {}) => {
    const projectId = project?.id;
    if (!projectId) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.project.id === projectId);
      if (existing?.status === 'saved') {
        return prev.filter((item) => item.project.id !== projectId);
      }
      if (existing?.status === 'invested') {
        // Already invested projects stay tracked; the heart cannot remove them.
        return prev;
      }
      const minAmount = Number(meta.minAmount || project?.minInvestment || 5);
      return [
        ...prev,
        {
          project,
          status: 'saved',
          amount: Math.max(minAmount, sanitizeAmount(amount, minAmount)),
          currency: meta.currency || project?.currencyCode || 'LYD',
          minAmount,
          investedAt: null,
        },
      ];
    });
  };

  const removeFromCart = (projectId) => {
    setItems((prev) => prev.filter((item) => item.project.id !== projectId));
  };

  const removeSavedProject = (projectId) => {
    setItems((prev) => prev.filter((item) => item.project.id !== projectId || item.status !== 'saved'));
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
  const savedItems          = items.filter((item) => item.status !== 'invested');
  const investedItems       = items.filter((item) => item.status === 'invested');
  const totalAmount         = investedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalCount          = items.length;
  const isInCart            = (projectId) => items.some((item) => item.project.id === projectId);
  const isSaved             = (projectId) => items.some((item) => item.project.id === projectId && item.status !== 'invested');
  const isInvested          = (projectId) => items.some((item) => item.project.id === projectId && item.status === 'invested');
  const getItemByProjectId  = (projectId) => items.find((item) => item.project.id === projectId) || null;

  return (
    <CartContext.Provider
      value={{
        items,
        savedItems,
        investedItems,
        addToCart,
        addSavedProject,
        toggleSavedProject,
        markProjectInvested,
        removeFromCart,
        removeSavedProject,
        updateAmount,
        clearCart,
        totalAmount,
        totalCount,
        isInCart,
        isSaved,
        isInvested,
        getItemByProjectId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
