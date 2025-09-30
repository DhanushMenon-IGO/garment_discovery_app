import Plot from "react-plotly.js";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface GarmentGroup {
  timestamp: string;
  items: any[];
  engagement_metric_avg: number;
  item_count: number;
}

function ScatterPlot({ items, onSelect }: { items: GarmentGroup[]; onSelect: (items: any[]) => void }) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [lineTraces, setLineTraces] = useState<any[]>([]);
  const [showConnections, setShowConnections] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔍 Filter state
  const [filters, setFilters] = useState({
    color: "all",
    pattern: "all",
    fit: "all",
  });

  // Define available options for dropdowns
  const colorOptions = ["red", "blue", "green", "black", "white", "yellow", "grey"];
  const patternOptions = ["solid", "stripes", "checks", "floral", "polka dots"];
  const fitOptions = ["slim", "regular", "oversized", "straight", "relaxed"];

  useEffect(() => {
    try {
      if (items && items.length > 0) {
        const dailyCounts: { [key: string]: number } = {};
        const processedData = items.map(group => {
        const dateKey = new Date(group.timestamp).toISOString().split("T")[0];
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
        return {
          x: new Date(group.timestamp),
          y: group.engagement_metric_avg,   // ✅ y-axis based on engagement metric
            z: group.engagement_metric_avg,   // still keep for dot size
            items: group.items,
            item_count: group.item_count,
            color: group.items[0]?.color?.toLowerCase() || "#8884d8",
            pattern: group.items[0]?.pattern || "unknown",
            fit: group.items[0]?.fit || "unknown",
            influence: group.items[0]?.influence_identifier,
          };
        });
        
        // ✅ Apply filters
        const filtered = processedData.filter(d => {
          return (
            (filters.color === "all" || d.color.includes(filters.color.toLowerCase())) &&
            (filters.pattern === "all" || d.pattern.toLowerCase().includes(filters.pattern.toLowerCase())) &&
            (filters.fit === "all" || d.fit.toLowerCase().includes(filters.fit.toLowerCase()))
          );
        });

        setChartData(filtered); // Fixed: Use filtered data instead of processedData

        // 🔗 Build connection lines only if showConnections is true
        if (showConnections) {
          const grouped: Record<string, any[]> = {};
          filtered.forEach(d => {
            const key = `${d.color}-${d.pattern}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(d);
          });

          const traces: any[] = [];
          Object.entries(grouped).forEach(([key, points]) => {
            if (points.length > 1) {
              points.sort((a, b) => a.x.getTime() - b.x.getTime());
              traces.push({
                x: points.map(p => p.x),
                y: points.map(p => p.y),
                mode: "lines",
                line: { color: points[0].color, width: 1, dash: "dot" },
                name: `Connection: ${key}`,
                hoverinfo: "skip",
              });
            }
          });
          setLineTraces(traces);
        } else {
          setLineTraces([]);
        }
      } else {
        setChartData([]);
        setLineTraces([]);
      }
    } catch (err) {
      console.error("Error in ScatterPlot useEffect:", err);
      setError("An error occurred while rendering the scatter plot.");
    }
  }, [items, filters, showConnections]);

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="p-4 border rounded-lg mb-6 bg-white shadow">
      <div className="flex gap-4">
        {/* 📌 Filter Sidebar */}
        <div className="w-64 p-4 border rounded-lg bg-gray-50 shadow-sm">
          <h4 className="font-semibold mb-3">Filters</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="color">Color</Label>
              <Select
                value={filters.color}
                onValueChange={(value) => setFilters({ ...filters, color: value })}
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {colorOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pattern">Pattern</Label>
              <Select
                value={filters.pattern}
                onValueChange={(value) => setFilters({ ...filters, pattern: value })}
              >
                <SelectTrigger id="pattern">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patterns</SelectItem>
                  {patternOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fit">Fit</Label>
              <Select
                value={filters.fit}
                onValueChange={(value) => setFilters({ ...filters, fit: value })}
              >
                <SelectTrigger id="fit">
                  <SelectValue placeholder="Select fit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fits</SelectItem>
                  {fitOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ color: "all", pattern: "all", fit: "all" })}
            >
              Reset Filters
            </Button>
          </div>
          <div className="mt-6 flex items-center space-x-2">
            <Switch
              checked={showConnections}
              onCheckedChange={setShowConnections}
              id="show-connections"
            />
            <Label htmlFor="show-connections">Show Connections</Label>
          </div>
        </div>
        {/* 📊 Scatter Plot */}
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Discovery Timeline (Zoomable + Connections)</h3>
          <Plot
            data={[
              ...(showConnections ? lineTraces : []),
              {
                x: chartData.map(d => d.x),
                y: chartData.map(d => d.y),
                text: chartData.map(
                  d => `
                    <b>Date:</b> ${d.x.toLocaleDateString()}
                    <b>Pattern:</b> ${d.pattern}
                    <b>Color:</b> ${d.color}
                    <b>Fit:</b> ${d.fit}
                    <b>Engagement:</b> ${d.z.toFixed(2)}
                    <b>Items in Group:</b> ${d.item_count}
                  `
                ),
                mode: "markers",
                marker: {
                  size: chartData.map(d => Math.max(1, Math.sqrt(d.z) * 0.1)),
                  color: chartData.map(d => d.color),
                  line: { width: 0.5, color: "#333" },
                },
                hoverinfo: "text",
                type: "scatter",
                name: "Garments",
              },
            ]}
            layout={{
              autosize: true,
              height: 400,
              margin: { l: 40, r: 30, b: 40, t: 30 },
              xaxis: { title: "Date", type: "date" },
              yaxis: { visible: false },
              hovermode: "closest",
            }}
            config={{
              responsive: true,
              displaylogo: false,
              scrollZoom: true,
              modeBarButtonsToRemove: ["lasso2d", "select2d"],
            }}
            style={{ width: "100%", height: "100%" }}
            onClick={(e: any) => {
              if (e.points && e.points.length > 0) {
                const idx = e.points[0].pointIndex;
                onSelect(chartData[idx].items);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ScatterPlot;