// backend/src/utils/eventBus.js
// Simple event bus for CRM events
// Date: 2026-07-16

const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners for complex workflows
  }

  /**
   * Emit an event with error handling
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    try {
      super.emit(event, data);
    } catch (error) {
      console.error(`Error emitting event ${event}:`, error);
    }
  }
}

// Export singleton instance
module.exports = new EventBus();
