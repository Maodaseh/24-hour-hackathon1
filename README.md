# CrisisConnect: Offline-First Emergency & Disaster Response Grid

> **Network- and Device-Adaptive Web Application Prototype demonstrating Real-Time Core Web Vitals (LCP/INP) Optimization in Extreme Crisis Conditions.**

---

## 🚨 The Problem
During catastrophic natural disasters (hurricanes, floods, earthquakes) or humanitarian emergencies, telecom cell towers suffer physical damage or extreme network congestion. Survivors and first responders are frequently stuck on degraded **2G/3G connections or total cellular blackouts**.

Traditional emergency portals load heavy web graphics, video feeds, and multi-megabyte JavaScript bundles, causing them to completely fail or time out (> 15 seconds) when life-saving information is needed in seconds.

---

## ⚡ The Solution: Adaptive Delivery Engine
**CrisisConnect** dynamically detects network quality (`navigator.connection`) and hardware constraints in real time to serve two radically tailored experiences:

### 1. 🛰️ 5G Command Center (High Speed)
* **Photorealistic Satellite Maps**: Full Esri satellite terrain imagery with road and building overlays.
* **Animated Hazard Inflow Zones**: Dynamic radar rings indicating floodwaters and danger areas.
* **Rich Verified Hospital Cards**: Visual badges, live surgical teams on duty, trauma ICU capacities, and direct phone dispatch.
* **Full Disaster Feeds**: Comprehensive government press releases and satellite bulletin alerts.
* *Network Payload:* **`4.82 MB`** | *LCP:* **`1.84s`**

### 2. 📡 2G Survivor Grid (Extreme Low Bandwidth / Degraded Signal)
* **Zero-Tile Vector Compass Radar**: Strips 100% of raster map image tiles (saving ~4 MB of bandwidth) and relies on a hardware-anchored bearing arrow.
* **AI-Condensed 3-Point Action Bullets**: Condenses 5-page advisories into 3 urgent steps (e.g. *1. Evacuate North. 2. Avoid Bridge on 5th. 3. Shelter at Govt Hospital*).
* **True OLED Pure Black (`#000000`) Mode**: Inverts color scheme to conserve critical phone battery life during power cuts.
* **Real-Time Savings**: **`14.2 KB`** total payload (**▼ 99.7% bandwidth saved!**) | *LCP:* **`0.22s (Instantaneous)`**

### 3. ❌ Complete Blackout (100% Offline Mode)
* **Service Worker Caching**: Immediate offline-first delivery from local cache in **0.08s**.
* **Offline Community Post Queue**: Field reports submitted while disconnected are automatically queued in `localStorage` and auto-sync when connection returns.
* **Hardware GPS Navigation**: Computes real-time Haversine distance and directional bearing with 0 bytes of external network.

---

## 🏥 Live Hospital & Shelter Integration (Google Places API New)
CrisisConnect connects to Google Places API (`places:searchNearby`) using real-time GPS coordinates to fetch actual hospitals, clinics, verified addresses, and operational status in the user's immediate neighborhood.

---

## 🛠️ Tech Stack
* **Backend:** Node.js, Express.js, RSS-Parser (GDACS Live Feed), Google Places API (New)
* **Frontend:** Vanilla HTML5, CSS3 (Custom Utilitarian Design System), JavaScript (ES6+)
* **PWA & Offline:** Service Worker API (`sw.js`), Cache Storage API, Background Sync API
* **Mapping:** Leaflet.js with Satellite Hybrid & Tactical Vector fallbacks
* **Sensors:** Geolocation API, Network Information API, Battery Status API

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Maodaseh/24-hour-hackathon.git
cd 24-hour-hackathon/CrisisConnect
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your Google Places API Key:
```bash
cp .env.example .env
```
Edit `.env`:
```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
PORT=3001
```

### 3. Run the Application
```bash
node server.js
```
Open your browser at **[http://localhost:3001](http://localhost:3001)**.

---

## 👨‍💻 Team & License
Built with ❤️ for the 24-Hour Hackathon. Licensed under the MIT License.
