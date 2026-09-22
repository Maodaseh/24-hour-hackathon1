/**
 * ============================================================================
 * HEAVY CLIENT-SIDE JAVASCRIPT WIDGET (public/heavy-widget.js)
 * ============================================================================
 * HACKATHON CORE REQUIREMENT:
 * This script is ONLY served and executed on HIGH-END tier devices.
 * 
 * WHY IT MATTERS FOR CORE WEB VITALS:
 * - On low-memory / low-CPU devices, downloading and executing complex 3D
 *   render loops, event listeners, and heavy DOM manipulations causes:
 *     1. Long Tasks (> 50ms) blocking the main thread.
 *     2. Severe degradation of Interaction to Next Paint (INP).
 *     3. Memory pressure triggering frequent Garbage Collection pauses.
 * 
 * - In LOW-END mode, the Express server COMPLETELY OMITS this script tag
 *   and its HTML container from the initial payload, keeping the main
 *   thread 100% idle and responsive.
 * ============================================================================
 */

(function () {
  'use strict';

  console.info('[Heavy Widget] Initializing High-End 3D Orbital Visualizer & Interactive Review Engine...');

  const canvas = document.getElementById('product-3d-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width = canvas.parentElement.clientWidth || 400;
    height = 300;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);

  // --- 3D Orbital Simulation State ---
  let rotX = 0.4;
  let rotY = 0.6;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let isWireframe = false;
  let autoRotate = true;
  let particleCount = 120;

  // Generate 3D Vertex Mesh (Truncated Octahedron / Spatial Core)
  const vertices = [];
  const rings = 5;
  for (let i = 0; i < rings; i++) {
    const theta = (i / (rings - 1)) * Math.PI - Math.PI / 2;
    const r = Math.cos(theta) * 80;
    const y = Math.sin(theta) * 80;
    const segments = 12;
    for (let j = 0; j < segments; j++) {
      const phi = (j / segments) * Math.PI * 2;
      vertices.push({
        x: Math.cos(phi) * r,
        y: y,
        z: Math.sin(phi) * r
      });
    }
  }

  // Floating Particle Cloud
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 260,
      y: (Math.random() - 0.5) * 260,
      z: (Math.random() - 0.5) * 260,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
      hue: Math.floor(Math.random() * 60) + 180 // Cyan to Purple
    });
  }

  // --- Mouse / Touch Drag Handlers ---
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    rotY += dx * 0.01;
    rotX += dy * 0.01;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch handlers
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMouseX;
    const dy = e.touches[0].clientY - lastMouseY;
    rotY += dx * 0.01;
    rotX += dy * 0.01;
    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Projection math
  function project(p) {
    // 3D rotation around Y and X
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    // Rotate Y
    let x1 = p.x * cosY + p.z * sinY;
    let z1 = -p.x * sinY + p.z * cosY;

    // Rotate X
    let y2 = p.y * cosX - z1 * sinX;
    let z2 = p.y * sinX + z1 * cosX;

    // Perspective projection
    const fov = 350;
    const scale = fov / (fov + z2 + 180);
    return {
      x: width / 2 + x1 * scale,
      y: height / 2 + y2 * scale,
      scale: scale,
      z: z2
    };
  }

  // --- Main Animation Loop (High-End GPU/CPU Load) ---
  let animationId;
  function renderFrame() {
    ctx.clearRect(0, 0, width, height);

    if (autoRotate && !isDragging) {
      rotY += 0.012;
      rotX += 0.004;
    }

    // Draw Particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      // Boundary bounce
      if (Math.abs(p.x) > 130) p.vx *= -1;
      if (Math.abs(p.y) > 130) p.vy *= -1;
      if (Math.abs(p.z) > 130) p.vz *= -1;

      const proj = project(p);
      if (proj.scale > 0) {
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${Math.min(1, proj.scale * 0.8)})`;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Project Core Mesh
    const projectedVertices = vertices.map(project);

    // Draw Outer Orbital Ring
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2; a += 0.1) {
      const ringPoint = {
        x: Math.cos(a) * 110,
        y: 0,
        z: Math.sin(a) * 110
      };
      const pr = project(ringPoint);
      if (a === 0) ctx.moveTo(pr.x, pr.y);
      else ctx.lineTo(pr.x, pr.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw Mesh Vertices & Connectors
    ctx.strokeStyle = isWireframe ? 'rgba(6, 182, 212, 0.7)' : 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 1;

    for (let i = 0; i < projectedVertices.length; i++) {
      const v = projectedVertices[i];
      // Vertex node
      ctx.fillStyle = isWireframe ? '#06b6d4' : '#8b5cf6';
      ctx.beginPath();
      ctx.arc(v.x, v.y, 2.5 * v.scale, 0, Math.PI * 2);
      ctx.fill();

      // Nearest neighbors line
      if (i % 12 !== 11) {
        const next = projectedVertices[i + 1];
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }
    }

    animationId = requestAnimationFrame(renderFrame);
  }

  animationId = requestAnimationFrame(renderFrame);

  // --- Wire UI Button Controls ---
  const btnWireframe = document.getElementById('widget-btn-wireframe');
  const btnSpin = document.getElementById('widget-btn-spin');
  const btnReset = document.getElementById('widget-btn-reset');

  if (btnWireframe) {
    btnWireframe.addEventListener('click', () => {
      isWireframe = !isWireframe;
      btnWireframe.textContent = isWireframe ? 'Shaded View' : 'Wireframe View';
    });
  }

  if (btnSpin) {
    btnSpin.addEventListener('click', () => {
      autoRotate = !autoRotate;
      btnSpin.textContent = autoRotate ? 'Pause Rotation' : 'Auto Rotate';
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      rotX = 0.4;
      rotY = 0.6;
    });
  }

  // --- Dynamic Heavy Interactive Reviews Component ---
  const reviewsContainer = document.getElementById('interactive-reviews-target');
  if (reviewsContainer) {
    const mockReviews = [
      { user: "Alex V.", rating: 5, date: "2 days ago", comment: "The build quality and dynamic response are unmatched. Spatial audio blew my mind.", verified: true },
      { user: "Sarah T.", rating: 5, date: "1 week ago", comment: "Crisp highs, deep sub-bass without mud. Seamless pairing across my workstation.", verified: true },
      { user: "Devon K.", rating: 4, date: "2 weeks ago", comment: "Exceptional battery life. ANC blocks subway rumblings completely.", verified: true }
    ];

    let reviewsHTML = '<div class="reviews-list-dynamic" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">';
    reviewsHTML += '<h3 style="font-size: 1.1rem; font-weight: 700; color: #fff;">Verified Customer Reviews (Interactive DOM)</h3>';

    mockReviews.forEach((r) => {
      reviewsHTML += `
        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
            <strong style="color: #fff; font-size: 0.9rem;">${r.user} <span style="color: var(--accent-emerald); font-size: 0.75rem;">✓ Verified Buyer</span></strong>
            <span style="color: var(--accent-amber); font-size: 0.85rem;">${'★'.repeat(r.rating)}</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.85rem;">${r.comment}</p>
          <span style="color: var(--text-subtle); font-size: 0.72rem; margin-top: 0.25rem; display: block;">Posted ${r.date}</span>
        </div>
      `;
    });
    reviewsHTML += '</div>';
    reviewsContainer.innerHTML = reviewsHTML;
  }
})();
