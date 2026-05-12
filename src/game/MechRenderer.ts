import * as PIXI from 'pixi.js';
import { MechInstance } from './types';

export interface MechSpriteContainer extends PIXI.Container {
  updateRotation: (angle: number) => void;
  partsContainer: PIXI.Container;
}

function drawHexagon(graphics: PIXI.Graphics, radius: number) {
  graphics.moveTo(radius * Math.cos(0), radius * Math.sin(0));
  for (let i = 1; i <= 6; i++) {
    graphics.lineTo(radius * Math.cos(i * Math.PI / 3), radius * Math.sin(i * Math.PI / 3));
  }
}

export function createProceduralMech(mech: MechInstance, isPlayer: boolean): MechSpriteContainer {
  const container = new PIXI.Container() as MechSpriteContainer;
  
  const primaryColor = isPlayer ? 0x22aa55 : 0xff4444;
  const secondaryColor = isPlayer ? 0x115522 : 0x881111;
  const highlightColor = isPlayer ? 0x44cc77 : 0xff7777;
  const glassColor = 0x88eeff;
  const darkMetal = 0x2a2a2a;
  const lightMetal = 0x555555;

  const partsContainer = new PIXI.Container();
  // Un-squash the parts container so the mech stands up straight
  partsContainer.scale.y = 1 / 0.6; // 0.6 is ISO_SQUASH
  container.addChild(partsContainer);

  const legs = new PIXI.Graphics();
  const pelvis = new PIXI.Graphics();
  const torso = new PIXI.Graphics();
  const leftArm = new PIXI.Graphics();
  const rightArm = new PIXI.Graphics();
  const head = new PIXI.Graphics();

  // Helper to draw a shaded rect
  const drawShadedRect = (g: PIXI.Graphics, x: number, y: number, w: number, h: number, color: number, highlight: number) => {
    g.beginFill(color);
    g.lineStyle(1, 0x000000, 0.8);
    g.drawRect(x, y, w, h);
    g.endFill();
    // Highlight edge
    g.lineStyle(1, highlight, 0.5);
    g.moveTo(x, y + h);
    g.lineTo(x, y);
    g.lineTo(x + w, y);
    g.lineStyle(0);
  };

  if (mech.type === 'light') {
    // Light Mech: Sleek, agile
    legs.beginFill(darkMetal);
    legs.lineStyle(1, 0x000000);
    // Left leg
    legs.drawPolygon([-12, 0, -18, -15, -8, -25, -4, -10]);
    // Right leg
    legs.drawPolygon([12, 0, 18, -15, 8, -25, 4, -10]);
    legs.endFill();

    drawShadedRect(pelvis, -12, -30, 24, 12, secondaryColor, highlightColor);

    torso.beginFill(primaryColor);
    torso.lineStyle(1.5, 0x000000);
    torso.drawPolygon([-15, -25, 15, -25, 10, -50, -10, -50]);
    torso.endFill();
    // Torso details
    torso.beginFill(lightMetal);
    torso.drawRect(-5, -45, 10, 15);
    torso.endFill();

    head.beginFill(glassColor);
    head.lineStyle(1, 0x000000);
    head.drawPolygon([-8, -45, 8, -45, 5, -55, -5, -55]);
    head.endFill();

    drawShadedRect(leftArm, -22, -40, 8, 25, darkMetal, lightMetal);
    drawShadedRect(rightArm, 14, -40, 8, 25, darkMetal, lightMetal);

  } else if (mech.type === 'medium') {
    // Medium Mech: Balanced, humanoid
    drawShadedRect(legs, -15, -30, 10, 30, darkMetal, lightMetal);
    drawShadedRect(legs, 5, -30, 10, 30, darkMetal, lightMetal);

    drawShadedRect(pelvis, -18, -35, 36, 14, secondaryColor, highlightColor);

    torso.beginFill(primaryColor);
    torso.lineStyle(1.5, 0x000000);
    torso.drawRoundedRect(-22, -60, 44, 30, 4);
    torso.endFill();
    // Chest plate
    torso.beginFill(secondaryColor);
    torso.drawRect(-15, -55, 30, 15);
    torso.endFill();

    head.beginFill(glassColor);
    head.lineStyle(1, 0x000000);
    head.drawRect(-10, -52, 20, 8);
    head.endFill();

    // Missile pod (Left)
    drawShadedRect(leftArm, -32, -65, 14, 20, secondaryColor, highlightColor);
    leftArm.beginFill(0x000000);
    for(let i=0; i<2; i++) {
      for(let j=0; j<3; j++) {
        leftArm.drawCircle(-29 + i*6, -60 + j*6, 2);
      }
    }
    leftArm.endFill();

    // Cannon (Right)
    drawShadedRect(rightArm, 22, -50, 12, 35, darkMetal, lightMetal);
    rightArm.beginFill(0x000000);
    rightArm.drawRect(25, -15, 6, 15);
    rightArm.endFill();

  } else {
    // Heavy Mech: Tank-like, bulky
    drawShadedRect(legs, -25, -25, 18, 25, darkMetal, lightMetal);
    drawShadedRect(legs, 7, -25, 18, 25, darkMetal, lightMetal);

    drawShadedRect(pelvis, -30, -35, 60, 18, secondaryColor, highlightColor);

    torso.beginFill(primaryColor);
    torso.lineStyle(2, 0x000000);
    torso.drawPolygon([-35, -25, 35, -25, 25, -70, -25, -70]);
    torso.endFill();
    
    // Heavy armor plates
    torso.beginFill(highlightColor, 0.3);
    torso.drawPolygon([-25, -30, 25, -30, 18, -65, -18, -65]);
    torso.endFill();

    head.beginFill(glassColor);
    head.lineStyle(1, 0x000000);
    head.drawRect(-18, -55, 36, 10);
    head.endFill();

    // Dual massive cannons
    drawShadedRect(leftArm, -45, -50, 18, 50, darkMetal, lightMetal);
    leftArm.beginFill(0x000000);
    leftArm.drawRect(-41, 0, 10, 15);
    leftArm.endFill();

    drawShadedRect(rightArm, 27, -50, 18, 50, darkMetal, lightMetal);
    rightArm.beginFill(0x000000);
    rightArm.drawRect(31, 0, 10, 15);
    rightArm.endFill();
  }

  partsContainer.addChild(legs);
  partsContainer.addChild(pelvis);
  partsContainer.addChild(torso);
  partsContainer.addChild(head);
  partsContainer.addChild(leftArm);
  partsContainer.addChild(rightArm);

  container.updateRotation = (angle: number) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const torsoShiftX = cosA * 6;
    const torsoShiftY = sinA * 3;

    torso.x = torsoShiftX;
    torso.y = torsoShiftY;
    
    head.x = cosA * 10;
    head.y = torsoShiftY + sinA * 4;

    pelvis.x = cosA * 3;
    pelvis.y = sinA * 1;

    const leftArmAngle = angle - Math.PI / 2;
    leftArm.x = Math.cos(leftArmAngle) * 12 + torsoShiftX;
    leftArm.y = Math.sin(leftArmAngle) * 6 + torsoShiftY;

    const rightArmAngle = angle + Math.PI / 2;
    rightArm.x = Math.cos(rightArmAngle) * 12 + torsoShiftX;
    rightArm.y = Math.sin(rightArmAngle) * 6 + torsoShiftY;

    const parts = [
      { sprite: legs, z: 0 },
      { sprite: pelvis, z: 1 },
      { sprite: torso, z: 2 + sinA },
      { sprite: head, z: 3 + sinA },
      { sprite: leftArm, z: 2 + Math.sin(leftArmAngle) * 2 },
      { sprite: rightArm, z: 2 + Math.sin(rightArmAngle) * 2 }
    ];

    parts.sort((a, b) => a.z - b.z);
    parts.forEach((p, i) => partsContainer.setChildIndex(p.sprite, i));
  };

  container.partsContainer = partsContainer;

  // Initial rotation
  const initialAngle = isPlayer ? -Math.PI / 2 : Math.PI / 2; // Player faces North (Up), Enemy faces South (Down)
  container.updateRotation(initialAngle);

  return container;
}
