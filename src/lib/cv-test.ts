
import cv from 'opencv.js';
import { AR } from 'js-aruco2';
import { readFileSync } from 'fs';
import { Canvas, createCanvas, loadImage } from 'canvas';

global.Canvas = Canvas;

async function runTest() {
  const image = await loadImage('/Users/ahzs645/Github/printercalibration/Screenshot 2025-07-30 at 10.56.20 PM.png');
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const detector = new AR.Detector();
  const markers = detector.detect(imageData);

  console.log('Detected markers:', markers);
}

runTest();
