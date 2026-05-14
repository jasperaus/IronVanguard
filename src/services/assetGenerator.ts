export async function generateAllAssets(
  onProgress?: (progress: number, currentAsset: string) => void,
) {
  // Base URL for raw files in the GitHub repository
  const BASE_URL =
    import.meta.env.VITE_ASSETS_BASE_URL ||
    "https://raw.githubusercontent.com/jasperaus/IronVanguard/main/assets";

  const assets = [
    {
      name: "mech_light",
      prompt:
        "A 3D isometric render of a sleek, agile light scout mech, bright green armor with dark grey joints, futuristic, clean white background, high quality, highly detailed",
    },
    {
      name: "mech_medium",
      prompt:
        "A 3D isometric render of a balanced, humanoid medium assault mech, bright green armor with dark grey joints, missile pods, futuristic, clean white background, high quality, highly detailed",
    },
    {
      name: "mech_heavy",
      prompt:
        "A 3D isometric render of a massive, tank-like heavy mech, bright green armor with dark grey joints, dual cannons, bulky, futuristic, clean white background, high quality, highly detailed",
    },
    {
      name: "terrain_base",
      prompt:
        "A top-down 2D tileable texture map of a sci-fi battlefield, dirt and metal grates, high quality, highly detailed",
    },
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
    } else {
      try {
        console.log(`Generating asset ${asset.name} via backend AI API...`);
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: asset.prompt }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.dataUrl) {
            results[asset.name] = data.dataUrl;
            console.log(`Successfully generated ${asset.name}`);
          } else {
            console.warn(
              `Failed to generate ${asset.name}, falling back to procedural.`,
            );
            results[asset.name] = "";
          }
        } else {
          console.warn(
            `Asset ${asset.name}.png API generation failed (${response.status}). Using procedural fallback.`,
          );
          results[asset.name] = "";
        }
      } catch (e) {
        console.error(`Error generating ${asset.name}:`, e);
        results[asset.name] = "";
      }
    }

    completed++;
    if (onProgress) {
      onProgress(completed / assets.length, asset.name);
    }
  }

  return results;
}
