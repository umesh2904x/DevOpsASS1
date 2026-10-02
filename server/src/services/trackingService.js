'use strict';

const STATUS_FLOW = ['PLACED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const timelines = new Map();

/** Builds the default status timeline for a freshly placed order. */
function createTimeline(orderId) {
  const timeline = {
    orderId,
    carrier: 'ShopVerse Express',
    trackingNumber: 'SVE' + String(orderId).replace(/[^0-9A-Za-z]/g, '').slice(-8).padStart(10, '0'),
    estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    events: [
      { status: 'PLACED', at: new Date().toISOString(), note: 'Order confirmed and payment authorised' }
    ]
  };
  timelines.set(orderId, timeline);
  return timeline;
}

function getTimeline(orderId) {
  return timelines.get(orderId) || null;
}

function advanceStatus(orderId, status) {
  const timeline = timelines.get(orderId);
  if (!timeline) return null;

  const currentIndex = STATUS_FLOW.indexOf(timeline.events[0].status);
  const nextIndex = STATUS_FLOW.indexOf(status);

  if (nextIndex === -1) {
    const error = new Error(`Unknown shipment status ${status}`);
    error.status = 400;
    error.code = 'INVALID_STATUS';
    throw error;
  }
  if (nextIndex <= currentIndex) {
    const error = new Error(`Cannot move shipment backwards from ${currentIndex >= 0 ? STATUS_FLOW[currentIndex] : 'start'}`);
    error.status = 409;
    error.code = 'INVALID_STATUS_TRANSITION';
    throw error;
  }

  timeline.events.unshift({ status, at: new Date().toISOString(), note: `Updated to ${status.replace(/_/g, ' ').toLowerCase()}` });
  return timeline;
}

/** Test helper - wipes all timelines. */
function reset() {
  timelines.clear();
}

module.exports = { createTimeline, getTimeline, advanceStatus, reset, STATUS_FLOW };
