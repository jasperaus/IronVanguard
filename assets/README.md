# Iron Vanguard Assets

This folder contains the static assets for the Iron Vanguard game. The game engine fetches these files directly from the `main` branch of this repository.

## Required Files

To replace the procedural fallback graphics with your custom art, upload the following files to this folder:

1. **`mech_light.png`** 
   - Transparent PNG
   - ~1024x1024 resolution
   - Isometric angle (facing South-East or South-West)
   
2. **`mech_medium.png`**
   - Transparent PNG
   - ~1024x1024 resolution
   - Isometric angle

3. **`mech_heavy.png`**
   - Transparent PNG
   - ~1024x1024 resolution
   - Isometric angle

4. **`terrain_base.png`**
   - Opaque JPG or PNG
   - ~1920x1080 resolution
   - Isometric muddy battlefield background

*Note: The game engine automatically handles flipping the mechs when they change direction, so you only need to provide one directional facing per mech.*
