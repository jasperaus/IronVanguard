import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { GameState, MechInstance } from '../game/types';
import { hexToPixel, hexDistance } from '../game/hexUtils';
import { User } from 'firebase/auth';
import { createProceduralMech, MechSpriteContainer } from '../game/MechRenderer';

export interface PixiAppRef {
  playAttackAnimation: (attacker: {q: number, r: number}, target: {q: number, r: number}) => void;
  playExplosionAnimation: (target: {q: number, r: number}) => void;
  playDustAnimation: (target: {q: number, r: number}) => void;
}

interface PixiAppProps {
  gameState: GameState;
  assets: Record<string, string>;
  onHexClick: (q: number, r: number) => void;
  selectedMech?: MechInstance;
  user: User | null;
}

const HEX_SIZE = 45;
const ISO_SQUASH = 0.707; // Factor to squash Y axis for isometric look (45 degrees)

// Custom shader to remove white background from generated mechs
const whiteRemovalShader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);
    
    // Calculate how close to pure white the pixel is
    float whiteness = min(color.r, min(color.g, color.b));
    
    // If it's very bright (close to 1.0), fade it out
    float alpha = 1.0 - smoothstep(0.85, 0.98, whiteness);
    
    // Premultiply alpha for WebGL
    gl_FragColor = vec4(color.rgb * alpha, color.a * alpha);
}
`;
const defaultFilterVertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

const transparencyFilter = PIXI.Filter.from({ gl: { vertex: defaultFilterVertex, fragment: whiteRemovalShader } });
transparencyFilter.padding = 100; // Prevent clipping on the edges of the mech sprite

export const PixiApp = forwardRef<PixiAppRef, PixiAppProps>(({ gameState, assets, onHexClick, selectedMech, user }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gridLayerRef = useRef<PIXI.Container | null>(null);
  const mechLayerRef = useRef<PIXI.Container | null>(null);
  const effectsLayerRef = useRef<PIXI.Container | null>(null);
  const texturesRef = useRef<Record<string, PIXI.Texture>>({});
  const mechSpritesRef = useRef<Record<string, MechSpriteContainer>>({});

  useImperativeHandle(ref, () => ({
    playAttackAnimation: (attackerPos, targetPos) => {
      if (!effectsLayerRef.current) return;
      
      const start = hexToPixel(attackerPos.q, attackerPos.r, HEX_SIZE);
      const end = hexToPixel(targetPos.q, targetPos.r, HEX_SIZE);
      
      const laser = new PIXI.Graphics();
      laser.lineStyle(4, 0xff3300, 1);
      laser.moveTo(start.x, start.y - 40); // Shoot from slightly above base
      laser.lineTo(end.x, end.y - 40);
      
      // Add glow
      const glowFilter = new PIXI.BlurFilter();
      glowFilter.blur = 8;
      
      const laserGlow = new PIXI.Graphics();
      laserGlow.lineStyle(12, 0xff0000, 0.5);
      laserGlow.moveTo(start.x, start.y - 40);
      laserGlow.lineTo(end.x, end.y - 40);
      laserGlow.filters = [glowFilter];
      
      effectsLayerRef.current.addChild(laserGlow);
      effectsLayerRef.current.addChild(laser);
      
      gsap.to([laser, laserGlow], {
        alpha: 0,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          laser.destroy();
          laserGlow.destroy();
        }
      });
    },
    playExplosionAnimation: (targetPos) => {
      if (!effectsLayerRef.current) return;
      
      const pos = hexToPixel(targetPos.q, targetPos.r, HEX_SIZE);
      
      // Create multiple explosion particles
      for (let i = 0; i < 15; i++) {
        const particle = new PIXI.Graphics();
        const color = Math.random() > 0.5 ? 0xff5500 : 0xffaa00;
        particle.beginFill(color);
        particle.drawCircle(0, 0, Math.random() * 10 + 5);
        particle.endFill();
        
        particle.x = pos.x + (Math.random() - 0.5) * 20;
        particle.y = pos.y - 20 + (Math.random() - 0.5) * 20;
        
        effectsLayerRef.current.addChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 50 + 20;
        
        gsap.to(particle, {
          x: particle.x + Math.cos(angle) * speed,
          y: particle.y + Math.sin(angle) * speed - 30, // Move up and out
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: Math.random() * 0.5 + 0.3,
          ease: "power2.out",
          onComplete: () => {
            particle.destroy();
          }
        });
      }
      
      // Flash effect
      const flash = new PIXI.Graphics();
      flash.beginFill(0xffffff, 0.8);
      flash.drawCircle(pos.x, pos.y - 20, 40);
      flash.endFill();
      effectsLayerRef.current.addChild(flash);
      
      gsap.to(flash, {
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => flash.destroy()
      });
    },
    playDustAnimation: (targetPos) => {
      if (!effectsLayerRef.current) return;
      
      const pos = hexToPixel(targetPos.q, targetPos.r, HEX_SIZE);
      
      for (let i = 0; i < 5; i++) {
        const dust = new PIXI.Graphics();
        dust.beginFill(0x888888, 0.5);
        dust.drawCircle(0, 0, Math.random() * 8 + 4);
        dust.endFill();
        
        dust.x = pos.x + (Math.random() - 0.5) * 20;
        dust.y = pos.y + 10 + (Math.random() - 0.5) * 10;
        
        effectsLayerRef.current.addChild(dust);
        
        gsap.to(dust, {
          x: dust.x + (Math.random() - 0.5) * 30,
          y: dust.y - Math.random() * 20 - 10,
          alpha: 0,
          scaleX: 2,
          scaleY: 2,
          duration: Math.random() * 0.5 + 0.5,
          ease: "power1.out",
          onComplete: () => dust.destroy()
        });
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    const app = new PIXI.Application();
    
    app.init({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 0x050808, // Darker, moodier background
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(async () => {
      if (!isMounted) {
        app.destroy(true, { children: true });
        return;
      }
      
      containerRef.current?.appendChild(app.canvas);
      appRef.current = app;

      // Load textures
      for (const [name, data] of Object.entries(assets)) {
        if (!data) continue; // Skip if no data (procedural fallback)
        try {
          const texture = await PIXI.Assets.load(data);
          if (isMounted) {
            texturesRef.current[name] = texture;
          }
        } catch (e) {
          console.error(`Failed to load texture ${name}`, e);
        }
      }

      if (!isMounted) return;

      const worldContainer = new PIXI.Container();
      app.stage.addChild(worldContainer);

      const bgLayer = new PIXI.Container();
      const gridLayer = new PIXI.Container();
      const mechLayer = new PIXI.Container();
      const effectsLayer = new PIXI.Container();
      const lightingLayer = new PIXI.Container(); // New layer for environmental lighting
      
      worldContainer.addChild(bgLayer);
      worldContainer.addChild(gridLayer);
      worldContainer.addChild(mechLayer);
      worldContainer.addChild(effectsLayer);
      worldContainer.addChild(lightingLayer);
      
      gridLayerRef.current = gridLayer;
      mechLayerRef.current = mechLayer;
      effectsLayerRef.current = effectsLayer;

      // Add terrain background if available
      if (texturesRef.current['terrain_base']) {
        const bgSprite = new PIXI.Sprite(texturesRef.current['terrain_base']);
        bgSprite.anchor.set(0.5);
        
        // Scale to cover the area, but un-squash the Y axis because the AI 
        // already generated it in an isometric perspective
        const bgScale = 3500 / texturesRef.current['terrain_base'].width;
        bgSprite.scale.set(bgScale, bgScale / ISO_SQUASH);
        
        bgSprite.alpha = 0.9; // Slightly more visible
        
        bgLayer.addChild(bgSprite);
      }

      // Add Environmental Lighting
      const ambientLight = new PIXI.Graphics();
      ambientLight.beginFill(0x0a1a2a, 0.4); // Atmospheric blue tint
      ambientLight.drawRect(-1500, -1500, 3000, 3000);
      ambientLight.endFill();
      ambientLight.blendMode = 'multiply';
      lightingLayer.addChild(ambientLight);

      const sunLight = new PIXI.Graphics();
      sunLight.beginFill(0xffaa55, 0.15); // Warm sunlight
      sunLight.drawCircle(500, -500, 1200);
      sunLight.endFill();
      sunLight.blendMode = 'add';
      lightingLayer.addChild(sunLight);

      // Center the world
      worldContainer.x = app.screen.width / 2;
      worldContainer.y = app.screen.height / 2;

      // Apply isometric projection to the world
      worldContainer.scale.y = ISO_SQUASH;

      // Camera Controls
      app.stage.eventMode = 'static';
      app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);
      
      let isDragging = false;
      let lastPos = { x: 0, y: 0 };

      app.stage.on('pointerdown', (e) => {
        isDragging = true;
        lastPos = { x: e.global.x, y: e.global.y };
      });

      app.stage.on('pointerup', () => isDragging = false);
      app.stage.on('pointerupoutside', () => isDragging = false);

      app.stage.on('pointermove', (e) => {
        if (isDragging) {
          const dx = e.global.x - lastPos.x;
          const dy = e.global.y - lastPos.y;
          worldContainer.x += dx;
          worldContainer.y += dy;
          lastPos = { x: e.global.x, y: e.global.y };
        }
      });

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const scaleChange = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        
        const newScale = worldContainer.scale.x * scaleChange;
        if (newScale > 0.3 && newScale < 3) {
          const mousePos = app.renderer.events.pointer.global;
          const localPos = worldContainer.toLocal(mousePos);
          
          worldContainer.scale.x = newScale;
          worldContainer.scale.y = newScale * ISO_SQUASH;
          
          worldContainer.x = mousePos.x - localPos.x * worldContainer.scale.x;
          worldContainer.y = mousePos.y - localPos.y * worldContainer.scale.y;
        }
      };

      containerRef.current?.addEventListener('wheel', handleWheel, { passive: false });

      app.ticker.add((ticker) => {
        Object.values(mechSpritesRef.current).forEach((mechContainer: any) => {
          const dp = mechContainer.getChildByName('damageParticles');
          if (dp && dp.update) {
            dp.update(ticker.deltaTime);
          }
        });
      });

      drawGrid(gridLayer);
      updateMechs(mechLayer, gameState);
    });

    return () => {
      isMounted = false;
      if (appRef.current) {
        // Kill all GSAP tweens to prevent memory leaks and errors
        Object.values(mechSpritesRef.current).forEach((container: PIXI.Container) => {
          gsap.killTweensOf(container as any);
          container.children.forEach(child => {
              gsap.killTweensOf(child as any);
              if (child.name === 'jumpContainer') {
                  const idle = (child as PIXI.Container).getChildByName('idleContainer');
                  if (idle) {
                      gsap.killTweensOf(idle as any);
                      const sprite = (idle as PIXI.Container).getChildByName('spriteContainer');
                      if (sprite) gsap.killTweensOf(sprite as any);
                  }
              }
          });
        });

        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [assets]);

  useEffect(() => {
    if (gridLayerRef.current) {
      drawGrid(gridLayerRef.current);
    }
    if (mechLayerRef.current) {
      updateMechs(mechLayerRef.current, gameState);
    }
  }, [gameState, selectedMech, user]);

  const drawGrid = (container: PIXI.Container) => {
    // Destroy old children to prevent memory leaks
    while (container.children[0]) {
      const child = container.children[0];
      container.removeChild(child);
      child.destroy();
    }
    
    const graphics = new PIXI.Graphics();
    
    for (let q = -8; q <= 8; q++) {
      for (let r = -8; r <= 8; r++) {
        const { x, y } = hexToPixel(q, r, HEX_SIZE);
        
        // Only draw hexes within a certain radius
        const dist = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
        if (dist > 8) continue;

        let fillColor = 0x000000;
        let lineAlpha = 0.08; // More subtle lines
        let lineColor = 0x88aa99; // Slightly brighter, but lower alpha
        let fillAlpha = 0;

        // Highlight logic
        if (selectedMech && selectedMech.ownerId === user?.uid && !selectedMech.hasMoved) {
          const distToSelected = hexDistance(selectedMech.position, { q, r });
          if (distToSelected <= selectedMech.stats.movement) {
            fillColor = 0x22aa55; // Move range
            fillAlpha = 0.15;
            lineColor = 0x44ff88;
            lineAlpha = 0.4;
          }
        }
        if (selectedMech && selectedMech.ownerId === user?.uid && !selectedMech.hasAttacked) {
           const distToSelected = hexDistance(selectedMech.position, { q, r });
           if (distToSelected <= selectedMech.stats.range && distToSelected > 0) {
             // If there's an enemy here, highlight red
             const enemyHere = gameState.mechs.find(m => m.position.q === q && m.position.r === r && m.ownerId !== user.uid && !m.isDestroyed);
             if (enemyHere) {
               fillColor = 0xff3333;
               fillAlpha = 0.25;
               lineColor = 0xff5555;
               lineAlpha = 0.6;
             }
           }
        }

        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          points.push(x + HEX_SIZE * Math.cos(angle), y + HEX_SIZE * Math.sin(angle));
        }
        
        // Draw 3D thickness (bottom edge) only for highlighted hexes to reduce visual clutter
        if (fillAlpha > 0) {
          graphics.lineStyle(0);
          graphics.beginFill(fillColor, fillAlpha * 0.5);
          graphics.drawPolygon(points.map((p, i) => i % 2 === 1 ? p + 6 : p)); // Shift Y down
          graphics.endFill();
        }

        graphics.lineStyle(1.5, lineColor, lineAlpha); // Thinner lines
        if (fillAlpha > 0) {
          graphics.beginFill(fillColor, fillAlpha);
        } else {
          graphics.beginFill(0x000000, 0.01); // Almost transparent for hit area
        }
        
        graphics.drawPolygon(points);
        graphics.endFill();
        
        // Add interaction
        const hitArea = new PIXI.Polygon(points);
        const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        sprite.hitArea = hitArea;
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        sprite.on('pointerdown', () => onHexClick(q, r));
        container.addChild(sprite);
      }
    }
    container.addChild(graphics);
  };

  const updateMechs = (container: PIXI.Container, state: GameState) => {
    // Keep track of which mechs are still alive
    const currentMechIds = new Set(state.mechs.filter(m => !m.isDestroyed).map(m => m.id));

    // Remove destroyed mechs
    for (const id in mechSpritesRef.current) {
      if (!currentMechIds.has(id)) {
        const containerToRemove = mechSpritesRef.current[id];
        
        // Kill all GSAP tweens on this container and its children
        gsap.killTweensOf(containerToRemove as any);
        containerToRemove.children.forEach(child => {
            gsap.killTweensOf(child as any);
            if (child.name === 'jumpContainer') {
                const idle = (child as PIXI.Container).getChildByName('idleContainer');
                if (idle) {
                    gsap.killTweensOf(idle as any);
                    const sprite = (idle as PIXI.Container).getChildByName('spriteContainer');
                    if (sprite) gsap.killTweensOf(sprite as any);
                }
            }
        });

        container.removeChild(containerToRemove);
        containerToRemove.destroy({ children: true });
        delete mechSpritesRef.current[id];
      }
    }

    // Sort mechs by Y position for proper isometric depth sorting (painter's algorithm)
    const sortedMechs = [...state.mechs].filter(m => !m.isDestroyed).sort((a, b) => {
      const posA = hexToPixel(a.position.q, a.position.r, HEX_SIZE);
      const posB = hexToPixel(b.position.q, b.position.r, HEX_SIZE);
      return posA.y - posB.y;
    });

    sortedMechs.forEach((mech, index) => {
      const { x, y } = hexToPixel(mech.position.q, mech.position.r, HEX_SIZE);
      let mechContainer = mechSpritesRef.current[mech.id];

      if (!mechContainer) {
        const texture = texturesRef.current[`mech_${mech.type}`];
        
        // Determine size based on mech class (scaled down to fit landscape better)
        let targetHeight = HEX_SIZE * 2.5; 
        let hitWidth = 60;
        if (mech.type === 'heavy') {
          targetHeight = HEX_SIZE * 3.2;
          hitWidth = 80;
        } else if (mech.type === 'light') {
          targetHeight = HEX_SIZE * 1.8;
          hitWidth = 50;
        }

        if (texture) {
          mechContainer = new PIXI.Container() as MechSpriteContainer;
          const partsContainer = new PIXI.Container();
          mechContainer.partsContainer = partsContainer;
          mechContainer.addChild(partsContainer);

          const sprite = new PIXI.Sprite(texture);
          sprite.name = 'sprite';
          sprite.anchor.set(0.5, 0.92); // Anchor exactly at the feet
          
          const scale = targetHeight / texture.height;
          
          // Un-squash the Y axis so it stands up in the isometric view
          sprite.scale.set(scale, scale / ISO_SQUASH);
          
          // Add a slight environmental tint (blue/grey) to ground it in the scene
          sprite.tint = 0xeef5ff;
          
          partsContainer.addChild(sprite);

          mechContainer.updateRotation = (angle: number) => {
            const isMovingLeft = Math.abs(angle) > Math.PI / 2;
            gsap.to(sprite.scale, {
              x: isMovingLeft ? -scale : scale,
              duration: 0.2
            });
          };
        } else {
          // Fallback to procedural
          mechContainer = createProceduralMech(mech, mech.ownerId === user?.uid);
        }

        mechContainer.x = x;
        mechContainer.y = y;
        
        // Base/Shadows - Isometric projection
        const shadowContainer = new PIXI.Container();
        shadowContainer.name = 'shadowContainer';
        
        // Ambient soft shadow
        const ambientShadow = new PIXI.Graphics();
        ambientShadow.beginFill(0x000000, 0.5);
        ambientShadow.drawEllipse(0, 0, HEX_SIZE * 1.2, HEX_SIZE * 1.2 * ISO_SQUASH);
        ambientShadow.endFill();
        const ambientBlur = new PIXI.BlurFilter();
        ambientBlur.blur = 12;
        ambientShadow.filters = [ambientBlur];
        shadowContainer.addChild(ambientShadow);

        // Core dark shadow directly under feet
        const coreShadow = new PIXI.Graphics();
        coreShadow.beginFill(0x000000, 0.8);
        coreShadow.drawEllipse(0, 0, HEX_SIZE * 0.6, HEX_SIZE * 0.6 * ISO_SQUASH);
        coreShadow.endFill();
        const coreBlur = new PIXI.BlurFilter();
        coreBlur.blur = 4;
        coreShadow.filters = [coreBlur];
        shadowContainer.addChild(coreShadow);

        mechContainer.addChildAt(shadowContainer, 0); // Add shadows behind the mech parts

        // Make the mech container interactive
        mechContainer.eventMode = 'static';
        mechContainer.cursor = 'pointer';
        // Explicit hit area for easier selection, scaled to the mech's height
        mechContainer.hitArea = new PIXI.Rectangle(-hitWidth/2, -targetHeight, hitWidth, targetHeight + 20);
        
        // Start Idle Animation (bobbing the mech parts slightly)
        if (mechContainer.partsContainer) {
          gsap.to(mechContainer.partsContainer, {
            y: -4,
            duration: 1.5 + Math.random() * 0.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
          });
        }

        // Health Bar Container (un-squashed)
        const uiContainer = new PIXI.Container();
        uiContainer.name = 'uiContainer';
        uiContainer.y = -targetHeight - 15; // Position dynamically above the mech
        uiContainer.scale.y = 1 / ISO_SQUASH; // Un-squash UI
        
        const hpBarBg = new PIXI.Graphics();
        hpBarBg.name = 'hpBarBg';
        hpBarBg.beginFill(0x111111, 0.8);
        hpBarBg.lineStyle(1, 0x333333);
        hpBarBg.drawRect(-20, 0, 40, 6);
        hpBarBg.endFill();
        uiContainer.addChild(hpBarBg);
        
        const hpBar = new PIXI.Graphics();
        hpBar.name = 'hpBar';
        uiContainer.addChild(hpBar);
        
        mechContainer.addChild(uiContainer);
        
        container.addChild(mechContainer);
        mechSpritesRef.current[mech.id] = mechContainer;
      }

      // Update Z-index (by changing child order)
      container.setChildIndex(mechContainer, index);

      // Update interaction listener
      mechContainer.removeAllListeners('pointerdown');
      mechContainer.on('pointerdown', (e) => {
        e.stopPropagation(); // Prevent the hex below from firing
        onHexClick(mech.position.q, mech.position.r);
      });

      // Animate movement
      if (mechContainer.x !== x || mechContainer.y !== y) {
        // Determine facing direction based on movement
        const dx = x - mechContainer.x;
        const dy = y - mechContainer.y;
        const angle = Math.atan2(dy, dx);
        
        // Update rotation visually
        if (mechContainer.updateRotation) {
          mechContainer.updateRotation(angle);
        }

        const shadow = mechContainer.getChildByName('shadow') as PIXI.Graphics;

        // X/Y Movement
        gsap.to(mechContainer, {
          x: x,
          y: y,
          duration: 0.6,
          ease: "power1.inOut"
        });

        // Jump Arc (Y-axis offset)
        if (mechContainer.partsContainer) {
          // Arc
          gsap.to(mechContainer.partsContainer, {
            y: -60,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.out"
          });
          
          // Squash and stretch
          const parts = mechContainer.partsContainer;
          gsap.to(parts.scale, {
            x: 0.9,
            y: 1.1,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
            onComplete: () => {
              // Landing impact squash
              gsap.to(parts.scale, {
                x: 1.15,
                y: 0.85,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
              });
            }
          });
        }

        // Shadow scaling during jump
        if (shadow) {
          gsap.to(shadow.scale, {
            x: 0.4,
            y: 0.4,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.out"
          });
          gsap.to(shadow, {
            alpha: 0.2,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.out"
          });
        }
      }

      // Update Health Bar and check for damage
      const uiContainer = mechContainer.getChildByName('uiContainer') as PIXI.Container;
      const hpPercent = mech.stats.hp / mech.stats.maxHp;
      
      if (uiContainer) {
        const hpBar = uiContainer.getChildByName('hpBar') as PIXI.Graphics;
        if (hpBar) {
          hpBar.clear();
          const hpColor = hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffff00 : 0xff0000;
          hpBar.beginFill(hpColor);
          hpBar.drawRect(-19, 1, Math.max(0, 38 * hpPercent), 4);
          hpBar.endFill();
        }
      }

      // Damage Particles (Smoke & Sparks)
      let damageParticles = mechContainer.getChildByName('damageParticles') as PIXI.Container;
      if (!damageParticles) {
        damageParticles = new PIXI.Container();
        damageParticles.name = 'damageParticles';
        damageParticles.y = -30; // Center of mech
        mechContainer.addChild(damageParticles);
        
        const particles: any[] = [];
        let spawnTimer = 0;
        
        (damageParticles as any).update = (delta: number) => {
          const severity = (damageParticles as any).severity;
          if (severity > 0.5) return; // No particles if healthy
          
          spawnTimer -= delta;
          if (spawnTimer <= 0) {
            spawnTimer = severity < 0.25 ? 3 : 8; // Faster spawn if more damaged
            
            const isSpark = severity < 0.25 && Math.random() > 0.6;
            const p = new PIXI.Graphics() as any;
            
            if (isSpark) {
              p.beginFill(Math.random() > 0.5 ? 0xffaa00 : 0xff3300);
              p.drawRect(-2, -2, 4, 4);
              p.endFill();
              p.vy = -Math.random() * 4 - 2;
              p.vx = (Math.random() - 0.5) * 6;
              p.life = 1.0;
              p.decay = 0.04 + Math.random() * 0.04;
              p.isSpark = true;
            } else {
              p.beginFill(severity < 0.25 ? 0x222222 : 0x555555, 0.7);
              p.drawCircle(0, 0, Math.random() * 6 + 4);
              p.endFill();
              p.vy = -Math.random() * 2 - 1;
              p.vx = (Math.random() - 0.5) * 2;
              p.life = 1.0;
              p.decay = 0.015 + Math.random() * 0.01;
              p.scale.set(0.5);
              p.isSpark = false;
            }
            
            p.x = (Math.random() - 0.5) * 30;
            p.y = (Math.random() - 0.5) * 30;
            
            damageParticles.addChild(p);
            particles.push(p);
          }
          
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.life -= p.decay * delta;
            
            if (p.isSpark) {
              p.vy += 0.15 * delta; // Gravity
              p.alpha = p.life;
            } else {
              p.scale.set(p.scale.x + 0.03 * delta);
              p.alpha = p.life;
            }
            
            if (p.life <= 0) {
              damageParticles.removeChild(p);
              p.destroy();
              particles.splice(i, 1);
            }
          }
        };
      }
      (damageParticles as any).severity = hpPercent;

      // Apply damage tint to sprite
      if (mechContainer.partsContainer) {
        const sprite = mechContainer.partsContainer.getChildByName('sprite') as PIXI.Sprite;
        if (sprite) {
          if (hpPercent <= 0.25) sprite.tint = 0x888888;
          else if (hpPercent <= 0.5) sprite.tint = 0xbbbbbb;
          else sprite.tint = 0xffffff;
        }
      }

      // Damage Flash Effect
      const prevHp = (mechContainer as any)._prevHp;
      if (prevHp !== undefined && mech.stats.hp < prevHp) {
        const jumpContainer = mechContainer.getChildByName('jumpContainer') as PIXI.Container;
        const idleContainer = jumpContainer?.getChildByName('idleContainer') as PIXI.Container;
        const spriteContainer = idleContainer?.getChildByName('spriteContainer') as PIXI.Container;
        
        let targetContainer = spriteContainer;
        if (!targetContainer && mechContainer.partsContainer) {
            targetContainer = mechContainer.partsContainer;
        }
        
        if (targetContainer) {
          // Flash red
          const colorMatrix = new PIXI.ColorMatrixFilter();
          colorMatrix.tint(0xff0000, true);
          
          // Preserve existing filters (like transparencyFilter)
          const existingFilters = targetContainer.filters 
            ? (Array.isArray(targetContainer.filters) ? [...targetContainer.filters] : [targetContainer.filters]) 
            : [];
          targetContainer.filters = [...existingFilters, colorMatrix];
          
          // Shake
          gsap.to(targetContainer, {
            x: 5,
            yoyo: true,
            repeat: 5,
            duration: 0.05,
            onComplete: () => {
              targetContainer.x = 0;
              // Restore original filters and destroy the color matrix
              targetContainer.filters = existingFilters.length > 0 ? existingFilters : null;
              colorMatrix.destroy();
            }
          });
        }
      }
      (mechContainer as any)._prevHp = mech.stats.hp;
      
      // Highlight selected mech
      let selectionRing = mechContainer.getChildByName('selectionRing') as PIXI.Graphics;
      let selectionArrows = mechContainer.getChildByName('selectionArrows') as PIXI.Container;
      
      if (selectedMech && selectedMech.id === mech.id) {
        if (!selectionRing) {
          selectionRing = new PIXI.Graphics();
          selectionRing.name = 'selectionRing';
          mechContainer.addChildAt(selectionRing, 0); // Add below everything else
          
          selectionArrows = new PIXI.Container();
          selectionArrows.name = 'selectionArrows';
          mechContainer.addChild(selectionArrows);
          
          // Draw 4 arrows pointing inward
          for (let i = 0; i < 4; i++) {
            const arrow = new PIXI.Graphics();
            arrow.beginFill(0x00ffaa);
            arrow.moveTo(0, -10);
            arrow.lineTo(5, 0);
            arrow.lineTo(-5, 0);
            arrow.endFill();
            arrow.y = -60;
            arrow.rotation = (Math.PI / 2) * i;
            
            // Position them in a circle
            arrow.x = Math.cos(arrow.rotation - Math.PI/2) * 40;
            arrow.y = Math.sin(arrow.rotation - Math.PI/2) * 40 - 20;
            
            selectionArrows.addChild(arrow);
          }

          // Animate the ring
          gsap.to(selectionRing, {
            alpha: 0.3,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
          });
          
          // Animate arrows spinning
          gsap.to(selectionArrows, {
            rotation: Math.PI * 2,
            duration: 4,
            repeat: -1,
            ease: "linear"
          });
          
          // Animate arrows bobbing
          gsap.to(selectionArrows.scale, {
            x: 0.8,
            y: 0.8,
            duration: 0.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
          });
        }
        selectionRing.clear();
        selectionRing.lineStyle(2, 0x00ffaa, 0.8);
        selectionRing.beginFill(0x00ffaa, 0.1);
        selectionRing.drawEllipse(0, 15, 35, 18);
        selectionRing.endFill();
      } else {
        if (selectionRing) {
          gsap.killTweensOf(selectionRing);
          mechContainer.removeChild(selectionRing);
          selectionRing.destroy();
        }
        if (selectionArrows) {
          gsap.killTweensOf(selectionArrows);
          gsap.killTweensOf(selectionArrows.scale);
          mechContainer.removeChild(selectionArrows);
          selectionArrows.destroy({ children: true });
        }
      }
    });
  };

  return <div ref={containerRef} className="w-full h-full" />;
});
