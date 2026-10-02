'use strict';

const crypto = require('node:crypto');
const cartService = require('./cartService');

const orders = new Map();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function createOrder(sessionId, payload) {
  const customer = payload.customer || {};
  const required = ['name', 'email', 'address'];

  for (const field of required) {
    if (!customer[field] || String(customer[field]).trim() === '') {
      const error = new Error(`Customer ${field} is required`);
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
  }

  if (!EMAIL_RE.test(customer.email)) {
    const error = new Error('Customer email is not valid');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (payload.paymentMethod !== 'COD' && payload.paymentMethod !== 'CARD') {
    const error = new Error('paymentMethod must be COD or CARD');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const cart = cartService.getCart(sessionId);
  if (cart.items.length === 0) {
    const error = new Error('Cannot place an order with an empty cart');
    error.status = 400;
    error.code = 'EMPTY_CART';
    throw error;
  }

  const summary = cartService.summarise(cart);
  const order = {
    id: 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    customer: {
      name: String(customer.name).trim(),
      email: String(customer.email).trim().toLowerCase(),
      address: String(customer.address).trim()
    },
    paymentMethod: payload.paymentMethod,
    items: summary.items,
    pricing: summary.pricing,
    status: payload.paymentMethod === 'COD' ? 'CONFIRMED' : 'AWAITING_PAYMENT',
    createdAt: new Date().toISOString()
  };

  orders.set(order.id, order);
  cartService.clearCart(sessionId);
  return order;
}

function getOrder(id) {
  return orders.get(id) || null;
}

function listOrders() {
  return [...orders.values()];
}

function cancelOrder(id) {
  const order = orders.get(id);
  if (!order) return null;
  if (order.status === 'CANCELLED' || order.status === 'SHIPPED') {
    const error = new Error(`Order cannot be cancelled from status ${order.status}`);
    error.status = 409;
    error.code = 'INVALID_STATUS_TRANSITION';
    throw error;
  }
  order.status = 'CANCELLED';
  order.updatedAt = new Date().toISOString();
  return order;
}

/** Test helper - wipes all orders. */
function reset() {
  orders.clear();
}

module.exports = { createOrder, getOrder, listOrders, cancelOrder, reset };
