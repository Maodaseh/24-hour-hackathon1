const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Parser = require('rss-parser');
const QRCode = require('qrcode');

// Load .env configuration
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
} catch (e) {
  console.warn('Could not read .env file:', e.message);
}

const app = express();
const parser = new Parser({ timeout: 4000 });
const PORT = process.env.PORT || 3001; // Run on 3001

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// In-memory "Community" database for the prototype (localized around Perundurai / Erode sector)
let communityPosts = [
  { 
    id: 1, 
    author: 'Rescue_Team_Alpha', 
    text: 'Evacuation buses staging at Perundurai Govt Boys Higher Secondary School. Medical supplies and clean drinking water available.', 
    location: 'Perundurai Town Center (Bypass Rd)',
    category: 'aid',
    coordinates: { lat: 11.2750, lon: 77.5835 },
    radiusKm: 15,
    timestamp: new Date(Date.now() - 25 * 60000).toISOString() 
  },
  { 
    id: 2, 
    author: 'Jane_D_Citizen', 
    text: 'Warning: Water stagnation near Chennimalai Road underpass is impassable due to rising flash flood waters. Use Old Ring Road.', 
    location: 'Chennimalai Rd & 4-Roads Junction',
    category: 'hazard',
    coordinates: { lat: 11.2780, lon: 77.5890 },
    radiusKm: 15,
    timestamp: new Date(Date.now() - 12 * 60000).toISOString() 
  },
  { 
    id: 3, 
    author: 'RedCross_Logistics', 
    text: 'Mobile emergency oxygen and water purification unit operational at Perundurai Bus Stand Shelter.', 
    location: 'Perundurai Central Terminal',
    category: 'water',
    coordinates: { lat: 11.2720, lon: 77.5810 },
    radiusKm: 25,
    timestamp: new Date(Date.now() - 5 * 60000).toISOString() 
  }
];

// Curated Emergency Shelters & Aid Hubs generator (localized to user's GPS area)
function getSheltersForLocation(lat, lon) {
  return [
    {
      id: 'sh-1',
      name: 'District Community Hall & Safe Haven',
      address: 'North Cross Road (Sector 1)',
      lat: lat + 0.0055,
      lon: lon + 0.0042,
      capacity: '85% (42 slots left)',
      status: 'OPEN',
      resources: ['Drinking Water', 'First Aid', 'Emergency Power', 'Cots'],
      contact: 'Emergency Dispatch'
    },
    {
      id: 'sh-2',
      name: 'Government Model High School Grounds',
      address: 'Station Main Road',
      lat: lat - 0.0078,
      lon: lon + 0.0065,
      capacity: '40% (120 slots left)',
      status: 'OPEN',
      resources: ['Warm Meals', 'Infant Formula', 'Medical Clinic', 'Ham Radio'],
      contact: 'Local Relief Unit'
    },
    {
      id: 'sh-3',
      name: 'Civil Hospital Emergency Relief Wing',
      address: 'Hospital Bypass Road',
      lat: lat + 0.0112,
      lon: lon - 0.0084,
      capacity: 'FULL (Redirecting)',
      status: 'AT CAPACITY',
      resources: ['Water Refill Only', 'Paramedic Unit'],
      contact: 'Hospital Aid Line'
    },
    {
      id: 'sh-4',
      name: 'Red Cross Regional Aid Depot #4',
      address: 'Old Ring Road Interchange',
      lat: lat - 0.0045,
      lon: lon - 0.0058,
      capacity: '60% (75 slots left)',
      status: 'OPEN',
      resources: ['Blankets', 'Water Purification Kits', 'Satellite Phone Link'],
      contact: 'Red Cross Field'
    }
  ];
}

// Fallback Live Disaster Bulletins
const fallbackDisasters = [
  {
    id: 'd-1',
    title: 'RED ALERT: Flash Flood Emergency & Dam Inflow Warning',
    description: 'Rapidly rising water levels in River Basin. Immediate evacuation advised for zones A and B.',
    severity: 'Red',
    source: 'National Weather & Hazard Center',
    pubDate: new Date().toISOString(),
    lat: 37.7749,
    lon: -122.4194
  },
  {
    id: 'd-2',
    title: 'ORANGE ALERT: High Wind & Power Grid Disruption',
    description: 'Gusts up to 65mph resulting in downed powerlines across Sector 3. Treat all wires as energized.',
    severity: 'Orange',
    source: 'Emergency Operations Center',
    pubDate: new Date(Date.now() - 40 * 60000).toISOString(),
    lat: 37.7810,
    lon: -122.4250
  },
  {
    id: 'd-3',
    title: 'ADVISORY: Boil Water Notice in Effect',
    description: 'Municipal water pressure drop. Boil all tap water for 3 minutes before consuming or use bottled water.',
    severity: 'Orange',
    source: 'Department of Public Health',
    pubDate: new Date(Date.now() - 90 * 60000).toISOString(),
    lat: 37.7680,
    lon: -122.4150
  }
];

// 1. API Endpoint: Fetch Live Disaster Data (GDACS RSS with graceful fallback)
app.get('/api/disasters', async (req, res) => {
  try {
    const feedPromise = parser.parseURL('https://www.gdacs.org/xml/rss.xml');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('GDACS timeout')), 2500)
    );
    
    const feed = await Promise.race([feedPromise, timeoutPromise]);
    
    if (feed && feed.items && feed.items.length > 0) {
      const disasters = feed.items.slice(0, 6).map((item, idx) => {
        const title = item.title || 'Disaster Incident Report';
        let severity = 'Green';
        if (title.toLowerCase().includes('red') || title.toLowerCase().includes('severe') || title.toLowerCase().includes('earthquake')) {
          severity = 'Red';
        } else if (title.toLowerCase().includes('orange') || title.toLowerCase().includes('flood') || title.toLowerCase().includes('tropical')) {
          severity = 'Orange';
        }

        return {
          id: `gdacs-${idx}`,
          title: title,
          link: item.link || '#',
          description: item.contentSnippet || item.content || 'Immediate precaution and emergency awareness required.',
          pubDate: item.pubDate || new Date().toISOString(),
          lat: item['geo:lat'] ? parseFloat(item['geo:lat']) : 37.7749 + (Math.random() * 0.04 - 0.02),
          lon: item['geo:long'] ? parseFloat(item['geo:long']) : -122.4194 + (Math.random() * 0.04 - 0.02),
          severity: severity,
          source: 'GDACS Global Alert'
        };
      });

      return res.json(disasters);
    }
    
    res.json(fallbackDisasters);
  } catch (error) {
    // Return reliable, fast fallback data for low-bandwidth
    res.json(fallbackDisasters);
  }
});

// 2. API Endpoint: Emergency Shelters (Google Places API New with Graceful Local Fallback)
app.get('/api/shelters', async (req, res) => {
  const lat = parseFloat(req.query.lat) || 37.7749;
  const lon = parseFloat(req.query.lon) || -122.4194;
  const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();

  if (apiKey && apiKey !== 'PASTE_YOUR_API_KEY_HERE' && apiKey.length > 10) {
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount'
        },
        body: JSON.stringify({
          includedTypes: ['hospital'],
          maxResultCount: 8,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lon },
              radius: 10000.0
            }
          }
        })
      });

      const data = await response.json();

      if (data && data.places && data.places.length > 0) {
        const places = data.places.map((p, idx) => ({
          id: `gplace-${idx}`,
          name: p.displayName ? p.displayName.text : 'Verified Emergency Hospital',
          address: p.formattedAddress || 'Local Address',
          lat: p.location.latitude,
          lon: p.location.longitude,
          capacity: p.userRatingCount ? `${p.rating || 4.0}★ (${p.userRatingCount} reviews)` : 'Emergency Ready',
          status: 'OPEN',
          resources: ['Emergency Trauma Care', 'Ambulance Bay', 'Critical Care', 'Oxygen Available'],
          contact: 'Google Verified Hospital'
        }));
        return res.json(places);
      }
    } catch (err) {
      console.warn('Google Places API request failed, using local cluster:', err.message);
    }
  }

  // Graceful fallback if no key or query failed
  res.json(getSheltersForLocation(lat, lon));
});

// 3. API Endpoint: Community Posts
app.get('/api/community', (req, res) => {
  res.json(communityPosts);
});

app.post('/api/community', (req, res) => {
  const { author, text, location, category, source, relayed, coordinates, radiusKm } = req.body;
  if (text && text.trim()) {
    const newPost = {
      id: Date.now(),
      author: (author && author.trim()) ? author.trim() : 'Survivor_Signal',
      text: text.trim(),
      location: (location && location.trim()) ? location.trim() : 'Perundurai Sector',
      category: category || 'aid',
      coordinates: coordinates || null,
      radiusKm: radiusKm ? parseFloat(radiusKm) : 15,
      source: source || 'direct',
      relayed: !!relayed,
      timestamp: new Date().toISOString()
    };
    communityPosts.unshift(newPost);
    // Keep max 100 posts
    if (communityPosts.length > 100) communityPosts.pop();
    res.status(201).json(newPost);
  } else {
    res.status(400).json({ error: 'Text message is required' });
  }
});

// 4. API Endpoint: Emergency QR Generator
app.get('/api/qr', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: 'Missing text parameter' });
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      margin: 2,
      width: 320,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    res.json({ dataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA/PWA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CrisisConnect PWA server running on http://localhost:${PORT}`);
});
