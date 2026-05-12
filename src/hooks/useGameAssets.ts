import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { generateAllAssets } from '../services/assetGenerator';

export function useGameAssets(isAuthReady: boolean, user: User | null) {
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentAssetLoading, setCurrentAssetLoading] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const start = async () => {
      // Generate assets in background
      try {
        setGenerationError(null);
        const generatedAssets = await generateAllAssets((progress, asset) => {
          setLoadingProgress(progress);
          setCurrentAssetLoading(asset);
        });

        // Check if any assets failed to generate (meaning they fell back to procedural)
        const missingAssets = Object.values(generatedAssets).filter(val => !val);
        if (missingAssets.length > 0) {
          setGenerationError("Some high-fidelity assets failed to generate (likely due to API quota limits). Using procedural fallback graphics.");
        }

        setAssets(generatedAssets);
      } catch (err: any) {
        console.error("Failed to generate assets", err);
        setGenerationError(err.message || "Failed to generate assets.");
      }
    };
    start();
  }, [isAuthReady, user]);

  const handleReady = () => {
    setIsLoading(false);
  };

  return {
    assets,
    isLoading,
    loadingProgress,
    currentAssetLoading,
    generationError,
    handleReady
  };
}
