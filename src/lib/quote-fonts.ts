export type QuoteFont = {
  id: string;
  name: string;
  family: string;
  category: "serif" | "sans" | "display" | "script";
  weights: number[];
};

export const QUOTE_FONTS: QuoteFont[] = [
  { id: "playfair", name: "Playfair Display", family: "'Playfair Display', serif", category: "serif", weights: [400, 700, 900] },
  { id: "lora", name: "Lora", family: "'Lora', serif", category: "serif", weights: [400, 700] },
  { id: "merriweather", name: "Merriweather", family: "'Merriweather', serif", category: "serif", weights: [400, 700, 900] },
  { id: "garamond", name: "EB Garamond", family: "'EB Garamond', serif", category: "serif", weights: [400, 700] },
  { id: "inter", name: "Inter", family: "'Inter', sans-serif", category: "sans", weights: [400, 700, 900] },
  { id: "bebas", name: "Bebas Neue", family: "'Bebas Neue', sans-serif", category: "display", weights: [400] },
  { id: "anton", name: "Anton", family: "'Anton', sans-serif", category: "display", weights: [400] },
  { id: "oswald", name: "Oswald", family: "'Oswald', sans-serif", category: "sans", weights: [400, 700] },
  { id: "archivo-black", name: "Archivo Black", family: "'Archivo Black', sans-serif", category: "display", weights: [400] },
  { id: "abril", name: "Abril Fatface", family: "'Abril Fatface', display", category: "display", weights: [400] },
  { id: "caveat", name: "Caveat", family: "'Caveat', cursive", category: "script", weights: [400, 700] },
  { id: "dancing", name: "Dancing Script", family: "'Dancing Script', cursive", category: "script", weights: [400, 700] },
];

export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Playfair+Display:wght@400;700;900",
    "family=Lora:wght@400;700",
    "family=Merriweather:wght@400;700;900",
    "family=EB+Garamond:wght@400;700",
    "family=Inter:wght@400;700;900",
    "family=Bebas+Neue",
    "family=Anton",
    "family=Oswald:wght@400;700",
    "family=Archivo+Black",
    "family=Abril+Fatface",
    "family=Caveat:wght@400;700",
    "family=Dancing+Script:wght@400;700",
  ].join("&") +
  "&display=swap";

export const EXPORT_FORMATS = [
  { id: "ig-square", name: "Instagram Square", width: 1080, height: 1080 },
  { id: "ig-story", name: "Instagram Story / Reel", width: 1080, height: 1920 },
  { id: "threads", name: "Threads / Twitter", width: 1200, height: 1200 },
  { id: "fb-post", name: "Facebook Post", width: 1200, height: 630 },
] as const;

export type ExportFormatId = (typeof EXPORT_FORMATS)[number]["id"];

export const BACKGROUND_PRESETS = [
  { id: "paper", name: "Cream Paper", color: "#f7f1e6" },
  { id: "white", name: "White", color: "#ffffff" },
  { id: "ivory", name: "Ivory", color: "#fdfaf2" },
  { id: "blush", name: "Blush", color: "#fbeae5" },
  { id: "sage", name: "Sage", color: "#e6ede0" },
  { id: "midnight", name: "Midnight", color: "#0f1115" },
];
