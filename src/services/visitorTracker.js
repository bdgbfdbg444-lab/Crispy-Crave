import { db } from '../firebase';
import { ref, set, remove, onDisconnect, update, increment } from 'firebase/database';

/**
 * Real-time Visitor Tracker
 * Tracks online visitors, page views, and ordering activity
 * Data is stored in Firebase RTDB under _analytics/
 * 
 * Structure:
 *   _analytics/online/{sessionId}  → live presence
 *   _analytics/daily/{YYYY-MM-DD}  → daily aggregates
 */
class VisitorTracker {
  constructor() {
    this.sessionId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.startTime = new Date().toISOString();
    this._isOrdering = false;
    this._heartbeatInterval = null;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      const presenceRef = ref(db, `_analytics/online/${this.sessionId}`);

      // Write initial presence
      const presenceData = () => ({
        page: window.location.hash || '/#/',
        startTime: this.startTime,
        timestamp: new Date().toISOString(),
        isOrdering: this._isOrdering,
        ua: (navigator.userAgent || '').substring(0, 80)
      });

      set(presenceRef, presenceData());

      // Auto-remove on disconnect (handles tab close, network loss, etc.)
      onDisconnect(presenceRef).remove();

      // Heartbeat every 30 seconds to keep presence alive
      this._heartbeatInterval = setInterval(() => {
        set(presenceRef, presenceData()).catch(() => {});
      }, 30000);

      // Track unique visitor for today
      this._trackUniqueVisitor();

      // Track initial page view
      this._trackPageView();

      // Listen for hash route changes (SPA navigation)
      window.addEventListener('hashchange', () => {
        this._trackPageView();
        set(presenceRef, presenceData()).catch(() => {});
      });

      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        // Synchronous removal attempt
        try { remove(presenceRef); } catch {}
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
      });

      console.log('[VisitorTracker] Initialized. Session:', this.sessionId);
    } catch (err) {
      console.warn('[VisitorTracker] Init error:', err);
    }
  }

  _trackPageView() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours().toString().padStart(2, '0');

      update(ref(db), {
        [`_analytics/daily/${today}/totalPageViews`]: increment(1),
        [`_analytics/daily/${today}/hourly/${hour}/pageViews`]: increment(1)
      }).catch(() => {});
    } catch {}
  }

  _trackUniqueVisitor() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `_vt_${today}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        update(ref(db), {
          [`_analytics/daily/${today}/uniqueVisitors`]: increment(1)
        }).catch(() => {});
      }
    } catch {}
  }

  /**
   * Call this when user starts/finishes ordering
   * @param {boolean} isOrdering 
   */
  setOrdering(isOrdering) {
    this._isOrdering = isOrdering;
    if (isOrdering) {
      try {
        const today = new Date().toISOString().split('T')[0];
        update(ref(db), {
          [`_analytics/daily/${today}/totalOrders`]: increment(1)
        }).catch(() => {});
      } catch {}
    }
  }
}

export const visitorTracker = new VisitorTracker();
