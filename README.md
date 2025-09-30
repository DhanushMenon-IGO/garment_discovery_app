Garment Discovery App
=====================

This project is an interactive fashion discovery dashboard that visualizes garment-related data over time.  
It helps users explore patterns, colors, fits, demographics, and engagement metrics of garments, while providing zoomable scatterplots, filtering, and grouping features.


------------------------------------------------------------
🚀 Overview
------------------------------------------------------------

The application consists of a frontend (React + TypeScript + Tailwind + Plotly.js) 
and a backend (FastAPI).

- Backend  
  Processes garment datasets, groups items by timestamps, computes engagement metrics, 
  and returns JSON results.

- Frontend  
  Visualizes the results on a timeline scatterplot, with interactive features like zooming, 
  filtering, and toggling connection lines between garments of similar attributes.

The UI allows users to:
- Explore garment discovery trends over time  
- Zoom/pan into specific periods  
- Filter garments by color, pattern, fit, and demography  
- Click on scatterplot points to inspect garment details  
- View connection lines between garments that share color + pattern


------------------------------------------------------------
✨ Features
------------------------------------------------------------

🔍 Scatterplot Visualization
- Built with Plotly.js inside a responsive container
- X-axis: Timeline (date of garment discovery)
- Y-axis: Stack index for garments on the same day (hidden for cleaner visuals)
- Marker size: Proportional to engagement metric
- Marker color: Matches garment color
- Hover tooltips: Show garment metadata (color, pattern, fit, demography, engagement)
- Click event: Opens garment details in another part of the UI
- Zoom & pan: Users can zoom with mouse wheel and drag to pan

🔗 Connection Lines
- Option to connect garments of the same color and pattern
- Lines are dashed and match the garment color
- Toggleable via a switch in the sidebar

🎛️ Filter Sidebar
- Located on the left side of the graph
- Input fields for: Color, Pattern, Fit, Demography
- Reset button to clear filters
- Filters apply instantly and dynamically update the scatterplot and connections

⚡ Backend Integration
The frontend fetches grouped garment data from the backend.  
Backend response structure includes:

{
  "timestamp": "2025-09-01T10:00:00Z",
  "items": [ { "color": "blue", "pattern": "checks", "fit": "slim", ... } ],
  "engagement_metric_avg": 3.8,
  "item_count": 12
}

The app normalizes this data for plotting.


------------------------------------------------------------
📂 Data Flow
------------------------------------------------------------

1. Backend Processing  
   - Reads garment dataset  
   - Groups garments by timestamp  
   - Computes metrics (e.g., engagement averages)  
   - Returns structured JSON response  

2. Frontend State Handling  
   - Fetches backend response via API call  
   - Processes items into a format suitable for scatterplot  
   - Stores results in React state  

3. Visualization  
   - Scatterplot rendered via react-plotly.js  
   - Filters applied before rendering  
   - Optional connection lines added on top of markers  

4. User Interaction  
   - Hover for metadata  
   - Click dots to view garment group details  
   - Adjust filters to refine results  
   - Toggle connections on/off  
   - Zoom/pan with Plotly’s built-in controls  


------------------------------------------------------------
🛠️ Tech Stack
------------------------------------------------------------

- Frontend: React + TypeScript + Tailwind CSS  
- Charting: Plotly.js (react-plotly.js)  
- UI Components: shadcn/ui (Switch, Input, Button, Label)  
- Backend: FastAPI (Python)  
- Data Processing: Python (garment grouping, JSON responses)  


------------------------------------------------------------
📦 Installation & Setup
------------------------------------------------------------

1. Clone the repo
   git clone https://github.com/your-repo/garment-discovery-app.git
   cd garment-discovery-app

2. Backend (FastAPI)
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   → Runs backend on http://localhost:8000

3. Frontend (React + Vite)
   cd frontend
   npm install
   npm run dev
   → Runs frontend on http://localhost:5173


------------------------------------------------------------
📸 Example Workflow
------------------------------------------------------------

1. Start backend and frontend  
2. Upload or point to a garment dataset  
3. Backend returns grouped garments + metrics  
4. Scatterplot shows garment points along a timeline  
5. Apply filters (e.g., color=blue, pattern=stripes)  
6. Toggle connection lines to see how similar garments evolve over time  
7. Click on a point to inspect garment details  


------------------------------------------------------------
🔮 Future Enhancements
------------------------------------------------------------

- Dropdowns for filter inputs with auto-suggested dataset values  
- Multi-select filters (e.g., choose multiple colors)  
- Export filtered dataset to CSV  
- Compare multiple influencers/demographics on the same timeline  
- Add garment image previews in tooltips  
