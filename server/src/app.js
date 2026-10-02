'use strict';

const path = require('node:path');
const express = require('express');

const { getAllProducts, getProductById, getCategories } = require('./data/products');
const cartService = require('./services/cartService');
const orderService = require('./services/orderService');
const trackingService = require('./services/trackingService');

const SESSION_HEADER = 'x-session-id';

function app() {
  const api = express();
  api.use(express.json());
  api.use(express.static(path.join(__dirname, '..', '..', 'public')));

  const sessionId = (req) => req.get(SESSION_HEADER) || req.ip || 'anonymous';

  api.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'shopverse', uptime: process.uptime() });
  });

  api.get('/api/products', (req, res) => {
    const { category, search, maxPrice } = req.query;
    let items = getAllProducts();
    if (category) items = items.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
    if (search) items = items.filter((p) => p.name.toLowerCase().includes(String(search).toLowerCase()));
    if (maxPrice) items = items.filter((p) => p.price <= Number(maxPrice));
    res.json({ count: items.length, items });
  });

  api.get('/api/products/categories', (req, res) => res.json({ categories: getCategories() }));

  api.get('/api/products/:id', (req, res) => {
    const product = getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'No such product' });
    res.json(product);
  });

  api.get('/api/cart', (req, res) => res.json(cartService.summarise(cartService.getCart(sessionId(req)))));

  api.post('/api/cart/items', (req, res, next) => {
    try {
      const { productId, qty } = req.body || {};
      cartService.addItem(sessionId(req), productId, qty);
      res.status(201).json(cartService.summarise(cartService.getCart(sessionId(req))));
    } catch (err) {
      next(err);
    }
  });

  api.delete('/api/cart/items/:productId', (req, res, next) => {
    try {
      cartService.removeItem(sessionId(req), req.params.productId);
      res.json(cartService.summarise(cartService.getCart(sessionId(req))));
    } catch (err) {
      next(err);
    }
  });

  api.delete('/api/cart', (req, res) => {
    cartService.clearCart(sessionId(req));
    res.status(204).end();
  });

  api.post('/api/orders', (req, res, next) => {
    try {
      const order = orderService.createOrder(sessionId(req), req.body || {});
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  });

  api.get('/api/orders', (req, res) => res.json({ count: orderService.listOrders().length, orders: orderService.listOrders() }));

  api.get('/api/orders/:id', (req, res) => {
    const order = orderService.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'ORDER_NOT_FOUND', message: 'No such order' });
    res.json(order);
  });

  api.get('/api/orders/:id/tracking', (req, res) => {
    const timeline = trackingService.getTimeline(req.params.id);
    if (!timeline) return res.status(404).json({ error: 'TRACKING_NOT_FOUND', message: 'No tracking for this order' });
    res.json(timeline);
  });

  api.post('/api/orders/:id/tracking', (req, res, next) => {
    try {
      const timeline = trackingService.advanceStatus(req.params.id, (req.body || {}).status);
      if (!timeline) return res.status(404).json({ error: 'TRACKING_NOT_FOUND', message: 'No tracking for this order' });
      res.json(timeline);
    } catch (err) {
      next(err);
    }
  });

  api.use((req, res) => res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' }));

  // eslint-disable-next-line no-unused-vars
  api.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.code || 'INTERNAL_ERROR', message: err.message });
  });

  return api;
}

module.exports = app;
