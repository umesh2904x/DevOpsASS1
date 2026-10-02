'use strict';

/**
 * Seed catalogue for ShopVerse.
 * In a real deployment this would be replaced by a database repository,
 * but an in-memory store keeps the CI pipeline fast and deterministic.
 */
const products = [
  {
    id: 'P-1001',
    name: 'Aurora Wireless Headphones',
    brand: 'Aurora',
    category: 'Audio',
    price: 7499,
    stock: 24,
    rating: 4.5,
    image: '🎧',
    description: 'Active noise cancellation with 40 hour battery life.',
    tags: ['wireless', 'anc', 'bluetooth']
  },
  {
    id: 'P-1002',
    name: 'Nimbus Smart Watch',
    brand: 'Nimbus',
    category: 'Wearables',
    price: 12999,
    stock: 12,
    rating: 4.2,
    image: '⌚',
    description: 'AMOLED display, SpO2 tracking and 7 day battery.',
    tags: ['fitness', 'heart-rate', 'waterproof']
  },
  {
    id: 'P-1003',
    name: 'Vertex Mechanical Keyboard',
    brand: 'Vertex',
    category: 'Accessories',
    price: 4299,
    stock: 8,
    rating: 4.8,
    image: '⌨️',
    description: 'Hot-swappable switches, PBT keycaps, USB-C braided cable.',
    tags: ['mechanical', 'rgb', 'gaming']
  },
  {
    id: 'P-1004',
    name: 'Lumen 4K Monitor 27"',
    brand: 'Lumen',
    category: 'Displays',
    price: 27999,
    stock: 5,
    rating: 4.6,
    image: '🖥️',
    description: 'IPS panel, 144Hz, 99% sRGB with height adjustable stand.',
    tags: ['4k', 'monitor', 'ips']
  },
  {
    id: 'P-1005',
    name: 'Terra Organic Cotton T-Shirt',
    brand: 'Terra',
    category: 'Apparel',
    price: 899,
    stock: 60,
    rating: 4.1,
    image: '👕',
    description: 'GOTS certified organic cotton, bio-washed for softness.',
    tags: ['cotton', 'organic', 'unisex']
  },
  {
    id: 'P-1006',
    name: 'Cascade Running Shoes',
    brand: 'Cascade',
    category: 'Footwear',
    price: 3499,
    stock: 31,
    rating: 4.4,
    image: '👟',
    description: 'Responsive foam midsole with breathable engineered knit upper.',
    tags: ['running', 'sports', 'lightweight']
  },
  {
    id: 'P-1007',
    name: 'Pulse Fitness Band',
    brand: 'Pulse',
    category: 'Wearables',
    price: 2199,
    stock: 45,
    rating: 3.9,
    image: '💪',
    description: 'Sleep, stress and continuous heart rate monitoring.',
    tags: ['fitness', 'budget', 'tracker']
  },
  {
    id: 'P-1008',
    name: 'Halo Desk Lamp',
    brand: 'Halo',
    category: 'Home',
    price: 1899,
    stock: 19,
    rating: 4.3,
    image: '💡',
    description: 'Flicker-free LED with adjustable colour temperature.',
    tags: ['led', 'study', 'dimmable']
  }
];

/** Returns a defensive copy so callers cannot mutate the catalogue. */
function getAllProducts() {
  return products.map((product) => ({ ...product, tags: [...product.tags] }));
}

function getProductById(id) {
  const product = products.find((item) => item.id === id);
  return product ? { ...product, tags: [...product.tags] } : null;
}

function getCategories() {
  return [...new Set(products.map((product) => product.category))].sort();
}

module.exports = { getAllProducts, getProductById, getCategories };
