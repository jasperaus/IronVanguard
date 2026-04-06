import { GoogleGenAI } from "@google/genai";

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let globalQuotaExceeded = false;

async function generateAssetWithRetry(prompt: string, filename: string, retries = 3): Promise<string | null> {
  if (globalQuotaExceeded) {
    console.info(`Skipping generation for ${filename} (AI quota previously reached).`);
    return null;
  }

  // WARNING: Hardcoding API keys in client-side code is a severe security risk.
  // This key will be visible to anyone inspecting the network traffic or source code.
  // The user explicitly requested this to bypass the UI.
  const ai = new GoogleGenAI({ apiKey: "AIzaSyCPhzyujK9LnfYEHGAUAiTnR9XmNhAn1k4" });

  let attempt = 0;
  while (attempt <= retries) {
    try {
      console.log(`Generating ${filename} (Attempt ${attempt + 1})...`);
      
      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text: `A high-quality, detailed game asset for a BattleTech-style tactical RPG. ${prompt}. Gritty, industrial, sci-fi aesthetic. Isolated on a pure solid #000000 black background. No ground, no environment, no cast shadows on the floor. Dramatic lighting.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          },
        },
      });

      // 30 second timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Generation timeout")), 30000);
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
      return null;
    } catch (error: any) {
      attempt++;
      
      const errorMessage = error?.message?.toLowerCase() || '';
      const isQuotaExceeded = errorMessage.includes('quota') || errorMessage.includes('429') || error?.status === 'RESOURCE_EXHAUSTED';
      
      if (isQuotaExceeded) {
        console.info(`Using fallback procedural graphics for ${filename} (AI quota reached).`);
        globalQuotaExceeded = true;
        return null; // Don't retry if quota is exceeded
      }

      if (attempt > retries) {
        console.warn(`Failed to generate ${filename} after ${retries} retries. Using fallback graphics.`);
        return null;
      }

      const waitTime = 1000;
      console.warn(`Attempt ${attempt} failed for ${filename}. Retrying in ${waitTime}ms...`, error.message);
      await delay(waitTime);
    }
  }
  return null;
}

export async function generateAllAssets(onProgress?: (progress: number, currentAsset: string) => void) {
  // Reset global flag on new generation run
  globalQuotaExceeded = false;

  const assets = [
    { prompt: "Heavy class. Create a gritty, industrial 3D mech character in an ARPG isometric style. FULL BODY SHOT, zoomed out with plenty of empty space around the mech so no parts are cropped. MUST be rendered on a solid, bright chroma-key green background (#00FF00) for easy removal. The design features heavy, slab-sided armor with visible battle scarring, exposed hydraulics, and asymmetrical weapon mounts. Use a muted 'Old Master' color palette of gunmetal, deep rust, and olive drab. Lighting: High-contrast chiaroscuro with a cold blue sensor glow. Textures: High-fidelity PBR with realistic oil leaks and mud accumulation on the lower chassis. Perspective: Fixed 45-degree isometric view with a focus on a heavy, grounded silhouette.", name: "mech_heavy" },
    { prompt: "Medium class. Create a gritty, industrial 3D mech character in an ARPG isometric style. FULL BODY SHOT, zoomed out with plenty of empty space around the mech so no parts are cropped. MUST be rendered on a solid, bright chroma-key green background (#00FF00) for easy removal. The design features heavy, slab-sided armor with visible battle scarring, exposed hydraulics, and asymmetrical weapon mounts. Use a muted 'Old Master' color palette of gunmetal, deep rust, and olive drab. Lighting: High-contrast chiaroscuro with a cold blue sensor glow. Textures: High-fidelity PBR with realistic oil leaks and mud accumulation on the lower chassis. Perspective: Fixed 45-degree isometric view with a focus on a heavy, grounded silhouette.", name: "mech_medium" },
    { prompt: "Light class. Create a gritty, industrial 3D mech character in an ARPG isometric style. FULL BODY SHOT, zoomed out with plenty of empty space around the mech so no parts are cropped. MUST be rendered on a solid, bright chroma-key green background (#00FF00) for easy removal. The design features heavy, slab-sided armor with visible battle scarring, exposed hydraulics, and asymmetrical weapon mounts. Use a muted 'Old Master' color palette of gunmetal, deep rust, and olive drab. Lighting: High-contrast chiaroscuro with a cold blue sensor glow. Textures: High-fidelity PBR with realistic oil leaks and mud accumulation on the lower chassis. Perspective: Fixed 45-degree isometric view with a focus on a heavy, grounded silhouette.", name: "mech_light" },
    { prompt: "A veteran mech pilot portrait. Photorealistic, cinematic lighting, wearing a high-tech flight suit.", name: "pilot_1" },
    { prompt: "A vast, highly detailed, photorealistic 3D render of a muddy battlefield environment. Lush mossy rocks, deep craters, cinematic sunlight, atmospheric fog. Perspective: Fixed 45-degree isometric view. Do not make it a repeating pattern. It should look like a single, cohesive, massive landscape.", name: "terrain_base" },
  ];

  const results: Record<string, string> = {};
  let completed = 0;

  // Limit concurrency to 1 at a time to avoid hitting rate limits
  const CONCURRENCY_LIMIT = 1;
  const chunks = [];
  for (let i = 0; i < assets.length; i += CONCURRENCY_LIMIT) {
    chunks.push(assets.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(async (asset) => {
      // Check cache first
      const cacheKey = `asset_v7_${asset.name}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        results[asset.name] = cached;
      } else {
        const data = await generateAssetWithRetry(asset.prompt, asset.name);
        if (data) {
          results[asset.name] = data;
          try {
            localStorage.setItem(cacheKey, data);
          } catch (e) {
            console.warn("Failed to cache asset, localStorage might be full", e);
          }
        }
      }
      
      completed++;
      if (onProgress) {
        onProgress(completed / assets.length, asset.name);
      }
    }));
  }

  return results;
}
