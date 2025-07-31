// Enhanced color analysis utilities
export interface ColorSample {
  color: string;
  position: { x: number; y: number };
  confidence: number;
}

export interface AnalysisResult {
  samples: ColorSample[];
  detectedMarkers: Array<{
    id: number;
    corners: Array<{ x: number; y: number }>;
  }>;
  transform: {
    rotation: number;
    scale: number;
    translation: { x: number; y: number };
  };
}

// Get average color from a region, filtering out outliers
export function getAverageColor(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  radius: number = 3
): string {
  const colors: Array<{ r: number; g: number; b: number }> = [];
  
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
        const index = (y * imageData.width + x) * 4;
        colors.push({
          r: imageData.data[index],
          g: imageData.data[index + 1],
          b: imageData.data[index + 2]
        });
      }
    }
  }
  
  if (colors.length === 0) return '#000000';
  
  // Sort colors and remove outliers (top and bottom 10%)
  const sortedByBrightness = colors.sort((a, b) => 
    (a.r + a.g + a.b) - (b.r + b.g + b.b)
  );
  
  const start = Math.floor(colors.length * 0.1);
  const end = Math.floor(colors.length * 0.9);
  const filteredColors = sortedByBrightness.slice(start, end);
  
  // Calculate average
  const avg = filteredColors.reduce(
    (acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b
    }),
    { r: 0, g: 0, b: 0 }
  );
  
  const count = filteredColors.length;
  const r = Math.round(avg.r / count);
  const g = Math.round(avg.g / count);
  const b = Math.round(avg.b / count);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Enhanced color detection with perspective correction
export function analyzeColorChart(
  canvas: HTMLCanvasElement,
  expectedColors: string[],
  cardDimensions: { width: number; height: number },
  swatchLayout: { cols: number; rows: number }
): AnalysisResult {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Try to detect ArUco markers for perspective correction
  console.log('Detecting ArUco markers...');
  const detectedMarkers = detectArucoMarkers(canvas);
  console.log('ArUco detection completed, found markers:', detectedMarkers.length);
  
  let samples: ColorSample[] = [];
  let transform = {
    rotation: 0,
    scale: 1,
    translation: { x: 0, y: 0 }
  };
  
  if (detectedMarkers.length >= 3) {
    // Use ArUco markers for precise positioning
    transform = calculateTransform(detectedMarkers, cardDimensions);
    samples = extractColorsWithTransform(imageData, expectedColors, transform, swatchLayout, cardDimensions);
  } else {
    // Fallback to grid-based detection
    samples = extractColorsGridBased(imageData, expectedColors, swatchLayout);
  }
  
  return {
    samples,
    detectedMarkers,
    transform
  };
}

function detectArucoMarkers(canvas: HTMLCanvasElement): Array<{
  id: number;
  corners: Array<{ x: number; y: number }>;
}> {
  // This is a simplified ArUco detection - in a real implementation
  // you would use OpenCV.js ArUco detection
  const cv = (window as any).cv;
  
  // Check if OpenCV and ArUco module are available
  if (!cv) {
    console.warn('OpenCV not loaded');
    return [];
  }
  
  // ArUco module might not be included in the standard OpenCV.js build
  if (!cv.aruco) {
    console.warn('ArUco module not available in OpenCV.js - using fallback detection');
    // For now, return empty array - in production, you'd want to either:
    // 1. Use a custom OpenCV.js build with ArUco
    // 2. Implement a simpler marker detection
    // 3. Use a different marker system
    return [];
  }
  
  try {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    const dictionary = cv.aruco.Dictionary_get(cv.aruco.DICT_4X4_50);
    const markerCorners = new cv.MatVector();
    const markerIds = new cv.Mat();
    
    cv.aruco.detectMarkers(gray, dictionary, markerCorners, markerIds);
    
    const markers = [];
    for (let i = 0; i < markerIds.rows; i++) {
      const id = markerIds.data32S[i];
      const corners = markerCorners.get(i);
      const cornerPoints = [];
      
      for (let j = 0; j < 4; j++) {
        cornerPoints.push({
          x: corners.data32F[j * 2],
          y: corners.data32F[j * 2 + 1]
        });
      }
      
      markers.push({ id, corners: cornerPoints });
    }
    
    // Clean up
    src.delete();
    gray.delete();
    markerCorners.delete();
    markerIds.delete();
    
    return markers;
  } catch (error) {
    console.warn('ArUco detection failed:', error);
    return [];
  }
}

function calculateTransform(
  markers: Array<{ id: number; corners: Array<{ x: number; y: number }> }>,
  cardDimensions: { width: number; height: number }
) {
  // Calculate transformation matrix from detected markers
  // This is a simplified version - real implementation would use proper homography
  
  const marker0 = markers.find(m => m.id === 0);
  const marker1 = markers.find(m => m.id === 1);
  
  if (!marker0 || !marker1) {
    return {
      rotation: 0,
      scale: 1,
      translation: { x: 0, y: 0 }
    };
  }
  
  // Calculate rotation from top markers
  const dx = marker1.corners[0].x - marker0.corners[0].x;
  const dy = marker1.corners[0].y - marker0.corners[0].y;
  const rotation = Math.atan2(dy, dx);
  
  // Calculate scale
  const detectedWidth = Math.sqrt(dx * dx + dy * dy);
  const expectedWidth = cardDimensions.width; // This should be adjusted for perspective
  const scale = detectedWidth / expectedWidth;
  
  return {
    rotation,
    scale,
    translation: marker0.corners[0]
  };
}

function extractColorsWithTransform(
  imageData: ImageData,
  expectedColors: string[],
  transform: any,
  swatchLayout: { cols: number; rows: number },
  cardDimensions: { width: number; height: number }
): ColorSample[] {
  const samples: ColorSample[] = [];
  
  // ArUco markers are at grid positions: 0, 10, 66, 76
  const markerPositions = [0, 10, 66, 76];
  let colorIndex = 0;
  
  // Process all grid positions
  for (let gridIndex = 0; gridIndex < swatchLayout.cols * swatchLayout.rows; gridIndex++) {
    // Skip marker positions
    if (markerPositions.includes(gridIndex)) {
      continue;
    }
    
    // Stop if we've processed all expected colors
    if (colorIndex >= expectedColors.length) {
      break;
    }
    
    const row = Math.floor(gridIndex / swatchLayout.cols);
    const col = gridIndex % swatchLayout.cols;
    
    // Calculate position with proper margins and gaps
    const margin = 5; // 5mm margin
    const gap = 0.5; // 0.5mm gap between swatches
    const swatchSize = (cardDimensions.width - 2 * margin - (swatchLayout.cols - 1) * gap) / swatchLayout.cols;
    
    // Position relative to card dimensions
    const cardX = margin + col * (swatchSize + gap) + swatchSize / 2;
    const cardY = margin + row * (swatchSize + gap) + swatchSize / 2;
    
    // Apply transformation to get image coordinates
    const x = transform.translation.x + (cardX * transform.scale);
    const y = transform.translation.y + (cardY * transform.scale);
    
    if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
      const color = getAverageColor(imageData, Math.round(x), Math.round(y), 5);
      samples.push({
        color,
        position: { x, y },
        confidence: 0.9 // High confidence with ArUco markers
      });
    } else {
      // Default color if position is out of bounds
      samples.push({
        color: '#E5E7EB',
        position: { x, y },
        confidence: 0.1
      });
    }
    
    colorIndex++;
  }
  
  return samples;
}

function extractColorsGridBased(
  imageData: ImageData,
  expectedColors: string[],
  swatchLayout: { cols: number; rows: number }
): ColorSample[] {
  const samples: ColorSample[] = [];
  
  // ArUco markers are at grid positions: 0, 10, 66, 76
  const markerPositions = [0, 10, 66, 76];
  let colorIndex = 0;
  
  // Simple grid-based extraction (fallback method)
  // This assumes the card fills most of the image
  const margin = 0.058; // ~5.8% margin relative to image size
  const effectiveWidth = imageData.width * (1 - 2 * margin);
  const effectiveHeight = imageData.height * (1 - 2 * margin);
  const offsetX = imageData.width * margin;
  const offsetY = imageData.height * margin;
  
  const cellWidth = effectiveWidth / swatchLayout.cols;
  const cellHeight = effectiveHeight / swatchLayout.rows;
  
  // Process all grid positions
  for (let gridIndex = 0; gridIndex < swatchLayout.cols * swatchLayout.rows; gridIndex++) {
    // Skip marker positions
    if (markerPositions.includes(gridIndex)) {
      continue;
    }
    
    // Stop if we've processed all expected colors
    if (colorIndex >= expectedColors.length) {
      break;
    }
    
    const row = Math.floor(gridIndex / swatchLayout.cols);
    const col = gridIndex % swatchLayout.cols;
    
    const x = offsetX + (col + 0.5) * cellWidth;
    const y = offsetY + (row + 0.5) * cellHeight;
    
    if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
      const color = getAverageColor(imageData, Math.round(x), Math.round(y), 3);
      samples.push({
        color,
        position: { x, y },
        confidence: 0.6 // Lower confidence without markers
      });
    } else {
      samples.push({
        color: '#E5E7EB',
        position: { x, y },
        confidence: 0.1
      });
    }
    
    colorIndex++;
  }
  
  return samples;
}