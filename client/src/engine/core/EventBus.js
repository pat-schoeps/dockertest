/**
 * Event bus for decoupled communication between modules
 */
export class EventBus {
  constructor() {
    this.events = new Map()
    this.onceEvents = new Map()
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event).add(callback)
    
    // Return unsubscribe function
    return () => this.off(event, callback)
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  once(event, callback) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set())
    }
    this.onceEvents.get(event).add(callback)
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback)
      if (this.events.get(event).size === 0) {
        this.events.delete(event)
      }
    }
    
    if (this.onceEvents.has(event)) {
      this.onceEvents.get(event).delete(callback)
      if (this.onceEvents.get(event).size === 0) {
        this.onceEvents.delete(event)
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  emit(event, ...args) {
    // Regular listeners
    if (this.events.has(event)) {
      for (const callback of this.events.get(event)) {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      }
    }
    
    // Once listeners
    if (this.onceEvents.has(event)) {
      const callbacks = Array.from(this.onceEvents.get(event))
      this.onceEvents.delete(event)
      
      for (const callback of callbacks) {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in once event handler for ${event}:`, error)
        }
      }
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name (optional, if not provided clears all)
   */
  clear(event) {
    if (event) {
      this.events.delete(event)
      this.onceEvents.delete(event)
    } else {
      this.events.clear()
      this.onceEvents.clear()
    }
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number}
   */
  listenerCount(event) {
    let count = 0
    if (this.events.has(event)) {
      count += this.events.get(event).size
    }
    if (this.onceEvents.has(event)) {
      count += this.onceEvents.get(event).size
    }
    return count
  }
}