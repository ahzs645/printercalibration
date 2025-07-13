// Layout calculation utilities for consistent rendering across preview, SVG, and PDF

export interface CardLayout {
  cardWidth: number;
  cardHeight: number;
  margin: number;
  swatchGrid: {
    cols: number;
    rows: number;
    swatchWidth: number;
    swatchHeight: number;
    gap: number;
  };
  markerPositions: Array<{
    id: number;
    gridIndex: number; // Which grid position this marker occupies
    x: number;
    y: number;
    size: number;
  }>;
  excludedIndices: number[]; // Grid indices occupied by markers
}

export function calculateCardLayout(
  useMarkers: boolean = true,
  margin: number = 5
): CardLayout {
  const cardWidth = 85.6;
  const cardHeight = 54;
  const cols = 10;
  const rows = 7;
  const gap = 1;
  
  // Calculate uniform swatch dimensions - force squares by using the smaller dimension
  const totalGapWidth = gap * (cols - 1);
  const totalGapHeight = gap * (rows - 1);
  const availableWidth = cardWidth - (2 * margin) - totalGapWidth;
  const availableHeight = cardHeight - (2 * margin) - totalGapHeight;
  
  const maxSwatchWidth = availableWidth / cols;
  const maxSwatchHeight = availableHeight / rows;
  
  // Use the smaller dimension to ensure squares fit within card bounds
  const swatchSize = Math.min(maxSwatchWidth, maxSwatchHeight);
  const swatchWidth = swatchSize;
  const swatchHeight = swatchSize;
  
  let layout: CardLayout = {
    cardWidth,
    cardHeight,
    margin,
    swatchGrid: { 
      cols, 
      rows, 
      swatchWidth, 
      swatchHeight, 
      gap 
    },
    markerPositions: [],
    excludedIndices: []
  };

  if (useMarkers) {
    // Place ArUco markers at corners using the same grid
    // Top-left corner = index 0
    // Top-right corner = index 9
    // Bottom-left corner = index 60
    // Bottom-right corner = index 69
    
    const cornerIndices = [0, 9, 60, 69];
    layout.excludedIndices = cornerIndices;
    
    layout.markerPositions = [
      { 
        id: 0, 
        gridIndex: 0,
        x: margin,
        y: margin,
        size: swatchSize // Same size as swatches
      },
      { 
        id: 1, 
        gridIndex: 9,
        x: margin + (9 * (swatchWidth + gap)),
        y: margin,
        size: swatchSize
      },
      { 
        id: 2, 
        gridIndex: 60,
        x: margin,
        y: margin + (6 * (swatchHeight + gap)),
        size: swatchSize
      },
      { 
        id: 3, 
        gridIndex: 69,
        x: margin + (9 * (swatchWidth + gap)),
        y: margin + (6 * (swatchHeight + gap)),
        size: swatchSize
      }
    ];
  }
  
  return layout;
}

export function getGridPosition(
  layout: CardLayout,
  gridIndex: number
): { x: number; y: number; width: number; height: number } {
  const row = Math.floor(gridIndex / layout.swatchGrid.cols);
  const col = gridIndex % layout.swatchGrid.cols;
  
  const x = layout.margin + (col * (layout.swatchGrid.swatchWidth + layout.swatchGrid.gap));
  const y = layout.margin + (row * (layout.swatchGrid.swatchHeight + layout.swatchGrid.gap));
  
  return {
    x,
    y,
    width: layout.swatchGrid.swatchWidth,
    height: layout.swatchGrid.swatchHeight
  };
}

export function getSwatchPosition(
  layout: CardLayout,
  swatchIndex: number
): { x: number; y: number; width: number; height: number } | null {
  // Map swatch index to grid position, skipping excluded indices
  let gridIndex = 0;
  let swatchCount = 0;
  const totalGridPositions = layout.swatchGrid.cols * layout.swatchGrid.rows;
  
  // Find the grid position for this swatch
  while (gridIndex < totalGridPositions) {
    if (!layout.excludedIndices.includes(gridIndex)) {
      if (swatchCount === swatchIndex) {
        // Found the position for this swatch
        const row = Math.floor(gridIndex / layout.swatchGrid.cols);
        const col = gridIndex % layout.swatchGrid.cols;
        
        const x = layout.margin + (col * (layout.swatchGrid.swatchWidth + layout.swatchGrid.gap));
        const y = layout.margin + (row * (layout.swatchGrid.swatchHeight + layout.swatchGrid.gap));
        
        return {
          x,
          y,
          width: layout.swatchGrid.swatchWidth,
          height: layout.swatchGrid.swatchHeight
        };
      }
      swatchCount++;
    }
    gridIndex++;
  }
  
  // Swatch index is beyond available positions
  return null;
}