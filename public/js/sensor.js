/**
 * Module 1: The Sensor Node
 * Detects user hardware capabilities and network conditions to determine an adaptive performance mode.
 * Utilizes strict feature detection and graceful fallbacks.
 */
(() => {
  'use strict';

  /**
   * Safe retrieval of hardware and network capabilities using feature detection.
   * @returns {Object} Device capabilities { network, saveData, memory, cores }
   */
  function getDeviceCapabilities() {
    const caps = {
      network: 'unknown',
      saveData: false,
      memory: undefined,
      cores: undefined
    };

    // Network Information API (Feature detection is critical as Safari/Firefox support varies)
    if ('connection' in navigator && navigator.connection) {
      caps.network = navigator.connection.effectiveType || 'unknown';
      caps.saveData = navigator.connection.saveData === true;
    }

    // Device Memory API
    if ('deviceMemory' in navigator) {
      caps.memory = navigator.deviceMemory;
    }

    // Hardware Concurrency API
    if ('hardwareConcurrency' in navigator) {
      caps.cores = navigator.hardwareConcurrency;
    }

    return caps;
  }

  /**
   * Calculates the adaptive performance mode based on collected capabilities.
   * @param {string} network - Effective connection type (e.g., '4g', '3g')
   * @param {number|undefined} memory - Device memory in GB
   * @param {number|undefined} cores - Number of logical CPU cores
   * @param {boolean} saveData - Whether the user has requested data saving mode
   * @returns {string} 'HIGH', 'MEDIUM', or 'LOW'
   */
  function calculateMode(network, memory, cores, saveData) {
    // LOW MODE Conditions: Extreme bandwidth or processing constraints
    if (
      saveData === true ||
      ['slow-2g', '2g', '3g'].includes(network) ||
      (memory !== undefined && memory < 4) ||
      (cores !== undefined && cores < 4)
    ) {
      return 'LOW';
    }

    // HIGH MODE Conditions: Ideal environment for heavy assets/animations
    if (
      network === '4g' &&
      (memory !== undefined && memory >= 8) &&
      (cores !== undefined && cores >= 8)
    ) {
      return 'HIGH';
    }

    // MEDIUM MODE Fallback: Intermediary conditions OR lack of API support
    return 'MEDIUM';
  }

  /**
   * Retrieves a specific cookie value by name.
   * @param {string} name - Name of the cookie
   * @returns {string|null} Cookie value or null if not found
   */
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  /**
   * Sets a cookie with standard security attributes.
   * @param {string} name - Name of the cookie
   * @param {string} value - Value of the cookie
   */
  function setCookie(name, value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=3600; SameSite=Strict`;
  }

  /**
   * Main evaluation loop: Calculates mode, manages cookie state, and handles reloads.
   */
  function evaluateAndApplyMode() {
    const caps = getDeviceCapabilities();
    const calculatedMode = calculateMode(caps.network, caps.memory, caps.cores, caps.saveData);
    const existingMode = getCookie('adaptive_mode');

    if (!existingMode) {
      // Handshake: First-time visit - set cookie and reload immediately
      console.log(`[Sensor] Initializing adaptive mode to ${calculatedMode}. Reloading...`);
      setCookie('adaptive_mode', calculatedMode);
      window.location.reload();
    } else if (existingMode !== calculatedMode) {
      // Dynamic Adaptation: Environment changed mid-session (e.g., WiFi drop to 3G)
      console.log(`[Sensor] Environment change detected. Updating mode from ${existingMode} to ${calculatedMode}. Reloading...`);
      setCookie('adaptive_mode', calculatedMode);
      window.location.reload();
    } else {
      // Environment is stable
      console.log(`[Sensor] Active adaptive mode: ${existingMode}`);
    }
  }

  // 1. Initial Execution
  evaluateAndApplyMode();

  // 2. Real-Time Reactivity (Event Listeners)
  if ('connection' in navigator && navigator.connection) {
    let debounceTimer;
    navigator.connection.addEventListener('change', () => {
      // Debounce the network change event to prevent infinite reload loops
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('[Sensor] Network change detected. Re-evaluating...');
        evaluateAndApplyMode();
      }, 2000); // 2000ms threshold
    });
  }

})();
