export async function generateAllAssets(onProgress?: (progress: number, currentAsset: string) => void) {
  // Base URL for raw files in the GitHub repository
  const GITHUB_BASE_URL = "https://raw.githubusercontent.com/jasperaus/IronVanguard/main/assets";
  
  const assets = [
    "mech_light",
    "mech_medium",
    "mech_heavy",
    "terrain_base"
  ];

  const results: Record<string, string> = {};
  let completed = 0;

  // Helper to check if an image actually exists at the URL
  const checkImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  for (const name of assets) {
    if (onProgress) {
      onProgress(completed / assets.length, name);
    }
    
    const url = `${GITHUB_BASE_URL}/${name}.png`;
    const exists = await checkImage(url);
    
    if (exists) {
      results[name] = url;
    } else {
      console.warn(`Asset ${name}.png not found at ${url}. Using procedural fallback.`);
      results[name] = ""; // Empty string triggers procedural fallback in PixiApp
    }
    
    completed++;
    if (onProgress) {
      onProgress(completed / assets.length, name);
    }
  }

  return results;
}
