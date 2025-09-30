import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"

import ScatterPlot from "@/components/ui/ScatterPlot";

// 🆕 New GarmentTable component to display multiple items
function GarmentTable({ items, onSelectRow }: { items: any[]; onSelectRow: (index: number) => void }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-6 border rounded-md shadow p-4">
      <h3 className="font-semibold mb-2">Garments at this point:</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Garment Type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Likes</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id} onClick={() => onSelectRow(index)} className="cursor-pointer">
              <TableCell>{item.garment_type}</TableCell>
              <TableCell>{item.source}</TableCell>
              <TableCell>{item.engagement_views}</TableCell>
              <TableCell>{item.engagement_likes}</TableCell>
              <TableCell>{new Date(item.timestamp).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// 🆕 This is the new GarmentDetails component with navigation
function GarmentDetails({ items, selectedIndex, onNavigate }: { items: any[]; selectedIndex: number; onNavigate: (direction: 'prev' | 'next') => void }) {
  if (!items || items.length === 0) return null;
  const item = items[selectedIndex];

  // Normalize palette: pr+efer palette array, fallback to single color
  const palette: string[] = Array.isArray(item.palette)
    ? item.palette
    : item.color
    ? [item.color]
    : [];

  return (
    <div className="mt-6">
      {/* 🆕 Add the navigation controls */}
      {items.length > 1 && (
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" onClick={() => onNavigate('prev')} disabled={selectedIndex === 0}>
            ← Previous
          </Button>
          <span>
            {selectedIndex + 1} of {items.length}
          </span>
          <Button variant="outline" onClick={() => onNavigate('next')} disabled={selectedIndex === items.length - 1}>
            Next →
          </Button>
        </div>
      )}
      {/* Garment Details grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Breakdown */}
        <div className="border rounded-md p-4 bg-white shadow">
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
        {/* Right: GarmentViewer Placeholder */}
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
      </div>
    </div>
  );
}

const COLOR_PALETTES = {
  neutrals: [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#000000' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Navy', hex: '#000080' },
  ],
  denim: [
    { name: 'Light Blue', hex: '#ADD8E6' },
    { name: 'Indigo', hex: '#4B0082' },
  ],
  pastels: [
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'Mint', hex: '#98FF98' },
    { name: 'Peach', hex: '#FFDAB9' },
    { name: 'Pink', hex: '#FFC0CB' },
  ],
  brights: [
    { name: 'Red', hex: '#FF0000' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Maroon', hex: '#800000' },
  ],
};

const DEMOGRAPHICS_OPTIONS = [
  "Infants & Toddlers",
  "Newborn (0–3 months)",
  "Infant (3–12 months)",
  "Toddler (1–3 years)",
  "Children",
  "Little Kids (3–5 years / Preschool)",
  "Kids (6–8 years / Early school age)",
  "Pre-teens (9–12 years / Tweens)",
  "Teens",
  "Young Teens (13–15 years)",
  "Older Teens (16–19 years)",
  "Adults",
  "Young Adults (20–29 years)",
  "Adults (30–44 years)",
  "Middle Age (45–59 years)",
  "Seniors (60+ years)"
];

const GARMENT_ATTRIBUTES = {
  prints: ["Solid", "Floral", "Stripes", "Checks", "Polka Dots", "Abstract", "Graphic Prints", "Animal Print", "Tie-Dye"],
  patterns: ["Slim Fit", "Regular Fit", "Oversized", "Straight Cut", "Relaxed Fit", "A-Line", "Bodycon", "Flared"],
  lengths: ["Cropped", "Mini", "Midi", "Maxi", "Knee-Length", "Ankle-Length", "Full-Length"],
  necklines: ["Crew Neck", "V-Neck", "Collared", "Polo Neck", "Boat Neck", "Square Neck", "Halter", "Off-Shoulder"],
  sleeveStyles: ["Full Sleeve", "Half Sleeve", "Sleeveless", "Puff Sleeve", "Cap Sleeve", "Bell Sleeve", "3/4 Sleeve"],
  fabrics: ["Cotton", "Polyester", "Rayon", "Denim", "Linen", "Jersey", "Viscose", "Knits", "Blends"]
};

function App() {
  const [activeTab, setActiveTab] = useState("discovery");

  // 🔹 Form states
  const [gender, setGender] = useState<string>("");
  const [demographics, setDemographics] = useState<string>("");
  const [garmentType, setGarmentType] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  const [engagementThreshold, setEngagementThreshold] = useState<number>(0);
  const [timeline, setTimeline] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [geography, setGeography] = useState<string>("");
  const [optional, setOptional] = useState<{ style?: string; color?: string; pattern?: string }>({});

  // Add new state variables for garment attributes
  const [colors, setColors] = useState<string[]>([]);
  const [prints, setPrints] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [lengths, setLengths] = useState<string[]>([]);
  const [necklines, setNecklines] = useState<string[]>([]);
  const [sleeveStyles, setSleeveStyles] = useState<string[]>([]);
  const [fabrics, setFabrics] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState<string>("");

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submittedPredictAttempt, setSubmittedPredictAttempt] = useState(false);

  // Update this state to be an object to handle both types of datasets:
  const [datasetToPredict, setDatasetToPredict] = useState<{ type: 'url' | 'files', data: string | File[] } | null>(null);

  // 🔹 New states for Agent 2
  const [predictionDate, setPredictionDate] = useState<string>("");
  const [predictionGeography, setPredictionGeography] = useState<string>("");
  const [targetGroup, setTargetGroup] = useState<{ age?: string; income?: string; gender?: string }>({});

  // 🔹 Output states
  const [results, setResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [showOutput, setShowOutput] = useState(false);
  const [datasetUrl, setDatasetUrl] = useState<string | null>(null);

  const [garments, setGarments] = useState<string[]>([]);

  // Add these new states for Agent 2
  const [predictorResults, setPredictorResults] = useState<any[]>([]);
  const [predictorSelectedItems, setPredictorSelectedItems] = useState<any[]>([]);
  const [predictorSelectedItemIndex, setPredictorSelectedItemIndex] = useState<number>(0);
  const [showPredictorOutput, setShowPredictorOutput] = useState(false);

  // validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedAttempt, setSubmittedAttempt] = useState(false);

  // 🔹 Fetch garments from backend when gender changes
  useEffect(() => {
    if (!gender) {
      setGarments([]);
      return;
    }

    const fetchGarments = async () => {
      try {
        const res = await fetch(`http://localhost:8000/garments?gender=${gender}`);
        const data = await res.json();
        setGarments(data);
      } catch (error) {
        console.error("Error fetching garments:", error);
      }
    };

    fetchGarments();
  }, [gender]);

  // Handle multi-select toggle
  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
  };

  const handleColorSelection = (hex: string) => {
    setColors(prev =>
      prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]
    );
  };

  const handleAddCustomColor = () => {
    if (customColor.trim() && !colors.includes(customColor.trim())) {
      setColors(prev => [...prev, customColor.trim()]);
      setCustomColor("");
    }
  };

  // Validation function (sets errors state)
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!gender) e.gender = "Gender is required.";
    if (!garmentType) e.garmentType = "Garment type is required.";
    if (!sources || sources.length === 0) e.sources = "Select at least one source.";
    if (!timeline.start) e.start = "Start date is required.";
    if (!timeline.end) e.end = "End date is required.";
    if (timeline.start && timeline.end) {
      const s = new Date(timeline.start);
      const t = new Date(timeline.end);
      if (s > t) e.timeline = "Start date must be before end date.";
    }
    if (!geography) e.geography = "Geography is required.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // 🔹 Handle process → call backend (stub payload regardless of selected values but only after validation)
  const handleProcess = async () => {
    setSubmittedAttempt(true);
    const ok = validate();
    if (!ok) {
      // don't send request, show errors on UI
      return;
    }

    // request payload (from backend)
    const payload = {
      gender: gender,
      demographics: demographics,
      garment_type: garmentType,
      sources: sources,
      engagement_threshold: engagementThreshold,
      timeline: timeline,
      geography: geography,
      optional: {
        ...optional,
        colors,
        prints,
        patterns,
        lengths,
        necklines,
        sleeveStyles,
        fabrics
      }
    };

    console.log("Sending payload to backend:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch("http://localhost:8000/discovery/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // show basic error to console; you can surface this to UI if needed
        const text = await res.text();
        console.error("Discovery API error:", res.status, text);
        return;
      }

      const data = await res.json();
      console.log("Discovery response:", data);
      console.log("Discovery response keys:", Object.keys(data));


      // ✅ Update state and move to output screen
      const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : data.results || [];

    setResults(items);
    setSelectedItems(items.length > 0 ? [items[0]] : []);
    setSelectedItemIndex(0);
    setShowOutput(true);
    setDatasetUrl(data.dataset_url || null);
    }
    catch (err) {
      console.error("Error running discovery:", err);
    }
  };

  // 🔹 Handle dataset download
  const handleDownload = () => {
    if (datasetUrl) {
      const link = document.createElement("a");
      link.href = `http://localhost:8000${datasetUrl}`;
      link.setAttribute("download", "discovery_data.csv"); // You can set a custom filename here
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Create a new handler for file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Validate file type
      const nonCsvFiles = filesArray.filter(file => file.type !== 'text/csv');
      if (nonCsvFiles.length > 0) {
        setErrors(prev => ({ ...prev, file: 'Only CSV files are allowed.' }));
        setUploadedFiles([]);
      } else {
        setErrors(prev => ({ ...prev, file: '' }));
        setUploadedFiles(filesArray);
        setDatasetToPredict({ type: 'files', data: filesArray });
      }
    }
  };

  // Update this handler to correctly set the new state
  const handleUseInAgent2 = () => {
    if (datasetUrl) {
      setDatasetToPredict({ type: 'url', data: datasetUrl });
      setActiveTab("predictor");
      setShowOutput(false);
    }
  };

  // Create a new validation function for the predict form
  const validatePredictForm = (): boolean => {
    const e: Record<string, string> = {};
    if (!datasetToPredict) e.dataset = "Please upload a dataset or use one from Agent 1.";
    if (!predictionDate) e.predictionDate = "Prediction date is required.";
    if (!predictionGeography) e.predictionGeography = "Geography is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePredictorItemSelect = (items: any[]) => {
    setPredictorSelectedItems(items);
    setPredictorSelectedItemIndex(0);
  };

  const handlePredictorItemNavigate = (direction: 'prev' | 'next') => {
      setPredictorSelectedItemIndex(prevIndex => {
          if (direction === 'next' && prevIndex < predictorSelectedItems.length - 1) {
              return prevIndex + 1;
          }
          if (direction === 'prev' && prevIndex > 0) {
              return prevIndex - 1;
          }
          return prevIndex;
      });
  };

  const handlePredict = async () => {
    setSubmittedPredictAttempt(true);
    const ok = validatePredictForm();
    if (!ok) {
      return;
    }

    // --- Start of Mock Data for Demo ---
    const mockPredictorResults = [
      {
        id: "predicted_1",
        garment_type: "Kurta",
        color: "blue",
        pattern: "checks",
        style: "casual",
        engagement_likes: 2500,
        engagement_views: 12000,
        timestamp: "2025-10-01T10:00:00Z",
        source: "Instagram",
        image_url: "",
        influence : "SS"
      },
      {
        id: "predicted_2",
        garment_type: "T-Shirt",
        color: "red",
        pattern: "stripes",
        style: "athleisure",
        engagement_likes: 5000,
        engagement_views: 25000,
        timestamp: "2025-10-10T10:00:00Z",
        source: "YouTube",
        image_url: "",
        influence : "SS"
      },
      {
        id: "predicted_3",
        garment_type: "Jeans",
        color: "blue",
        pattern: "solid",
        style: "casual",
        engagement_likes: 1500,
        engagement_views: 8000,
        timestamp: "2025-10-20T10:00:00Z",
        source: "Facebook",
        image_url: "",
        influence : "SS"
      },
      {
        id: "predicted_4",
        garment_type: "Jacket",
        color: "black",
        pattern: "solid",
        style: "streetwear",
        engagement_likes: 4500,
        engagement_views: 20000,
        timestamp: "2025-11-05T10:00:00Z",
        source: "Celebrities",
        image_url: "",
        influence : "SS"
      },
      {
        id: "predicted_5",
        garment_type: "Dress",
        color: "green",
        pattern: "floral",
        style: "bohemian",
        engagement_likes: 3000,
        engagement_views: 15000,
        timestamp: "2025-11-15T10:00:00Z",
        source: "Cinema",
        image_url: "",
        influence : "SS"
      },
      // You'll need more mock data to populate the graph
      // Add more items here with 'timestamp' and 'source' properties.
      {
        id: "predicted_6",
        garment_type: "Jeans",
        color: "blue",
        pattern: "solid",
        style: "casual",
        engagement_likes: 1500,
        engagement_views: 8000,
        image_url: "",
        timestamp: "2025-10-01T10:00:00Z",
        source: "Instagram",
        influence : "SS"
      },
      {
        id: "predicted_7",
        garment_type: "Jacket",
        color: "black",
        pattern: "solid",
        style: "streetwear",
        engagement_likes: 4500,
        engagement_views: 20000,
        image_url: "",
        timestamp: "2025-10-15T10:00:00Z",
        source: "YouTube",
        influence : "SS"
      },
      {
        id: "predicted_8",
        garment_type: "Dress",
        color: "green",
        pattern: "floral",
        style: "bohemian",
        engagement_likes: 3000,
        engagement_views: 15000,
        image_url: "",
        timestamp: "2025-11-05T10:00:00Z",
        source: "Celebrities",
        influence : "SS"
      },
    ];
    // --- End of Mock Data ---

    const transformedResults = mockPredictorResults.map(item => ({
        timestamp: item.timestamp,
        items: [item], // Wrap the single item in an array
        engagement_metric_avg: (item.engagement_likes + item.engagement_views) / 2, // Simple average for the demo
        item_count: 1, // Count is 1 since it's a single item for now
    }));

    // Update state with mock data
    setPredictorResults(transformedResults);
    setPredictorSelectedItems(mockPredictorResults.length > 0 ? [mockPredictorResults[0]] : []);
    setPredictorSelectedItemIndex(0);
    setShowPredictorOutput(true);
  };

  // 🆕 Handler for selecting a single item from the scatter plot
  const handleItemSelect = (items: any[]) => {
    console.log("Items selected from scatter plot:", items);
    setSelectedItems(items);
    setSelectedItemIndex(0); // Reset to the first item on new selection
  };

  // 🆕 Handler for navigation through the selected items
  const handleItemNavigate = (direction: 'prev' | 'next') => {
    setSelectedItemIndex(prevIndex => {
      if (direction === 'next' && prevIndex < selectedItems.length - 1) {
        return prevIndex + 1;
      }
      if (direction === 'prev' && prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
  };

  // 🪄 Define a type for the component props
  interface MultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
  }

  // 🪄 Add the props type to the component
  const MultiSelectDropdown = ({ label, options, selected, onToggle }: MultiSelectProps) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          <Label>{label}</Label>
          <span className="ml-auto text-muted-foreground">{selected.length} selected</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {options.map((option: string) => ( // 🪄 Add type here
            <div key={option} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={option}
                checked={selected.includes(option)}
                onCheckedChange={() => onToggle(option)}
              />
              <label
                htmlFor={option}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="bg-background text-foreground min-h-screen p-6">
      {/* Top Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full mb-6">
          <TabsTrigger value="scraper">Agent 0: Scraper</TabsTrigger>
          <TabsTrigger value="discovery">Agent 1: Discovery</TabsTrigger>
          <TabsTrigger value="predictor">Agent 2: Predictor</TabsTrigger>
          <TabsTrigger value="3d_generator">Agent 3: 3D generator</TabsTrigger>
          <TabsTrigger value="pdp_creator">Agent 4: PDP Creator</TabsTrigger>
        </TabsList>

        {/* Agent 0: Scraper (placeholder) */}
        <TabsContent value="scraper">
          <h1 className="text-2xl font-bold mb-4">Agent 0: Scraper</h1>
          <p className="text-muted-foreground">This tab is a placeholder for the Scraper functionality.</p>
        </TabsContent>

        {/* Agent 1: Discovery */}
        <TabsContent value="discovery">
          {!showOutput ? (
            <>
              <h1 className="text-2xl font-bold mb-4">Discovery / Researcher</h1>
              <div className="space-y-4">
                {/* Gender */}
                <div>
                  <Label>Gender</Label>
                  <Select onValueChange={(val) => { setGender(val); if (submittedAttempt) { validate(); } }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
                </div>

                {/* Demographics */}
                <div>
                  <Label>Demographics</Label>
                  <Select onValueChange={setDemographics}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a demographic group" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMOGRAPHICS_OPTIONS.map(demo => (
                        <SelectItem key={demo} value={demo}>
                          {demo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Garment Type */}
                <div>
                  <Label>Garment Type</Label>
                  <Select onValueChange={(val) => { setGarmentType(val); if (submittedAttempt) { validate(); } }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select garment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {garments.map((g) => (
                        <SelectItem key={g} value={g.toLowerCase()}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.garmentType && <p className="text-red-600 text-sm mt-1">{errors.garmentType}</p>}
                </div>

                {/* Sources */}
                <div>
                  <Label>Sources</Label>
                  <div className="flex flex-col gap-2 mt-2">
                    {["Instagram", "Facebook", "YouTube", "Cinema", "Celebrities", "Marketplace"].map((src) => (
                      <label key={src} className="flex items-center gap-2">
                        <Checkbox
                          checked={sources.includes(src)}
                          onCheckedChange={() => { toggleSelection(setSources, src); if (submittedAttempt) { validate(); } }}
                        />{" "}
                        {src}
                      </label>
                    ))}
                  </div>
                  {errors.sources && <p className="text-red-600 text-sm mt-1">{errors.sources}</p>}
                </div>

                {/* Engagement Threshold */}
                <div>
                  <Label>Engagement Threshold (likes/views)</Label>
                  <Input
                    type="number"
                    value={engagementThreshold}
                    onChange={(e) => setEngagementThreshold(Number(e.target.value))}
                  />
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={timeline.start}
                      onChange={(e) => { setTimeline({ ...timeline, start: e.target.value }); if (submittedAttempt) { validate(); } }}
                    />
                    {errors.start && <p className="text-red-600 text-sm mt-1">{errors.start}</p>}
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={timeline.end}
                      onChange={(e) => { setTimeline({ ...timeline, end: e.target.value }); if (submittedAttempt) { validate(); } }}
                    />
                    {errors.end && <p className="text-red-600 text-sm mt-1">{errors.end}</p>}
                  </div>
                </div>
                {errors.timeline && <p className="text-red-600 text-sm mt-1">{errors.timeline}</p>}

                {/* Geography */}
                <div>
                  <Label>Geography</Label>
                  <Select onValueChange={(val) => { setGeography(val); if (submittedAttempt) { validate(); } }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.geography && <p className="text-red-600 text-sm mt-1">{errors.geography}</p>}
                </div>

                {/* Optional Fields */}
                <div>
                  <Label>Optional Fields</Label>
                  <div className="space-y-4">
                    {/* Color Swatches */}
                    <div>
                      <Label>Colors</Label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(COLOR_PALETTES).map(([category, colorsArray]) => (
                          <div key={category}>
                            <h4 className="font-semibold text-sm mb-1 capitalize">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {colorsArray.map((c) => (
                                <div
                                  key={c.hex}
                                  className={`color-swatch ${colors.includes(c.hex) ? 'selected' : ''}`}
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                  onClick={() => handleColorSelection(c.hex)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="#HEX or css color"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomColor()}
                        />
                        <Button onClick={handleAddCustomColor}>Add</Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Click a swatch to remove. Presets: neutrals, denim, pastels, brights.</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {colors.map(color => (
                          <span
                            key={color}
                            className="inline-block w-8 h-8 rounded-full border-2 border-primary-foreground cursor-pointer"
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelection(color)}
                            title={`Click to remove: ${color}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Multi-select dropdowns for garment attributes */}
                    <MultiSelectDropdown
                      label="Prints"
                      options={GARMENT_ATTRIBUTES.prints}
                      selected={prints}
                      onToggle={val => toggleSelection(setPrints, val)}
                    />
                    <MultiSelectDropdown
                      label="Pattern / Fit"
                      options={GARMENT_ATTRIBUTES.patterns}
                      selected={patterns}
                      onToggle={val => toggleSelection(setPatterns, val)}
                    />
                    <MultiSelectDropdown
                      label="Length"
                      options={GARMENT_ATTRIBUTES.lengths}
                      selected={lengths}
                      onToggle={val => toggleSelection(setLengths, val)}
                    />
                    <MultiSelectDropdown
                      label="Neckline"
                      options={GARMENT_ATTRIBUTES.necklines}
                      selected={necklines}
                      onToggle={val => toggleSelection(setNecklines, val)}
                    />
                    <MultiSelectDropdown
                      label="Sleeve Style"
                      options={GARMENT_ATTRIBUTES.sleeveStyles}
                      selected={sleeveStyles}
                      onToggle={val => toggleSelection(setSleeveStyles, val)}
                    />
                    <MultiSelectDropdown
                      label="Fabric"
                      options={GARMENT_ATTRIBUTES.fabrics}
                      selected={fabrics}
                      onToggle={val => toggleSelection(setFabrics, val)}
                    />

                    {/* Legacy inputs */}
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        placeholder="Garment Style"
                        onChange={(e) => setOptional({ ...optional, style: e.target.value })}
                      />
                      <Input
                        placeholder="Color (legacy)"
                        onChange={(e) => setOptional({ ...optional, color: e.target.value })}
                      />
                      <Input
                        placeholder="Pattern (legacy)"
                        onChange={(e) => setOptional({ ...optional, pattern: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Offline Upload */}
                <div>
                  <Label>Offline Data Upload</Label>
                  <Input type="file"/>
                </div>

                {/* Process Button */}
                <div className="mt-6">
                  <Button className="w-full" onClick={() => { setSubmittedAttempt(true); handleProcess(); }}>
                    Process →
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Output screen */}
              <h1 className="text-2xl font-bold mb-4">Discovery Output</h1>
              {results.length > 0 ? (
                <>
                {/* Pass the new handler to ScatterPlot */}
                  <ScatterPlot items={results} onSelect={handleItemSelect} />
                  {selectedItems.length > 0 && <GarmentDetails items={selectedItems} selectedIndex={selectedItemIndex} onNavigate={handleItemNavigate} />}
                  {/* 🆕 Render the new GarmentTable component below */}
                  {selectedItems.length > 1 && <GarmentTable items={selectedItems} onSelectRow={setSelectedItemIndex} />}
                </>
              ) : (
                <p className="text-gray-500">No results available. Try different inputs.</p>
              )}
              <div className="mt-4 flex gap-4">
                <Button onClick={() => setShowOutput(false)}>← Back to Form</Button>
                <Button variant="secondary" onClick={handleDownload} disabled={!datasetUrl}>⬇ Export Dataset</Button>
                <Button variant="default" onClick={handleUseInAgent2} disabled={!datasetUrl}>Use in Agent 2 →</Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Agent 2 Predictor */}
        <TabsContent value="predictor">
        {!showPredictorOutput ? (
          // Agent 2 Input Form
          <>
            <h1 className="text-2xl font-bold mb-4">Agent 2: Trend Predictor</h1>
            <div className="space-y-4">
              {/* Dataset Input Field */}
              <div>
                <Label>Upload Dataset</Label>
                <Input
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={handleFileChange}
                />
                {datasetToPredict && (
                  <p className="text-sm text-gray-500 mt-1">
                    Using dataset:
                    {datasetToPredict.type === 'url' ? (
                      <a href={`http://localhost:8000${datasetToPredict.data}`} target="_blank" rel="noopener noreferrer">
                        {String(datasetToPredict.data).split('/').pop()}
                      </a>
                    ) : (
                      (datasetToPredict.data as File[]).map((file: File) => file.name).join(', ')
                    )}
                  </p>
                )}
                {errors.dataset && <p className="text-red-600 text-sm mt-1">{errors.dataset}</p>}
                {errors.file && <p className="text-red-600 text-sm mt-1">{errors.file}</p>}
              </div>
              {/* Prediction Date */}
              <div>
                <Label>For what date?</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]} // ✅ disables past dates
                  onChange={(e) => { setPredictionDate(e.target.value); if (submittedPredictAttempt) validatePredictForm(); }}
                />
                {errors.predictionDate && <p className="text-red-600 text-sm mt-1">{errors.predictionDate}</p>}
              </div>
              {/* Geography */}
              <div>
                <Label>Geography</Label>
                <Select onValueChange={(val) => { setPredictionGeography(val); if (submittedPredictAttempt) validatePredictForm(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                    </SelectContent>
                </Select>
                {errors.predictionGeography && <p className="text-red-600 text-sm mt-1">{errors.predictionGeography}</p>}
              </div>
              {/* Target Group */}
              <div>
                <Label>Target Group (Optional)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="Age" onChange={(e) => setTargetGroup({ ...targetGroup, age: e.target.value })} />
                  <Input placeholder="Income" onChange={(e) => setTargetGroup({ ...targetGroup, income: e.target.value })} />
                  <Input placeholder="Gender" onChange={(e) => setTargetGroup({ ...targetGroup, gender: e.target.value })} />
                </div>
              </div>
              {/* Predict Button */}
              <div className="mt-6">
                <Button className="w-full" onClick={handlePredict}>Predict →</Button>
              </div>
            </div>
          </>
        ) : (
          // Agent 2 Output Screen
          <>
            <h1 className="text-2xl font-bold mb-4">Trend Prediction Output</h1>
            {predictorResults.length > 0 ? (
                <>
                    {/* Scatter Plot for Agent 2 */}
                    <ScatterPlot items={predictorResults} onSelect={handlePredictorItemSelect} />
                    {/* Garment Details & Viewer for Agent 2 */}
                    {predictorSelectedItems.length > 0 && (
                        <GarmentDetails
                            items={predictorSelectedItems}
                            selectedIndex={predictorSelectedItemIndex}
                            onNavigate={handlePredictorItemNavigate}
                        />
                    )}
                    {/* Garment Table for Agent 2 */}
                    {predictorSelectedItems.length > 1 && (
                        <GarmentTable
                            items={predictorSelectedItems}
                            onSelectRow={setPredictorSelectedItemIndex}
                        />
                    )}
                </>
            ) : (
              <p className="text-gray-500">No predictions available. Try different inputs.</p>
            )}
            <div className="mt-4 flex gap-4">
              <Button onClick={() => setShowPredictorOutput(false)}>← Back to Form</Button>
              <Button variant="secondary" onClick={handleDownload} disabled={!datasetUrl}>⬇ Export Dataset</Button>
              <Button variant="default" onClick={handleUseInAgent2} disabled={!datasetUrl}>Use in Agent 3 →</Button>
            </div>
          </>
        )}
      </TabsContent>

        {/* Agent 3: 3D generator (placeholder) */}
        <TabsContent value="3d_generator">
          <h1 className="text-2xl font-bold mb-4">Agent 3: 3D generator</h1>
          <p className="text-muted-foreground">This tab is a placeholder for the 3D generator functionality.</p>
        </TabsContent>

        {/* Agent 4: PDP Creator (placeholder) */}
        <TabsContent value="pdp_creator">
          <h1 className="text-2xl font-bold mb-4">Agent 4: PDP Creator</h1>
          <p className="text-muted-foreground">This tab is a placeholder for the PDP Creator functionality.</p>
        </TabsContent>

      </Tabs>
    </div>
  );
}

export default App;