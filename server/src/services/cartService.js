'use strict';

const { getProductById } = require('../data/products');

const MAX_QTY_PER_LINE = 10;
const FREE_SHIPPING_THRESHOLD = 999;
const BASE_SHIPPING_CHARGE = 49;

/** Per-session cart kept in memory. sessionId -> { items: [] } */
const carts = new Map();

function getCart(sessionId) {
  if (!carts.has(sessionId)) {
    carts.set(sessionId, { items: [] });
  }
  return carts.get(sessionId);
}

function addItem(sessionId, productId, qty) {
  const product = getProductById(productId);
  if (!product) {
    const error = new Error(`Product ${productId} does not exist`);
    error.status = 404;
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  const quantity = Number(qty);
  if (!Number.isInteger(quantity) || quantity < 1) {
    const error = new Error('Quantity must be a positive whole number');
    error.status = 400;
    error.code = 'INVALID_QUANTITY';
    throw error;
  }

  if (quantity > MAX_QTY_PER_LINE) {
    const error = new Error(`Maximum ${MAX_QTY_PER_LINE} units per product`);
    error.status = 400;
    error.code = 'MAX_QUTY_EXCEEDED';
    throw error;
  }

  const cart = getCart(sessionId);
  const existing = cart.items.find((item) => item.productId === productId);

  if (existing) {
    existing.qty += quantity;
    if (existing.qty > product.stock) {
      existing.qty -= quantity;
      const error = new Error(`Only ${product.stock} units of ${product.name} in stock`);
      error.status = 409;
      error.code = 'INSUFFICIENT_STOCK';
      throw error;
    }
  } else {
    if (quantity > product.stock) {
      const error = new Error(`Only ${product.stock} units of ${product.name} in stock`);
      error.status = 409;
      error.code = 'INSUFFICIENT_STOCK';
      throw error;
    }
    cart.items.push({ productId, qty: quantity });
  }

  return cart;
}

function removeItem(sessionId, productId) {
  const cart = getCart(sessionId);
  const index = cart.items.findIndex((item) => item.productId === productId);
  if (index === -1) {
    const error = new Error(`Product ${productId} is not in the cart`);
    error.status = 404;
    error.code = 'ITEM_NOT_FOUND';
    throw error;
  }
  cart.items.splice(index, 1);
  return cart;
}

function clearCart(sessionId) {
  const cart = getCart(sessionId);
  cart.items = [];
  return cart;
}

/** Enriches cart lines with live product data and money totals. */
function summarise(cart) {
  const items = cart.items.map((line) => {
    const product = getProductById(line.productId);
    return {
      productId: line.productId,
      name: product ? product.name : 'Unavailable',
      image: product ? product.image : '📦',
      unitPrice: product ? product.price : 0,
      qty: line.qty,
      lineTotal: product ? product.price * line.qty : 0
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_CHARGE;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.qty, 0),
    pricing: {
      subtotal,
      shipping,
      tax,
      discount: subtotal >= 4999 ? Math.round(subtotal * 0.1) : 0,
      total: total - (subtotal >= 4999 ? Math.round(subtotal * 0.1) : 0)
    }
  };
}

/** Test helper - wipes all sessions. */
function reset() {
  carts.clear();
}

module.exports = { getCart, addItem, removeItem, clearCart, summarise, reset, MAX_QTY_PER_LINE };
