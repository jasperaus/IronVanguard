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

  const drawJoint = (g: PIXI.Graphics, x: number, y: number, radius: number) => {
    g.beginFill(0x111111);
    g.lineStyle(1, lightMetal, 0.8);
    g.drawCircle(x, y, radius);
    g.endFill();
    g.beginFill(highlightColor, 0.65);
    g.drawCircle(x - radius * 0.25, y - radius * 0.25, Math.max(1.5, radius * 0.28));
    g.endFill();
  };

  const drawHydraulic = (g: PIXI.Graphics, x1: number, y1: number, x2: number, y2: number) => {
    g.lineStyle(3, 0x111111, 0.95);
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineStyle(1, 0x8aa0a8, 0.9);
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineStyle(0);
  };

  const drawFoot = (g: PIXI.Graphics, x: number, y: number, width: number) => {
    g.beginFill(0x161a1c);
    g.lineStyle(1, 0x000000, 0.8);
    g.drawPolygon([x - width / 2, y, x + width / 2, y, x + width * 0.7, y + 7, x - width * 0.65, y + 7]);
    g.endFill();
    g.lineStyle(1, lightMetal, 0.5);
    g.moveTo(x - width * 0.35, y + 2);
    g.lineTo(x + width * 0.35, y + 2);
    g.lineStyle(0);
  };

  const drawArmorPanel = (g: PIXI.Graphics, points: number[]) => {
    g.beginFill(highlightColor, 0.16);
    g.lineStyle(1, highlightColor, 0.45);
    g.drawPolygon(points);
    g.endFill();
  };

  const drawCockpit = (g: PIXI.Graphics, x: number, y: number, width: number, height: number) => {
    g.beginFill(glassColor, 0.9);
    g.lineStyle(1, 0xffffff, 0.45);
    g.drawRoundedRect(x, y, width, height, 2);
    g.endFill();
    g.beginFill(0xffffff, 0.5);
    g.drawRect(x + 2, y + 2, Math.max(2, width * 0.35), 1.5);
    g.endFill();
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
    drawFoot(legs, -14, 0, 18);
    drawFoot(legs, 14, 0, 18);
    drawHydraulic(legs, -13, -5, -8, -23);
    drawHydraulic(legs, 13, -5, 8, -23);
    drawJoint(legs, -10, -25, 4);
    drawJoint(legs, 10, -25, 4);

    drawShadedRect(pelvis, -12, -30, 24, 12, secondaryColor, highlightColor);

    torso.beginFill(primaryColor);
    torso.lineStyle(1.5, 0x000000);
    torso.drawPolygon([-15, -25, 15, -25, 10, -50, -10, -50]);
    torso.endFill();
    // Torso details
    torso.beginFill(lightMetal);
    torso.drawRect(-5, -45, 10, 15);
    torso.endFill();
    drawArmorPanel(torso, [-12, -28, -2, -48, 8, -28]);
    torso.lineStyle(1, highlightColor, 0.55);
    torso.moveTo(-11, -35);
    torso.lineTo(11, -35);

    head.beginFill(0x1b272a);
    head.lineStyle(1, 0x000000);
    head.drawPolygon([-9, -45, 9, -45, 6, -56, -6, -56]);
    head.endFill();
    drawCockpit(head, -5, -53, 10, 4);

    drawShadedRect(leftArm, -22, -40, 8, 25, darkMetal, lightMetal);
    drawShadedRect(rightArm, 14, -40, 8, 25, darkMetal, lightMetal);
    drawJoint(leftArm, -18, -40, 4);
    drawJoint(rightArm, 18, -40, 4);
    drawHydraulic(leftArm, -19, -34, -15, -18);
    drawHydraulic(rightArm, 19, -34, 15, -18);

  } else if (mech.type === 'medium') {
    // Medium Mech: Balanced, humanoid
    drawShadedRect(legs, -15, -30, 10, 30, darkMetal, lightMetal);
    drawShadedRect(legs, 5, -30, 10, 30, darkMetal, lightMetal);
    drawFoot(legs, -10, 0, 22);
    drawFoot(legs, 10, 0, 22);
    drawJoint(legs, -10, -30, 5);
    drawJoint(legs, 10, -30, 5);
    drawHydraulic(legs, -7, -28, -13, -4);
    drawHydraulic(legs, 7, -28, 13, -4);

    drawShadedRect(pelvis, -18, -35, 36, 14, secondaryColor, highlightColor);

    torso.beginFill(primaryColor);
    torso.lineStyle(1.5, 0x000000);
    torso.drawRoundedRect(-22, -60, 44, 30, 4);
    torso.endFill();
    // Chest plate
    torso.beginFill(secondaryColor);
    torso.drawRect(-15, -55, 30, 15);
    torso.endFill();
    drawArmorPanel(torso, [-18, -58, 0, -64, 18, -58, 10, -43, -10, -43]);
    torso.lineStyle(1, highlightColor, 0.45);
    torso.moveTo(-20, -48);
    torso.lineTo(20, -48);

    head.beginFill(0x1b272a);
    head.lineStyle(1, 0x000000);
    head.drawRoundedRect(-11, -54, 22, 10, 2);
    head.endFill();
    drawCockpit(head, -7, -51, 14, 4);

    // Missile pod (Left)
    drawShadedRect(leftArm, -32, -65, 14, 20, secondaryColor, highlightColor);
    leftArm.beginFill(0x000000);
    for(let i=0; i<2; i++) {
      for(let j=0; j<3; j++) {
        leftArm.drawCircle(-29 + i*6, -60 + j*6, 2);
      }
    }
    leftArm.endFill();
    drawJoint(leftArm, -22, -48, 5);

    // Cannon (Right)
    drawShadedRect(rightArm, 22, -50, 12, 35, darkMetal, lightMetal);
    rightArm.beginFill(0x000000);
    rightArm.drawRect(25, -15, 6, 15);
    rightArm.endFill();
    drawJoint(rightArm, 27, -49, 5);
    rightArm.beginFill(lightMetal);
    rightArm.drawRect(24, -6, 8, 5);
    rightArm.endFill();

  } else {
    // Heavy Mech: Tank-like, bulky
    drawShadedRect(legs, -25, -25, 18, 25, darkMetal, lightMetal);
    drawShadedRect(legs, 7, -25, 18, 25, darkMetal, lightMetal);
    drawFoot(legs, -16, 0, 32);
    drawFoot(legs, 16, 0, 32);
    drawJoint(legs, -16, -25, 6);
    drawJoint(legs, 16, -25, 6);
    drawHydraulic(legs, -22, -22, -10, -4);
    drawHydraulic(legs, 22, -22, 10, -4);

    drawShadedRect(pelvis, -30, -35, 60, 18, secondaryColor, highlightColor);

    torso.beginFill(primaryColor);
    torso.lineStyle(2, 0x000000);
    torso.drawPolygon([-35, -25, 35, -25, 25, -70, -25, -70]);
    torso.endFill();
    
    // Heavy armor plates
    torso.beginFill(highlightColor, 0.3);
    torso.drawPolygon([-25, -30, 25, -30, 18, -65, -18, -65]);
    torso.endFill();
    drawArmorPanel(torso, [-30, -28, -10, -66, 0, -38]);
    drawArmorPanel(torso, [30, -28, 10, -66, 0, -38]);
    torso.lineStyle(1, lightMetal, 0.45);
    torso.moveTo(-28, -42);
    torso.lineTo(28, -42);

    head.beginFill(0x1b272a);
    head.lineStyle(1, 0x000000);
    head.drawRoundedRect(-19, -57, 38, 12, 2);
    head.endFill();
    drawCockpit(head, -13, -53, 26, 5);

    // Dual massive cannons
    drawShadedRect(leftArm, -45, -50, 18, 50, darkMetal, lightMetal);
    leftArm.beginFill(0x000000);
    leftArm.drawRect(-41, 0, 10, 15);
    leftArm.endFill();
    drawJoint(leftArm, -31, -48, 6);
    drawHydraulic(leftArm, -39, -38, -30, -8);

    drawShadedRect(rightArm, 27, -50, 18, 50, darkMetal, lightMetal);
    rightArm.beginFill(0x000000);
    rightArm.drawRect(31, 0, 10, 15);
    rightArm.endFill();
    drawJoint(rightArm, 31, -48, 6);
    drawHydraulic(rightArm, 39, -38, 30, -8);
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
