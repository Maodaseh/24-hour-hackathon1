/**
 * Module 2: The Adaptive Decision Engine
 * 
 * =======================================================
 * SETUP INSTRUCTIONS:
 * 1. Install the required dependencies in your terminal:
 *    npm install express ejs cookie-parser
 * 2. Run the server:
 *    node server.js
 * =======================================================
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. Server Configuration
// ==========================================

// Set Embedded JavaScript (EJS) as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets securely from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse incoming cookies securely using cookie-parser
app.use(cookieParser());

// ==========================================
// 2. Adaptive Middleware (The Core Logic)
// ==========================================

/**
 * Adaptive Middleware
 * 
 * This custom middleware intercepts every incoming request to determine the client's
 * current performance capabilities (which were calculated and set by the Module 1 sensor node).
 * It acts as the "Decision Engine", passing the designated mode to the rendering pipeline.
 */
const adaptiveMiddleware = (req, res, next) => {
    // Attempt to extract the hardware/network mode set by the client's cookie
    const clientMode = req.cookies.adaptive_mode;

    // Graceful Fallback Logic:
    // If the cookie does not exist (e.g., first-time visit, strict privacy blockers, 
    // or missing client-side JavaScript support), we default to a safe 'MEDIUM' tier.
    // This ensures a functional, baseline experience for all users without breaking the app.
    if (clientMode) {
        res.locals.mode = clientMode;
    } else {
        res.locals.mode = 'MEDIUM';
    }

    console.log(`[Decision Engine] Request for ${req.url} | Detected Mode: ${res.locals.mode}`);
    next();
};

// Apply the adaptive middleware globally to all routes
app.use(adaptiveMiddleware);

// ==========================================
// 3. Data Mocking (Static Prototype Data)
// ==========================================

// Realistic mock data representing the database for the hackathon prototype.
// Features specific high, medium, and low-res image payloads for dynamic adaptive serving.
// (In a real app, this would be retrieved from a database like MongoDB or PostgreSQL).
const incidents = [
    {
        id: 1,
        title: "Hurricane Milton - Category 4",
        description: "A massive Category 4 hurricane is approaching the Gulf Coast. Expected storm surge of 10-15 feet. Mandatory evacuation orders are in effect for Zones A and B. Wind speeds currently sustained at 145 mph. Emergency shelters are opening at regional high schools and the convention center. Bring 3 days of food and water.",
        price: "CRITICAL", // Repurposing this field for severity/status badge
        specs: { "Location": "Gulf Coast", "Status": "Evacuate", "Severity": "Level 5" },
        modelUrl: "https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb", // Placeholder for topography/radar 3D model
        highResImage: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=2000&q=100",
        mediumResImage: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=800&q=60",
        lowResImage: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=300&q=20"
    },
    {
        id: 2,
        title: "Cascadia Subduction Zone Earthquake",
        description: "A magnitude 8.5 earthquake has struck off the coast. Widespread power grid failures reported. Tsunami warnings issued for all coastal communities. Move to high ground immediately (at least 100 feet above sea level). Aftershocks are ongoing. Search and rescue operations are prioritizing collapsed infrastructure in the downtown sector.",
        price: "SEVERE",
        specs: { "Location": "Pacific NW", "Status": "Tsunami Warning", "Severity": "Level 4" },
        modelUrl: "/models/laptop.glb", // If they downloaded it, otherwise it can be a drone/comms placeholder
        highResImage: "https://images.unsplash.com/photo-1498354178607-a79df2916198?auto=format&fit=crop&w=2000&q=100",
        mediumResImage: "https://images.unsplash.com/photo-1498354178607-a79df2916198?auto=format&fit=crop&w=800&q=60",
        lowResImage: "https://images.unsplash.com/photo-1498354178607-a79df2916198?auto=format&fit=crop&w=300&q=20"
    },
    {
        id: 3,
        title: "Bootleg Fire Containment Breach",
        description: "The wildfire has breached the northern containment line due to shifting high-velocity winds. The fire has consumed over 400,000 acres. Highway 140 is completely closed due to zero visibility and extreme heat. Residents in the Klamath Basin must prepare for immediate evacuation. Air quality index is hazardous (AQI 500+).",
        price: "WARNING",
        specs: { "Location": "Oregon Forest", "Status": "Prepare", "Severity": "Level 3" },
        modelUrl: "https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb",
        highResImage: "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=2000&q=100",
        mediumResImage: "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=800&q=60",
        lowResImage: "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=300&q=20"
    },
    {
        id: 4,
        title: "Major Infrastructure Collapse (Bridge)",
        description: "Structural failure has caused the collapse of the primary suspension bridge over the harbor. Multiple vehicles reported in the water. Marine rescue units are deployed. Do NOT attempt to cross or approach the structure. Traffic is being rerouted via the northern tunnel. Commuters should shelter in place if possible.",
        price: "CRITICAL",
        specs: { "Location": "Metro Center", "Status": "Avoid Area", "Severity": "Level 5" },
        modelUrl: "https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb",
        highResImage: "https://images.unsplash.com/photo-1518536643920-563b78298dc1?auto=format&fit=crop&w=2000&q=100",
        mediumResImage: "https://images.unsplash.com/photo-1518536643920-563b78298dc1?auto=format&fit=crop&w=800&q=60",
        lowResImage: "https://images.unsplash.com/photo-1518536643920-563b78298dc1?auto=format&fit=crop&w=300&q=20"
    }
];

// ==========================================
// 4. Application Routing
// ==========================================

/**
 * Route 1: Home Page
 * Renders the main incident feed. 
 */
app.get('/', (req, res) => {
    res.render('index', { incidents, title: 'Active Incidents Dashboard' });
});

/**
 * Route 2: Incident Detail Page
 */
app.get('/incident/:id', async (req, res) => {
    const incidentId = parseInt(req.params.id, 10);
    const incident = incidents.find(p => p.id === incidentId);

    if (!incident) {
        return res.status(404).send('<h1>404: Incident not found in database.</h1>');
    }

    // ==========================================
    // AI CONTEXTUAL ADAPTATION (OLLAMA)
    // ==========================================
    // If the user is on a LOW connection, we use a local LLM to summarize the 
    // emergency description to save bandwidth and cognitive load.
    if (res.locals.mode === 'LOW') {
        if (!incident.lowModeSummary) {
            console.log(`[AI Engine] Generating lightweight emergency summary for Incident ${incident.id} via Ollama...`);
            try {
                const response = await fetch('http://127.0.0.1:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama3.2', 
                        prompt: `Summarize this FEMA emergency document into exactly 3 life-saving action items for a civilian. Be extremely concise. Do not include introductory text. Document: ${incident.description}`,
                        stream: false
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    incident.lowModeSummary = data.response;
                    console.log(`[AI Engine] Summary generated successfully.`);
                } else {
                    console.error("[AI Engine] Ollama returned an error.");
                    incident.lowModeSummary = "• " + incident.description.substring(0, 50) + "...";
                }
            } catch (err) {
                console.error("[AI Engine] Ollama connection failed. Is Ollama running? Error:", err.message);
                incident.lowModeSummary = "• AI Summary unavailable. Follow standard emergency protocols.";
            }
        }
    }

    res.render('product', { product: incident, title: incident.title });
});

// ==========================================
// 4.5 AI Chat Assistant API (Ollama)
// ==========================================
// Middleware to parse JSON bodies for our chat API
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const { incidentId, message } = req.body;
    const incident = incidents.find(p => p.id === parseInt(incidentId, 10));

    if (!incident || !message) {
        return res.status(400).json({ error: "Invalid request" });
    }

    try {
        // Construct a system prompt to give the AI context about the emergency
        const systemContext = `You are Aegis, a highly trained emergency response coordinator AI. 
The user is a civilian asking about this active incident: ${incident.title}.
Severity Level: ${incident.price}
Incident Details: ${incident.description}
Parameters: ${JSON.stringify(incident.specs)}
Answer their question accurately and calmly based ONLY on this information. Provide life-saving advice if applicable. Keep responses concise (1-3 sentences max).`;

        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2', 
                prompt: `${systemContext}\n\nUser Question: ${message}\nAssistant:`,
                stream: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            return res.json({ reply: data.response.trim() });
        } else {
            return res.status(500).json({ error: "Ollama returned an error" });
        }
    } catch (err) {
        console.error("[AI Chat API] Error:", err.message);
        return res.status(500).json({ error: "Could not connect to local Ollama instance" });
    }
});

// ==========================================
// 5. Server Initialization
// ==========================================

app.listen(PORT, () => {
    console.log(`🚀 Adaptive Decision Engine is actively listening on http://localhost:${PORT}`);
});
