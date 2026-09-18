import { Vibe } from "./types";

export const VIBES: Vibe[] = [
  {
    id: "korean_indoor",
    title: "Indoor Soft Decor Studio",
    description:
      "Clean pastel tones, bright, elegant, airy curtains, soft lighting.",
  },
  {
    id: "nature_forest",
    title: "Nature Forest Mood",
    description: "Tall trees, natural sunlight beams, warm romantic tones.",
  },
  {
    id: "evening_lights",
    title: "Romantic Evening Fairy Lights",
    description: "Warm glowing lights, dreamy ambience, bokeh effects.",
  },
  {
    id: "luxury_ballroom",
    title: "Luxury Indoor Ballroom",
    description: "Grand chandeliers, polished floor, elegant classical look.",
  },
  {
    id: "sunset_beach",
    title: "Sunset Beach Pastel Glow",
    description: "Soft waves, orange sky, cinematic feeling, gentle breeze.",
  },
  {
    id: "japanese_sakura",
    title: "Japanese Sakura Theme",
    description: "Cherry blossoms, soft pink, airy atmosphere, spring vibes.",
  },
  {
    id: "minimalist_modern",
    title: "Minimalist Modern Studio",
    description: "Clean interior, simple & classy, high fashion aesthetic.",
  },
  {
    id: "vintage_film",
    title: "Vintage Film Outdoor",
    description: "Muted tones, classic film grain, nostalgic feel.",
  },
  {
    id: "botanical_greenhouse",
    title: "Botanical Greenhouse",
    description:
      "Glasshouse with lush plants, soft natural light, organic feel.",
  },
  {
    id: "fantasy_ethereal",
    title: "Fantasy Ethereal Theme",
    description:
      "Magical landscapes, floating islands, mystic castles, dreamy supernatural lighting.",
  },
  {
    id: "ocean_underwater",
    title: "Deep Ocean Theme",
    description:
      "Underwater aesthetic, coral reefs, blue marine tones, rays of light through water.",
  },
  {
    id: "iconic_landmarks",
    title: "Iconic World Landmarks",
    description:
      "Famous structures (Eiffel Tower, Taj Mahal), historic architecture, grand travel vibes.",
  },
];

export const PHOTO_CREATION_SYSTEM_PROMPT = `
You are an advanced photo creation assistant.
Your goal is to create high-quality, cinematic, professionally-edited model photos featuring the subject/model from the uploaded images. 
Maintain face shape, eyes, nose, lips, hairstyle, and natural skin tone.
Cinematic composition, soft studio lighting, polished look.
High-resolution, clean, sharp, professional-grade photography.
Realistic blending with background and environment.
No double limbs, warped bodies, or artifacts.
`;
