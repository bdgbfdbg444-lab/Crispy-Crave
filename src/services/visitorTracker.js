// VisitorTracker - Client Side Tracker v2
class VisitorTracker {
  constructor() {
    this.visitorId = localStorage.getItem("v_visitor_id");
    if (!this.visitorId) {
      this.visitorId = "u_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("v_visitor_id", this.visitorId);
    }

    this.sessionId = sessionStorage.getItem("v_session_id");
    if (!this.sessionId) {
      this.sessionId = "v_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("v_session_id", this.sessionId);
    }
    
    this.startedAt = sessionStorage.getItem("v_started_at");
    if (!this.startedAt) {
      this.startedAt = new Date().toISOString();
      sessionStorage.setItem("v_started_at", this.startedAt);
    }

    this.deviceType = this.detectDeviceType();
    this.os = this.detectOS();
    this.browser = this.detectBrowser();
    this.userAgent = navigator.userAgent.substring(0, 200);
    this.isOrdering = false;
    this.isLoggedIn = false;
    this.eventCount = 0;
    this.intervalId = null;
    this.geoPermission = "PENDING";
    this.geoLat = null;
    this.geoLng = null;
    this.geoAccuracy = null;
    this.geoSource = "NONE";
    this.lastPage = "";
    this.lastRoute = "";
    this.currentPage = document.title;
    this.currentRoute = window.location.pathname + window.location.hash;
    
    this.apiUrl = import.meta.env.VITE_VISITOR_API_URL || "https://cjzdghtahpjqjefjwsan.supabase.co/functions/v1/visitor-tracker";
  }

  detectDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Mobile";
    return "Desktop";
  }

  detectOS() {
    const ua = navigator.userAgent;
    if (ua.indexOf("Win") !== -1) return "Windows";
    if (ua.indexOf("like Mac") !== -1) return "iOS";
    if (ua.indexOf("Mac") !== -1) return "MacOS";
    if (ua.indexOf("Android") !== -1) return "Android";
    if (ua.indexOf("Linux") !== -1) return "Linux";
    return "Unknown";
  }

  detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.indexOf("Edg") !== -1) return "Edge";
    if (ua.indexOf("Chrome") !== -1) return "Chrome";
    if (ua.indexOf("Firefox") !== -1) return "Firefox";
    if (ua.indexOf("Safari") !== -1) return "Safari";
    return "Unknown";
  }

  requestGeolocation() {
    if (!navigator.geolocation) {
      this.geoPermission = "UNAVAILABLE";
      this.geoSource = "IP_GEOLOCATION";
      return;
    }
    
    // First, restore from session if we already did it
    if (sessionStorage.getItem("v_geo_asked")) {
      this.geoPermission = sessionStorage.getItem("v_geo_perm") || "PENDING";
      this.geoLat = parseFloat(sessionStorage.getItem("v_geo_lat")) || null;
      this.geoLng = parseFloat(sessionStorage.getItem("v_geo_lng")) || null;
      this.geoAccuracy = parseFloat(sessionStorage.getItem("v_geo_acc")) || null;
      this.geoSource = sessionStorage.getItem("v_geo_src") || "NONE";
    }
    
    // If previously denied, don't ask again this session
    if (this.geoPermission === "DENIED") {
      return;
    }

    sessionStorage.setItem("v_geo_asked", "1");
    
    // Use watchPosition if granted to get periodic updates, or getCurrentPosition if pending
    if (this.geoPermission === "GRANTED") {
        navigator.geolocation.watchPosition(
          (pos) => this.handleGeoSuccess(pos),
          (err) => this.handleGeoError(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => this.handleGeoSuccess(pos),
          (err) => this.handleGeoError(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
  }

  handleGeoSuccess(pos) {
    // Only update and send if significant change or first time
    const significantChange = !this.geoLat || 
      Math.abs(this.geoLat - pos.coords.latitude) > 0.001 || 
      Math.abs(this.geoLng - pos.coords.longitude) > 0.001;

    this.geoPermission = "GRANTED";
    this.geoLat = pos.coords.latitude;
    this.geoLng = pos.coords.longitude;
    this.geoAccuracy = pos.coords.accuracy;
    this.geoSource = "BROWSER_GPS";
    
    sessionStorage.setItem("v_geo_perm", "GRANTED");
    sessionStorage.setItem("v_geo_lat", String(this.geoLat));
    sessionStorage.setItem("v_geo_lng", String(this.geoLng));
    sessionStorage.setItem("v_geo_acc", String(this.geoAccuracy));
    sessionStorage.setItem("v_geo_src", "BROWSER_GPS");
    
    if (significantChange) {
        this.sendPayload('event', { type: 'GEO_UPDATED', details: `${this.geoLat},${this.geoLng}` });
    }
  }

  handleGeoError(err) {
    this.geoPermission = "DENIED";
    this.geoSource = "IP_GEOLOCATION";
    sessionStorage.setItem("v_geo_perm", "DENIED");
    sessionStorage.setItem("v_geo_src", "IP_GEOLOCATION");
  }

  resolvePageName(hash) {
    if (!hash || hash === '#/' || hash === '#' || hash === '') return "Home";
    if (hash.startsWith('#/menu')) return "Menu";
    if (hash.startsWith('#/checkout')) return "Checkout";
    if (hash.startsWith('#/account')) return "Account";
    if (hash.startsWith('#/track')) return "Track Order";
    return "Home";
  }

  init() {
    console.log("[VisitorTracker] Initialized", this.sessionId);
    
    // Set initial page from hash instead of document.title
    this.currentPage = this.resolvePageName(window.location.hash);
    
    this.requestGeolocation();
    this.sendPayload('init');
    
    // Controlled Heartbeat every 30 seconds
    this.intervalId = setInterval(() => {
      this.sendPayload('heartbeat');
    }, 30000);

    // Track navigation via hash changes (SPA)
    let lastUrl = window.location.pathname + window.location.hash;
    const trackNav = () => {
      const currentHash = window.location.hash;
      const url = window.location.pathname + currentHash;
      if (url !== lastUrl) {
        this.lastPage = this.currentPage || this.resolvePageName(lastUrl.split('#')[1] ? '#' + lastUrl.split('#')[1] : '');
        this.lastRoute = lastUrl;
        
        setTimeout(() => {
            this.currentPage = this.resolvePageName(currentHash);
            this.currentRoute = url;
            lastUrl = url;
            this.sendPayload('event', { type: 'ROUTE_CHANGE', details: url });
        }, 100);
      }
    };
    window.addEventListener('hashchange', trackNav);
    window.addEventListener('popstate', trackNav);

    // Session close handling
    window.addEventListener('beforeunload', () => {
      this.sendPayload('close', { type: 'SESSION_ENDED', details: 'Browser closed' });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendPayload('event', { type: 'TAB_HIDDEN', details: '' });
      }
    });
  }

  setOrdering(state) {
    if (this.isOrdering !== state) {
      this.isOrdering = state;
      this.sendPayload('event', { type: state ? 'ORDERING_STARTED' : 'ORDERING_STOPPED' });
    }
  }

  setLoggedIn(state) {
    if (this.isLoggedIn !== state) {
      this.isLoggedIn = state;
      this.sendPayload('event', { type: state ? 'LOGIN_SUCCESS' : 'LOGOUT' });
    }
  }

  trackEvent(eventName, details = "") {
    this.sendPayload('event', { type: eventName, details });
  }

  async sendPayload(action, event = null) {
    this.eventCount++;
    const currentDuration = Math.floor((Date.now() - new Date(this.startedAt).getTime()) / 1000);

    const payload = {
      action,
      sessionData: {
        SessionId: this.sessionId,
        VisitorId: this.visitorId,
        StartedAt: this.startedAt,
        CurrentPage: this.currentPage,
        CurrentRoute: this.currentRoute,
        LastPage: this.lastPage,
        LastRoute: this.lastRoute,
        DeviceType: this.deviceType,
        OS: this.os,
        Browser: this.browser,
        UserAgent: this.userAgent,
        IsOrdering: this.isOrdering,
        IsLoggedIn: this.isLoggedIn,
        EventCount: this.eventCount,
        Duration: currentDuration,
        GeoPermission: this.geoPermission,
        GeoLat: this.geoLat,
        GeoLng: this.geoLng,
        GeoAccuracy: this.geoAccuracy,
        GeoSource: this.geoSource
      },
      event
    };

    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true 
      });
    } catch (err) {
      console.warn("[VisitorTracker] Delivery failed", err.message);
    }
  }
}

export const visitorTracker = new VisitorTracker();

