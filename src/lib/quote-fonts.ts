export type QuoteFont = {
  id: string;
  name: string;
  family: string;
  category: "serif" | "sans" | "display" | "script";
  weights: number[];
};

export const QUOTE_FONTS: QuoteFont[] = [
  // ── Serif ───────────────────────────────────────────────────────────────
  { id: "cormorant", name: "Cormorant Garamond", family: "'Cormorant Garamond', serif", category: "serif", weights: [400, 600, 700] },
  { id: "playfair", name: "Playfair Display", family: "'Playfair Display', serif", category: "serif", weights: [400, 600, 700, 900] },
  { id: "lora", name: "Lora", family: "'Lora', serif", category: "serif", weights: [400, 600, 700] },
  { id: "merriweather", name: "Merriweather", family: "'Merriweather', serif", category: "serif", weights: [400, 600, 700, 900] },
  { id: "garamond", name: "EB Garamond", family: "'EB Garamond', serif", category: "serif", weights: [400, 600, 700] },
  // ── Sans-serif ──────────────────────────────────────────────────────────
  { id: "manrope", name: "Manrope", family: "'Manrope', sans-serif", category: "sans", weights: [400, 600, 700, 800] },
  { id: "jakarta", name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif", category: "sans", weights: [400, 600, 700, 800] },
  { id: "inter", name: "Inter", family: "'Inter', sans-serif", category: "sans", weights: [400, 600, 700, 900] },
  { id: "oswald", name: "Oswald", family: "'Oswald', sans-serif", category: "sans", weights: [400, 600, 700] },
  // ── Display ─────────────────────────────────────────────────────────────
  { id: "bebas", name: "Bebas Neue", family: "'Bebas Neue', sans-serif", category: "display", weights: [400] },
  { id: "anton", name: "Anton", family: "'Anton', sans-serif", category: "display", weights: [400] },
  { id: "archivo-black", name: "Archivo Black", family: "'Archivo Black', sans-serif", category: "display", weights: [400] },
  { id: "abril", name: "Abril Fatface", family: "'Abril Fatface', display", category: "display", weights: [400] },
  // ── Script ──────────────────────────────────────────────────────────────
  { id: "caveat", name: "Caveat", family: "'Caveat', cursive", category: "script", weights: [400, 600, 700] },
  { id: "dancing", name: "Dancing Script", family: "'Dancing Script', cursive", category: "script", weights: [400, 600, 700] },
];

export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    // Serif
    "family=Cormorant+Garamond:wght@400;600;700",
    "family=Playfair+Display:wght@400;600;700;900",
    "family=Lora:wght@400;600;700",
    "family=Merriweather:wght@400;600;700;900",
    "family=EB+Garamond:wght@400;600;700",
    // Sans-serif
    "family=Manrope:wght@400;600;700;800",
    "family=Plus+Jakarta+Sans:wght@400;600;700;800",
    "family=Inter:wght@400;600;700;900",
    "family=Oswald:wght@400;600;700",
    // Display
    "family=Bebas+Neue",
    "family=Anton",
    "family=Archivo+Black",
    "family=Abril+Fatface",
    // Script
    "family=Caveat:wght@400;600;700",
    "family=Dancing+Script:wght@400;600;700",
  ].join("&") +
  "&display=swap";

export const EXPORT_FORMATS = [
  { id: "ig-post", name: "Instagram Post", width: 1080, height: 1350 },
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

/** Presets curated for the Instagram grain-card look */
export const IG_GRAIN_PRESETS = [
  { id: "forest", name: "Forest", color: "#1a5c38" },
  { id: "steel", name: "Steel Blue", color: "#22527a" },
  { id: "terra", name: "Terracotta", color: "#9c4423" },
  { id: "amber", name: "Amber", color: "#b07818" },
  { id: "plum", name: "Plum", color: "#5a2467" },
  { id: "charcoal", name: "Charcoal", color: "#2a2e35" },
  { id: "navy", name: "Navy", color: "#1b2a4a" },
  { id: "rust", name: "Rust", color: "#8b3a1e" },
  { id: "olive", name: "Olive", color: "#4a5e28" },
  { id: "teal", name: "Teal", color: "#1a5258" },
  { id: "rose", name: "Rose", color: "#8b3052" },
  { id: "sand", name: "Sand", color: "#c4a87a" },
];

export const BACKGROUND_TEXTURES = [
  { id: "none", name: "None" },
  { id: "grain", name: "Film Grain" },
  { id: "paper-fiber", name: "Paper Fiber" },
  { id: "dotted-canvas", name: "Dotted Canvas" },
  { id: "graph-paper", name: "Graph Paper" },
  { id: "linen", name: "Linen" },
] as const;

export type BackgroundTextureId = (typeof BACKGROUND_TEXTURES)[number]["id"];
export type BackgroundMode = "color" | "texture" | "image";
