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

      this.ipData = { ip: 'Fetching...', location: 'Unknown' };
      this.history = [];

      // 1. Fetch IP as fallback
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
            this.ipData.ip = data.ip || 'Unknown';
            this.ipData.location = `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`;
            set(presenceRef, presenceData()).catch(() => {});
            updateHistoryLog();
        })
        .catch(err => {
            console.warn('Failed to fetch IP', err);
            this.ipData.ip = 'Unknown';
            set(presenceRef, presenceData()).catch(() => {});
            updateHistoryLog();
        });

      const deviceType = /Mobile|Android|iP(hone|od|ad)/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
      this.deviceType = deviceType;

      const presenceData = () => ({
        page: window.location.hash || '/#/',
        startTime: this.startTime,
        timestamp: new Date().toISOString(),
        isOrdering: this._isOrdering,
        ua: (navigator.userAgent || '').substring(0, 80),
        deviceType: this.deviceType,
        ip: this.ipData.ip,
        location: this.ipData.location,
        history: this.history
      });

      const updateHistoryLog = () => {
         try {
           update(ref(db, `VisitorHistory/${this.sessionId}`), {
               ip: this.ipData.ip,
               location: this.ipData.location,
               deviceType: this.deviceType,
               startTime: this.startTime,
               lastSeen: new Date().toISOString(),
               history: this.history
           });
         } catch (e) {}
      };

      set(presenceRef, presenceData());
      updateHistoryLog();

      // Auto-remove on disconnect
      onDisconnect(presenceRef).remove();

      // Heartbeat every 30 seconds
      this._heartbeatInterval = setInterval(() => {
        set(presenceRef, presenceData()).catch(() => {});
        updateHistoryLog();
      }, 30000);

      this._trackUniqueVisitor();
      this._trackPageView();

      window.addEventListener('hashchange', () => {
        this._trackPageView();
        set(presenceRef, presenceData()).catch(() => {});
        updateHistoryLog();
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
      
      const page = window.location.hash || '/#/';
      const time = new Date().toISOString();
      
      // Update local history array
      this.history.push({ page, time });

      const updates = {
        [`_analytics/daily/${today}/totalPageViews`]: increment(1),
        [`_analytics/daily/${today}/hourly/${hour}/pageViews`]: increment(1),
        // Write the history array for this session
        [`_analytics/online/${this.sessionId}/history`]: this.history
      };

      update(ref(db), updates).catch(() => {});
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
