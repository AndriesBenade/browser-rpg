/**
 * @fileoverview EventBus – typed, async-capable publish/subscribe event bus.
 *
 * Usage:
 *   import { eventBus, ENGINE_EVENTS } from './EventBus.js';
 *   const unsub = eventBus.subscribe(ENGINE_EVENTS.FLAG_SET, handler);
 *   await eventBus.publish(ENGINE_EVENTS.FLAG_SET, { key, value });
 *   unsub(); // or eventBus.unsubscribe(ENGINE_EVENTS.FLAG_SET, handler);
 */

// ---------------------------------------------------------------------------
// ENGINE_EVENTS catalogue
// ---------------------------------------------------------------------------

/**
 * Canonical event-type strings for the engine.
 * Import this object and use its properties instead of raw strings so that
 * typos are caught at development time.
 * @type {Readonly<Record<string, string>>}
 */
export const ENGINE_EVENTS = Object.freeze({
  // --- Entity lifecycle ---
  ENTITY_SPAWNED:            'entity:spawned',
  ENTITY_DIED:               'entity:died',
  ENTITY_REMOVED:            'entity:removed',
  ENTITY_RESPAWNED:          'entity:respawned',

  // --- Location ---
  LOCATION_ENTERED:          'location:entered',
  LOCATION_EXITED:           'location:exited',
  LOCATION_DISCOVERED:       'location:discovered',

  // --- Player actions ---
  ACTION_PERFORMED:          'action:performed',
  ACTION_FAILED:             'action:failed',

  // --- Dialogue ---
  DIALOGUE_STARTED:          'dialogue:started',
  DIALOGUE_COMPLETED:        'dialogue:completed',
  DIALOGUE_CHOICE_MADE:      'dialogue:choiceMade',

  // --- Inventory ---
  ITEM_ACQUIRED:             'item:acquired',
  ITEM_REMOVED:              'item:removed',
  ITEM_EQUIPPED:             'item:equipped',
  ITEM_USED:                 'item:used',

  // --- Quests ---
  QUEST_DISCOVERED:          'quest:discovered',
  QUEST_STARTED:             'quest:started',
  QUEST_STAGE_CHANGED:       'quest:stageChanged',
  QUEST_COMPLETED:           'quest:completed',
  QUEST_FAILED:              'quest:failed',
  QUEST_ABANDONED:           'quest:abandoned',

  // --- Combat ---
  COMBAT_STARTED:            'combat:started',
  COMBAT_ENDED:              'combat:ended',
  COMBAT_ROUND_RESOLVED:     'combat:roundResolved',

  // --- Loot ---
  LOOT_GENERATED:            'loot:generated',
  LOOT_COLLECTED:            'loot:collected',

  // --- Time ---
  TIME_ADVANCED:             'time:advanced',
  DAY_CHANGED:               'time:dayChanged',

  // --- Weather ---
  WEATHER_CHANGED:           'weather:changed',

  // --- Flags ---
  FLAG_SET:                  'flag:set',
  FLAG_CLEARED:              'flag:cleared',

  // --- Factions ---
  FACTION_REPUTATION_CHANGED:'faction:reputationChanged',

  // --- NPCs ---
  NPC_DISPOSITION_CHANGED:   'npc:dispositionChanged',

  // --- Consequences / world events ---
  CONSEQUENCE_TRIGGERED:     'consequence:triggered',
  WORLD_EVENT_TRIGGERED:     'worldEvent:triggered',

  // --- Encounters ---
  ENCOUNTER_STARTED:         'encounter:started',
  ENCOUNTER_ENDED:           'encounter:ended',

  // --- Locks (door / container) ---
  LOCK_ATTEMPT:              'lock:attempt',
  LOCK_SUCCESS:              'lock:success',
  LOCK_FAILURE:              'lock:failure',

  // --- Persistence ---
  SAVE_GAME:                 'game:save',
  LOAD_GAME:                 'game:load',

  // --- Campaign ---
  CAMPAIGN_LOADED:           'campaign:loaded',
  CAMPAIGN_UNLOADED:         'campaign:unloaded',
});

// ---------------------------------------------------------------------------
// EventBus class
// ---------------------------------------------------------------------------

/**
 * @typedef {function(payload: *, eventType: string): void | Promise<void>} EventHandler
 */

/**
 * Typed, async-capable publish/subscribe event bus.
 *
 * Handlers may be synchronous or return a Promise; `publish` awaits all of
 * them in parallel so the caller can optionally `await` the publish call to
 * know when all side-effects have completed.
 *
 * Order-of-subscription is preserved within each event type.
 */
export class EventBus {
  constructor() {
    /** @private @type {Map<string, Set<EventHandler>>} */
    this._handlers = new Map();

    /** @private @type {boolean} */
    this._debug = false;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Subscribe to an event type.
   *
   * @param {string}       eventType - One of the ENGINE_EVENTS values.
   * @param {EventHandler} handler   - Called with (payload, eventType).
   * @returns {function(): void}     - Unsubscribe function (call to remove).
   */
  subscribe(eventType, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`EventBus.subscribe: handler must be a function (got ${typeof handler})`);
    }
    if (!this._handlers.has(eventType)) {
      this._handlers.set(eventType, new Set());
    }
    this._handlers.get(eventType).add(handler);

    return () => this.unsubscribe(eventType, handler);
  }

  /**
   * Unsubscribe a previously registered handler.
   *
   * @param {string}       eventType
   * @param {EventHandler} handler
   */
  unsubscribe(eventType, handler) {
    const bucket = this._handlers.get(eventType);
    if (bucket) {
      bucket.delete(handler);
      if (bucket.size === 0) {
        this._handlers.delete(eventType);
      }
    }
  }

  /**
   * Publish an event and await all handlers.
   *
   * Errors thrown by individual handlers are caught and logged so that one
   * failing handler never silences the others.
   *
   * @param {string} eventType - One of the ENGINE_EVENTS values.
   * @param {*}      [payload] - Arbitrary data passed to every handler.
   * @returns {Promise<void>}
   */
  async publish(eventType, payload) {
    if (this._debug) {
      console.debug(`[EventBus] ${eventType}`, payload);
    }

    const bucket = this._handlers.get(eventType);
    if (!bucket || bucket.size === 0) return;

    const promises = [];
    for (const handler of bucket) {
      try {
        const result = handler(payload, eventType);
        if (result && typeof result.then === 'function') {
          promises.push(result.catch((err) => {
            console.error(`[EventBus] async handler error on "${eventType}":`, err);
          }));
        }
      } catch (err) {
        console.error(`[EventBus] sync handler error on "${eventType}":`, err);
      }
    }

    if (promises.length) {
      await Promise.all(promises);
    }
  }

  /**
   * Publish synchronously (fire-and-forget – ignores async handlers' promises).
   * Prefer `publish` unless you are inside a sync context that cannot await.
   *
   * @param {string} eventType
   * @param {*}      [payload]
   */
  publishSync(eventType, payload) {
    if (this._debug) {
      console.debug(`[EventBus:sync] ${eventType}`, payload);
    }
    const bucket = this._handlers.get(eventType);
    if (!bucket) return;
    for (const handler of bucket) {
      try {
        handler(payload, eventType);
      } catch (err) {
        console.error(`[EventBus] sync handler error on "${eventType}":`, err);
      }
    }
  }

  /**
   * Remove all handlers for every event type (useful for testing / teardown).
   */
  clear() {
    this._handlers.clear();
  }

  /**
   * Enable or disable debug logging.
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this._debug = Boolean(enabled);
  }

  /**
   * Returns the number of registered handlers for a given event type.
   * @param {string} eventType
   * @returns {number}
   */
  listenerCount(eventType) {
    return this._handlers.get(eventType)?.size ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/**
 * Shared singleton bus used by all engine modules.
 * Individual modules may also create their own EventBus instances for testing.
 * @type {EventBus}
 */
export const eventBus = new EventBus();

export default eventBus;
