import { onLCP, onINP } from 'https://unpkg.com/web-vitals@4?module';

const lcpValueEl = document.getElementById('lcp-value');
const inpValueEl = document.getElementById('inp-value');
const simulateBtn = document.getElementById('simulate-btn');
const interactionResultEl = document.getElementById('interaction-result');

/**
 * Largest Contentful Paint (LCP) handler
 * Updates the LCP readout in the floating dashboard.
 */
onLCP((metric) => {
  const lcpSeconds = (metric.value / 1000).toFixed(2);
  lcpValueEl.textContent = `${lcpSeconds} s`;
  
  // Color coding based on Core Web Vitals thresholds
  if (metric.value < 2500) {
    lcpValueEl.style.color = '#00ff00'; // Neon Green (Good)
  } else {
    lcpValueEl.style.color = '#ff0000'; // Red (Poor)
  }
});

/**
 * Interaction to Next Paint (INP) handler
 * Updates the INP readout in the floating dashboard.
 */
onINP((metric) => {
  const inpMs = Math.round(metric.value);
  inpValueEl.textContent = `${inpMs} ms`;
  
  // Color coding based on Core Web Vitals thresholds
  if (metric.value < 200) {
    inpValueEl.style.color = '#00ff00'; // Neon Green (Good)
  } else {
    inpValueEl.style.color = '#ff0000'; // Red (Poor)
  }
});

/**
 * The Interaction Simulator
 * Blocks the main thread with a heavy computation to accurately measure INP.
 * This proves how heavy JS execution tanks responsiveness, especially on low-end devices.
 */
if (simulateBtn && interactionResultEl) {
  simulateBtn.addEventListener('click', () => {
    // 1. Simulate computationally heavy work blocking the main thread
    let count = 0;
    for (let i = 0; i < 50000000; i++) {
      count += i;
    }
    
    // 2. Trigger a DOM update so web-vitals can measure the paint delay
    interactionResultEl.textContent = `Interaction completed! Hash: ${count.toString(16)}`;
  });
}
