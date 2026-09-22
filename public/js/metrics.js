/**
 * Module 4: Performance Monitoring Dashboard
 * Integrates web-vitals to capture LCP and INP in real-time.
 */

import { onLCP, onINP } from 'https://unpkg.com/web-vitals@4?module';

// Helper to update colors based on thresholds
const updateColor = (element, value, threshold) => {
    // Reset colors
    element.classList.remove('text-green-400', 'text-red-500', 'text-gray-400');
    
    // Apply new color based on Core Web Vitals thresholds
    if (value < threshold) {
        element.classList.add('text-green-400'); // Pass
    } else {
        element.classList.add('text-red-500'); // Fail
    }
};

// ==========================================
// 1. Largest Contentful Paint (LCP)
// ==========================================
// Pass { reportAllChanges: true } so we don't have to wait for the user to interact
// with the page for the LCP score to show up. It will report as it renders.
onLCP((metric) => {
    const lcpElement = document.getElementById('hud-lcp');
    if (!lcpElement) return;

    const lcpSeconds = (metric.value / 1000).toFixed(2);
    lcpElement.textContent = `${lcpSeconds} s`;
    
    // Core Web Vitals threshold for LCP is 2.5s (2500ms)
    updateColor(lcpElement, metric.value, 2500);
}, { reportAllChanges: true });

// ==========================================
// 1.5 Real-Time Internet Speed (Downlink)
// ==========================================
function updateNetworkSpeed() {
    const networkElement = document.getElementById('hud-network');
    if (networkElement && navigator.connection && navigator.connection.downlink) {
        networkElement.textContent = `${navigator.connection.downlink} Mbps`;
    } else if (networkElement) {
        networkElement.textContent = `Unknown`;
    }
}
// Run once immediately, and listen for changes
updateNetworkSpeed();
if (navigator.connection) {
    navigator.connection.addEventListener('change', updateNetworkSpeed);
}

// ==========================================
// 2. Interaction to Next Paint (INP)
// ==========================================
onINP((metric) => {
    const inpElement = document.getElementById('hud-inp');
    if (!inpElement) return;

    const inpMs = Math.round(metric.value);
    inpElement.textContent = `${inpMs} ms`;
    
    // Core Web Vitals threshold for INP is 200ms
    updateColor(inpElement, metric.value, 200);
});

// ==========================================
// 3. The INP Interaction Simulator
// ==========================================
const simulateBtn = document.getElementById('simulate-interaction-btn');
const simulateResult = document.getElementById('simulate-result');

if (simulateBtn && simulateResult) {
    simulateBtn.addEventListener('click', () => {
        simulateBtn.textContent = 'Processing...';
        
        // Synchronously block the main thread to simulate heavy JavaScript execution.
        // This forces a delay between the user click and the next frame paint.
        let wasteTime = 0;
        for (let i = 0; i < 50000000; i++) {
            wasteTime += i;
        }

        // Trigger a DOM update so the browser paints the frame, allowing INP to be measured
        simulateResult.textContent = `Interaction Complete (Hash: ${wasteTime.toString(16).substring(0, 5)})`;
        simulateBtn.textContent = 'Simulate Interaction';
    });
}
