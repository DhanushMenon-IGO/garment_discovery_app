# app/routes/discovery.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date, datetime
import pandas as pd
import os

router = APIRouter()

DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "synthetic_discovery_dataset.csv"
)

class Timeline(BaseModel):
    start: date
    end: date

class OptionalAttributes(BaseModel):
    style: Optional[str] = None
    colors: Optional[List[str]] = None
    patterns: Optional[List[str]] = None

class DiscoveryRequest(BaseModel):
    gender: str
    garment_type: str
    timeline: Timeline
    optional: Optional[OptionalAttributes] = None

@router.post("/run")
def run_discovery(req: DiscoveryRequest) -> Dict:
    print(f"Received request: {req.dict()}") # For debugging

    try:
        df = pd.read_csv(DATASET_PATH)
        # FIX 1: Make date parsing robust. It should be 'DD-MM-YYYY' based on your CSV.
        df["timestamp"] = pd.to_datetime(df["timestamp"], format='%d-%m-%Y', errors='coerce')
        df.dropna(subset=['timestamp'], inplace=True)
    except Exception as e:
        print(f"Error reading or parsing CSV: {e}")
        return {"error": "Failed to process dataset"}, 500

    # --- Initial Filtering ---
    start_date = pd.to_datetime(req.timeline.start)
    end_date = pd.to_datetime(req.timeline.end)

    mask = (
        (df["gender"].str.lower() == req.gender.lower()) &
        (df["garment_type"].str.lower() == req.garment_type.lower()) &
        (df["timestamp"] >= start_date) &
        (df["timestamp"] <= end_date)
    )
    
    if req.optional:
        # ✨ FIX 2: Check if the lists actually contain items before filtering.
        if req.optional.colors and len(req.optional.colors) > 0:
            mask &= df["color"].str.lower().isin([c.lower() for c in req.optional.colors])
        if req.optional.patterns and len(req.optional.patterns) > 0:
            mask &= df["pattern"].str.lower().isin([p.lower() for p in req.optional.patterns])
            
    filtered_df = df[mask].copy()

    print(f"Found {len(filtered_df)} items after filtering.") # For debugging

    # --- Grouping and Aggregation Logic ---
    if filtered_df.empty:
        return {"results": [], "dataset_url": None}

    grouping_fields = ['timestamp', 'influence_identifier', 'pattern', 'color']
    grouped = filtered_df.groupby(grouping_fields)
    results = []
    for name, group in grouped:
        avg_engagement = group['engagement_metric'].mean()
        items_in_group = group.to_dict(orient="records")
        for item in items_in_group:
            item["image_url"] = f"/images/{item['image_path']}"
        results.append({
            "group_key": name,
            "timestamp": name[0].isoformat(),
            "items": items_in_group,
            "engagement_metric_avg": avg_engagement,
            "item_count": len(items_in_group)
        })
    
    print(f"Returning {len(results)} groups to the frontend.")

    # --- CSV Generation ---
    dataset_url = None
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    STATIC_DIR = os.path.join(BASE_DIR, "static")
    os.makedirs(STATIC_DIR, exist_ok=True)
    filename = f"discovery_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.csv"
    filepath = os.path.join(STATIC_DIR, filename)
    filtered_df.to_csv(filepath, index=False)
    dataset_url = f"/static/{filename}"
    
    return {"results": results, "dataset_url": dataset_url}