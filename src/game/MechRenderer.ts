import * as PIXI from 'pixi.js';
import { MechInstance, MechType } from './types';

export interface MechSpriteContainer extends PIXI.Container {
  updateRotation: (angle: number) => void;
  partsContainer: PIXI.Container;
}

export interface MechParts {
  legs: PIXI.Graphics;
  pelvis: PIXI.Graphics;
  torso: PIXI.Graphics;
  leftArm: PIXI.Graphics;
  rightArm: PIXI.Graphics;
  head: PIXI.Graphics;
}

export interface MechColors {
  primary: number;
  secondary: number;
  highlight: number;
  glass: number;
  darkMetal: number;
  lightMetal: number;
}

function drawHexagon(graphics: PIXI.Graphics, radius: number) {
  graphics.moveTo(radius * Math.cos(0), radius * Math.sin(0));
  for (let i = 1; i <= 6; i++) {
    graphics.lineTo(radius * Math.cos(i * Math.PI / 3), radius * Math.sin(i * Math.PI / 3));
  }
}

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

function drawMechBody(type: MechType, parts: MechParts, colors: MechColors) {
  const { legs, pelvis, torso } = parts;
  const { primary, secondary, highlight, darkMetal, lightMetal } = colors;

  if (type === 'light') {
    legs.beginFill(darkMetal);
    legs.lineStyle(1, 0x000000);
    // Left leg
    legs.drawPolygon([-12, 0, -18, -15, -8, -25, -4, -10]);
    // Right leg
    legs.drawPolygon([12, 0, 18, -15, 8, -25, 4, -10]);
    legs.endFill();

    drawShadedRect(pelvis, -12, -30, 24, 12, secondary, highlight);

    torso.beginFill(primary);
    torso.lineStyle(1.5, 0x000000);
    torso.drawPolygon([-15, -25, 15, -25, 10, -50, -10, -50]);
    torso.endFill();
  } else if (type === 'medium') {
    drawShadedRect(legs, -15, -30, 10, 30, darkMetal, lightMetal);
    drawShadedRect(legs, 5, -30, 10, 30, darkMetal, lightMetal);

    drawShadedRect(pelvis, -18, -35, 36, 14, secondary, highlight);

    torso.beginFill(primary);
    torso.lineStyle(1.5, 0x000000);
    torso.drawRoundedRect(-22, -60, 44, 30, 4);
    torso.endFill();
  } else {
    drawShadedRect(legs, -25, -25, 18, 25, darkMetal, lightMetal);
    drawShadedRect(legs, 7, -25, 18, 25, darkMetal, lightMetal);

    drawShadedRect(pelvis, -30, -35, 60, 18, secondary, highlight);

    torso.beginFill(primary);
    torso.lineStyle(2, 0x000000);
    torso.drawPolygon([-35, -25, 35, -25, 25, -70, -25, -70]);
    torso.endFill();
  }
}

function drawMechWeapons(type: MechType, parts: MechParts, colors: MechColors) {
  const { leftArm, rightArm } = parts;
  const { secondary, highlight, darkMetal, lightMetal } = colors;

  if (type === 'light') {
    drawShadedRect(leftArm, -22, -40, 8, 25, darkMetal, lightMetal);
    drawShadedRect(rightArm, 14, -40, 8, 25, darkMetal, lightMetal);
  } else if (type === 'medium') {
    // Missile pod (Left)
    drawShadedRect(leftArm, -32, -65, 14, 20, secondary, highlight);
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
}

function drawMechAccessories(type: MechType, parts: MechParts, colors: MechColors) {
  const { torso, head } = parts;
  const { secondary, highlight, glass, lightMetal } = colors;

  if (type === 'light') {
    // Torso details
    torso.beginFill(lightMetal);
    torso.drawRect(-5, -45, 10, 15);
    torso.endFill();

    head.beginFill(glass);
    head.lineStyle(1, 0x000000);
    head.drawPolygon([-8, -45, 8, -45, 5, -55, -5, -55]);
    head.endFill();
  } else if (type === 'medium') {
    // Chest plate
    torso.beginFill(secondary);
    torso.drawRect(-15, -55, 30, 15);
    torso.endFill();

    head.beginFill(glass);
    head.lineStyle(1, 0x000000);
    head.drawRect(-10, -52, 20, 8);
    head.endFill();
  } else {
    // Heavy armor plates
    torso.beginFill(highlight, 0.3);
    torso.drawPolygon([-25, -30, 25, -30, 18, -65, -18, -65]);
    torso.endFill();

    head.beginFill(glass);
    head.lineStyle(1, 0x000000);
    head.drawRect(-18, -55, 36, 10);
    head.endFill();
  }
}

export function createProceduralMech(mech: MechInstance, isPlayer: boolean): MechSpriteContainer {
  const container = new PIXI.Container() as MechSpriteContainer;

  const colors: MechColors = {
    primary: isPlayer ? 0x22aa55 : 0xff4444,
    secondary: isPlayer ? 0x115522 : 0x881111,
    highlight: isPlayer ? 0x44cc77 : 0xff7777,
    glass: 0x88eeff,
    darkMetal: 0x2a2a2a,
    lightMetal: 0x555555
  };

  const partsContainer = new PIXI.Container();
  // Un-squash the parts container so the mech stands up straight
  partsContainer.scale.y = 1 / 0.6; // 0.6 is ISO_SQUASH
  container.addChild(partsContainer);

  const parts: MechParts = {
    legs: new PIXI.Graphics(),
    pelvis: new PIXI.Graphics(),
    torso: new PIXI.Graphics(),
    leftArm: new PIXI.Graphics(),
    rightArm: new PIXI.Graphics(),
    head: new PIXI.Graphics()
  };

  drawMechBody(mech.type, parts, colors);
  drawMechWeapons(mech.type, parts, colors);
  drawMechAccessories(mech.type, parts, colors);

  partsContainer.addChild(parts.legs);
  partsContainer.addChild(parts.pelvis);
  partsContainer.addChild(parts.torso);
  partsContainer.addChild(parts.head);
  partsContainer.addChild(parts.leftArm);
  partsContainer.addChild(parts.rightArm);

  container.updateRotation = (angle: number) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const torsoShiftX = cosA * 6;
    const torsoShiftY = sinA * 3;

    parts.torso.x = torsoShiftX;
    parts.torso.y = torsoShiftY;
    
    parts.head.x = cosA * 10;
    parts.head.y = torsoShiftY + sinA * 4;

    parts.pelvis.x = cosA * 3;
    parts.pelvis.y = sinA * 1;

    const leftArmAngle = angle - Math.PI / 2;
    parts.leftArm.x = Math.cos(leftArmAngle) * 12 + torsoShiftX;
    parts.leftArm.y = Math.sin(leftArmAngle) * 6 + torsoShiftY;

    const rightArmAngle = angle + Math.PI / 2;
    parts.rightArm.x = Math.cos(rightArmAngle) * 12 + torsoShiftX;
    parts.rightArm.y = Math.sin(rightArmAngle) * 6 + torsoShiftY;

    const sortedParts = [
      { sprite: parts.legs, z: 0 },
      { sprite: parts.pelvis, z: 1 },
      { sprite: parts.torso, z: 2 + sinA },
      { sprite: parts.head, z: 3 + sinA },
      { sprite: parts.leftArm, z: 2 + Math.sin(leftArmAngle) * 2 },
      { sprite: parts.rightArm, z: 2 + Math.sin(rightArmAngle) * 2 }
    ];

    sortedParts.sort((a, b) => a.z - b.z);
    sortedParts.forEach((p, i) => partsContainer.setChildIndex(p.sprite, i));
  };

  container.partsContainer = partsContainer;

  // Initial rotation
  const initialAngle = isPlayer ? -Math.PI / 2 : Math.PI / 2; // Player faces North (Up), Enemy faces South (Down)
  container.updateRotation(initialAngle);

  return container;
}
