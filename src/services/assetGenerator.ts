import { GoogleGenAI } from '@google/genai';

export async function generateAllAssets(onProgress?: (progress: number, currentAsset: string) => void) {
  // Base URL for raw files in the GitHub repository
  const BASE_URL = import.meta.env.VITE_ASSETS_BASE_URL || "https://raw.githubusercontent.com/jasperaus/IronVanguard/main/assets";
  
  // Try to use process.env first (injected by vite config), or fall back to import.meta.env
  let geminiApiKey = "";
  try {
    geminiApiKey = process.env.GEMINI_API_KEY || "";
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }

  if (!geminiApiKey) {
    geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  }

  const assets = [
    { name: "mech_light", prompt: "A 3D isometric render of a sleek, agile light scout mech, bright green armor with dark grey joints, futuristic, clean white background, high quality, highly detailed" },
    { name: "mech_medium", prompt: "A 3D isometric render of a balanced, humanoid medium assault mech, bright green armor with dark grey joints, missile pods, futuristic, clean white background, high quality, highly detailed" },
    { name: "mech_heavy", prompt: "A 3D isometric render of a massive, tank-like heavy mech, bright green armor with dark grey joints, dual cannons, bulky, futuristic, clean white background, high quality, highly detailed" },
    { name: "terrain_base", prompt: "A top-down 2D tileable texture map of a sci-fi battlefield, dirt and metal grates, high quality, highly detailed" }
  ];

  const results: Record<string, string> = {};
  let completed = 0;

  // Helper to check if an image actually exists at the URL
  const checkImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      // Add crossOrigin to prevent canvas tainting issues if we ever need to read pixel data
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  for (const asset of assets) {
    if (onProgress) {
      onProgress(completed / assets.length, asset.name);
    }
    
    const url = `${BASE_URL}/${asset.name}.png`;
    const exists = await checkImage(url);
    
    if (exists) {
      results[asset.name] = url;
    } else if (geminiApiKey) {
      try {
        console.log(`Generating asset ${asset.name} via Gemini AI...`);
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: asset.prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1',
                outputMimeType: 'image/png'
            }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64Image = response.generatedImages[0].image.imageBytes;
            const dataUrl = `data:image/png;base64,${base64Image}`;
            results[asset.name] = dataUrl;
            console.log(`Successfully generated ${asset.name}`);
        } else {
            console.warn(`Failed to generate ${asset.name}, falling back to procedural.`);
            results[asset.name] = "";
        }
      } catch (e) {
          console.error(`Error generating ${asset.name}:`, e);
          results[asset.name] = "";
      }
    } else {
      console.warn(`Asset ${asset.name}.png not found at ${url} and no Gemini API Key provided. Using procedural fallback.`);
      results[asset.name] = ""; // Empty string triggers procedural fallback in PixiApp
    }
    
    completed++;
    if (onProgress) {
      onProgress(completed / assets.length, asset.name);
    }
  }

  return results;
}
