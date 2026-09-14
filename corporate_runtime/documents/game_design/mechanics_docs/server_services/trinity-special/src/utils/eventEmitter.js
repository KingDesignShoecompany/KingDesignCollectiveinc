// eventEmitter.js
// Minimal in-memory event emitter for server-side Trinity events.
// In production, replace with Redis/RabbitMQ or HTTP webhook dispatch.
const EventEmitter = require('events');
const emitter = new EventEmitter();

function emit(event, payload) {
  return new Promise((resolve) => {
    emitter.emit(event, payload);
    resolve(payload);
  });
}

function on(event, handler) {
  emitter.on(event, handler);
}

module.exports = { emit, on };
