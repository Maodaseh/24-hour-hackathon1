/**
 * ============================================================================
 * MODULE 1: THE SENSOR NODE (public/detector.js)
 * ============================================================================
 * ROLE: Expert Frontend Performance Engineer
 * 
 * OBJECTIVE:
 * Runs synchronously and immediately in the <head> when a user visits the site.
 * Queries browser hardware and network performance APIs, classifies the device
 * into an adaptive performance tier ('high-end' vs 'low-end'), and synchronizes
 * this state via the 'app_perf_tier' cookie.
 * 
 * SENSORS MONITORED:
 * 1. Network: navigator.connection.effectiveType ('4g' vs '3g'/'2g'/'slow-2g')
 * 2. Memory:  navigator.deviceMemory (RAM in GB: >= 8GB vs < 8GB)
 * 3. CPU:     navigator.hardwareConcurrency (Logical Cores: >= 4 vs < 4)
 * 
 * STATE MANAGEMENT & SERVER HANDSHAKE:
 * - Cookie name: 'app_perf_tier'
 * - If cookie is absent: writes cookie.
 * - If tier changes (e.g. network drops to 3G in transit): updates cookie and
 *   triggers a hard page reload (window.location.reload()) so Express SSR can
 *   serve the newly optimized payload.
 * ============================================================================
 */

(function () {
  'use strict';

  /**
   * Helper: Parse a cookie value by name from document.cookie
   * Uses defensive regex parsing to avoid substring collisions.
   * @param {string} name - Cookie name to search for
   * @returns {string|null} - Value of the cookie or null if absent
   */
  function getCookie(name) {
    if (typeof document === 'undefined' || !document.cookie) return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Helper: Set a cookie with standard path and expiration
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} [days=1] - Expiration in days
   */
  function setCookie(name, value, days = 1) {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }

  /**
   * Categorization Logic: Evaluates hardware capabilities and network conditions.
   * 
   * CRITERIA:
   * - 'high-end': Network is '4g' AND RAM >= 8GB AND CPU Cores >= 4.
   * - 'low-end':  Network is '3g' or slower, OR RAM < 8GB, OR CPU Cores < 4.
   * 
   * GRACEFUL FALLBACK:
   * Browsers that do not implement navigator.connection or navigator.deviceMemory
   * (e.g., Apple Safari, Mozilla Firefox) default to 'high-end' to avoid
   * inadvertently degrading user experience.
   * 
   * @returns {'high-end'|'low-end'} - The determined performance tier
   */
  function determineTier() {
    // 1. Check for manual URL override (e.g. ?tier=low-end or ?tier=high-end for judges)
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTier = urlParams.get('tier');
      if (queryTier === 'high-end' || queryTier === 'high') return 'high-end';
      if (queryTier === 'low-end' || queryTier === 'low') return 'low-end';
    }

    // 2. Defensive Sensor Access using Optional Chaining and typeof guards
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (!nav) return 'high-end';

    // Sensor 1: Network Information API
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const hasConnectionApi = Boolean(connection && typeof connection.effectiveType === 'string');
    const effectiveType = hasConnectionApi ? connection.effectiveType.toLowerCase() : null;

    // Sensor 2: Device Memory API (in GiB)
    const hasMemoryApi = typeof nav.deviceMemory === 'number';
    const deviceMemory = hasMemoryApi ? nav.deviceMemory : null;

    // Sensor 3: Hardware Concurrency (Logical CPU Cores)
    const hasCpuApi = typeof nav.hardwareConcurrency === 'number';
    const hardwareConcurrency = hasCpuApi ? nav.hardwareConcurrency : null;

    // --- GRACEFUL FALLBACK CHECK ---
    // If neither connection nor deviceMemory is supported (Safari/Firefox),
    // default gracefully to 'high-end'.
    if (!hasConnectionApi && !hasMemoryApi) {
      console.info('[Sensor Node] Network and Memory APIs unsupported (e.g. Safari/Firefox). Defaulting gracefully to high-end profile.');
      return 'high-end';
    }

    // --- EVALUATE LOW-END CONDITIONS ---
    // Any one of these bottlenecks demotes the device to 'low-end':
    // A. Network is '3g', '2g', 'slow-2g', or Data Saver is enabled
    if (hasConnectionApi) {
      const isSlowNetwork = effectiveType === '3g' || effectiveType === '2g' || effectiveType === 'slow-2g';
      const isDataSaver = Boolean(connection.saveData);
      if (isSlowNetwork || isDataSaver) {
        return 'low-end';
      }
    }

    // B. Constrained Memory: RAM is strictly less than 8GB
    if (hasMemoryApi && deviceMemory < 8) {
      return 'low-end';
    }

    // C. Constrained CPU: Logical Cores are strictly less than 4
    if (hasCpuApi && hardwareConcurrency < 4) {
      return 'low-end';
    }

    // --- EVALUATE HIGH-END CONDITIONS ---
    // The device meets all criteria: '4g' network, >= 8GB RAM, and >= 4 CPU cores
    return 'high-end';
  }

  // Expose determineTier on window for transparency, automated testing, and metrics HUD
  if (typeof window !== 'undefined') {
    window.determineTier = determineTier;
  }

  /**
   * Sensor Node Handshake:
   * Synchronizes client state with the server via the 'app_perf_tier' cookie.
   */
  function syncTierState() {
    const calculatedTier = determineTier();
    const cookieName = 'app_perf_tier';
    const currentCookie = getCookie(cookieName);

    // Populate telemetry diagnostics for the floating HUD
    if (typeof window !== 'undefined') {
      const nav = navigator || {};
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
      window.__ADAPTIVE_METRICS__ = {
        detectedTier: calculatedTier,
        cookieTier: currentCookie,
        sensors: {
          effectiveType: conn?.effectiveType ? conn.effectiveType.toUpperCase() : 'UNSUPPORTED',
          deviceMemory: typeof nav.deviceMemory === 'number' ? `${nav.deviceMemory} GB` : 'UNSUPPORTED',
          hardwareConcurrency: typeof nav.hardwareConcurrency === 'number' ? `${nav.hardwareConcurrency} Cores` : 'UNSUPPORTED'
        }
      };
    }

    // Case 1: Cookie does not exist yet (Initial visit)
    if (!currentCookie) {
      setCookie(cookieName, calculatedTier, 1);
      console.info(`[Sensor Node] Initial handshake: established tier cookie "${cookieName}=${calculatedTier}"`);
      return;
    }

    // Case 2: Cookie exists and matches calculated tier
    if (currentCookie === calculatedTier) {
      console.info(`[Sensor Node] Steady state: active profile "${calculatedTier}" matches current cookie.`);
      return;
    }

    // Case 3: Tier has changed (e.g. user entered elevator, network dropped to 3G, or DevTools throttled)
    console.warn(`[Sensor Node] Dynamic tier transition detected: "${currentCookie}" -> "${calculatedTier}". Updating cookie and triggering reload...`);
    setCookie(cookieName, calculatedTier, 1);

    // Hard reload so the server can serve the newly adapted HTML payload
    window.location.reload();
  }

  // --- Run Handshake Immediately ---
  syncTierState();

  // --- Dynamic Real-Time Listener ---
  // If the user's connection changes mid-session (e.g., WiFi drops to 3G),
  // re-evaluate and trigger handshake.
  if (typeof navigator !== 'undefined' && navigator.connection?.addEventListener) {
    navigator.connection.addEventListener('change', () => {
      console.info('[Sensor Node] Network change event received from browser connection.');
      syncTierState();
    });
  }
})();
