import React from 'react';

function GarmentDetailsCard({ item }: { item: any }) {
  if (!item) return null;

  // Normalize palette: prefer palette array, fallback to single color
  const palette: string[] = Array.isArray(item.palette)
    ? item.palette
    : item.color
    ? [item.color]
    : [];

  return (
    <div className="border rounded-md p-4 bg-white shadow">
      {/* Left: GarmentViewer Placeholder */}
      <div className="border rounded-md p-4 bg-gray-100 h-64 flex items-center justify-center">
        {item.image_url ? (
          <img
            src={`http://localhost:8000${item.image_url}`}
            alt={`Image of ${item.garment_type}`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p>Garment Viewer not available</p>
        )}
      </div>
      {/* Right: Breakdown */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Garment Breakdown</h3>
        <p><b>Type:</b> {item.garment_type}</p>
        <div className="mb-2">
          <b>Colors:</b>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {palette.length > 0 ? (
              palette.map((c, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span
                    className="inline-block w-5 h-5 rounded border"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                  <span className="text-sm">{c}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500 ml-2">No color info</span>
            )}
          </div>
        </div>
        <p><b>Pattern:</b> {item.pattern}</p>
        <p><b>Style:</b> {item.style}</p>
        <p>
          <b>Engagement:</b> {item.engagement_likes} likes /{" "}
          {item.engagement_views} views
        </p>
      </div>
    </div>
  );
}

export default GarmentDetailsCard;