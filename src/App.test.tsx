import { describe, it, expect } from 'vitest';
import { 
  calculateLayout,
  // LayoutCalculations, // Interface, not strictly needed for tests unless we type intermediate vars
  CARD_WIDTH_MM,
  CARD_HEIGHT_MM,
  ROWS,
  COLS,
  PRINT_GAP_MM,
  PIXELS_PER_MM 
} from './App'; // Import from App.tsx

describe('calculateLayout (from App.tsx)', () => {
  const defaultMarginPx = 16;
  const defaultSvgScaleFactor = 10;

  it('should calculate correct dimensions for PDF output with default margin', () => {
    const layout = calculateLayout('pdf', defaultMarginPx);
    
    expect(layout.cardWidth).toBe(CARD_WIDTH_MM);
    expect(layout.cardHeight).toBe(CARD_HEIGHT_MM);
    
    const expectedMarginMm = defaultMarginPx / PIXELS_PER_MM;
    expect(layout.margin).toBeCloseTo(expectedMarginMm);
    expect(layout.gap).toBe(PRINT_GAP_MM);

    const expectedDrawableWidth = CARD_WIDTH_MM - 2 * expectedMarginMm;
    const expectedDrawableHeight = CARD_HEIGHT_MM - 2 * expectedMarginMm;
    expect(layout.drawableWidth).toBeCloseTo(expectedDrawableWidth);
    expect(layout.drawableHeight).toBeCloseTo(expectedDrawableHeight);

    const totalGapWidthMm = (COLS - 1) * PRINT_GAP_MM;
    const totalGapHeightMm = (ROWS - 1) * PRINT_GAP_MM;

    const expectedSwatchWidth = (expectedDrawableWidth - totalGapWidthMm) / COLS;
    const expectedSwatchHeight = (expectedDrawableHeight - totalGapHeightMm) / ROWS;
    expect(layout.swatchWidth).toBeCloseTo(expectedSwatchWidth);
    expect(layout.swatchHeight).toBeCloseTo(expectedSwatchHeight);
  });

  it('should calculate correct dimensions for SVG output with default margin and scale', () => {
    const layout = calculateLayout('svg', defaultMarginPx, defaultSvgScaleFactor);

    const expectedScaledCardWidth = CARD_WIDTH_MM * defaultSvgScaleFactor;
    const expectedScaledCardHeight = CARD_HEIGHT_MM * defaultSvgScaleFactor;
    expect(layout.cardWidth).toBeCloseTo(expectedScaledCardWidth);
    expect(layout.cardHeight).toBeCloseTo(expectedScaledCardHeight);

    const expectedMarginMm = defaultMarginPx / PIXELS_PER_MM;
    const expectedScaledMargin = expectedMarginMm * defaultSvgScaleFactor;
    expect(layout.margin).toBeCloseTo(expectedScaledMargin);

    const expectedScaledGap = PRINT_GAP_MM * defaultSvgScaleFactor;
    expect(layout.gap).toBeCloseTo(expectedScaledGap);

    const expectedScaledDrawableWidth = expectedScaledCardWidth - 2 * expectedScaledMargin;
    const expectedScaledDrawableHeight = expectedScaledCardHeight - 2 * expectedScaledMargin;
    expect(layout.drawableWidth).toBeCloseTo(expectedScaledDrawableWidth);
    expect(layout.drawableHeight).toBeCloseTo(expectedScaledDrawableHeight);
    
    const totalScaledGapWidth = (COLS - 1) * expectedScaledGap;
    const totalScaledGapHeight = (ROWS - 1) * expectedScaledGap;

    const expectedScaledSwatchWidth = (expectedScaledDrawableWidth - totalScaledGapWidth) / COLS;
    const expectedScaledSwatchHeight = (expectedScaledDrawableHeight - totalScaledGapHeight) / ROWS;
    expect(layout.swatchWidth).toBeCloseTo(expectedScaledSwatchWidth);
    expect(layout.swatchHeight).toBeCloseTo(expectedScaledSwatchHeight);
  });

  it('should calculate correct dimensions for PDF output with zero margin', () => {
    const layout = calculateLayout('pdf', 0);

    expect(layout.margin).toBe(0);
    expect(layout.gap).toBe(PRINT_GAP_MM);

    const expectedDrawableWidth = CARD_WIDTH_MM; // No margin to subtract
    const expectedDrawableHeight = CARD_HEIGHT_MM;
    expect(layout.drawableWidth).toBeCloseTo(expectedDrawableWidth);
    expect(layout.drawableHeight).toBeCloseTo(expectedDrawableHeight);

    const totalGapWidthMm = (COLS - 1) * PRINT_GAP_MM;
    const totalGapHeightMm = (ROWS - 1) * PRINT_GAP_MM;

    const expectedSwatchWidth = (expectedDrawableWidth - totalGapWidthMm) / COLS;
    const expectedSwatchHeight = (expectedDrawableHeight - totalGapHeightMm) / ROWS;
    expect(layout.swatchWidth).toBeCloseTo(expectedSwatchWidth);
    expect(layout.swatchHeight).toBeCloseTo(expectedSwatchHeight);
  });

  it('should calculate correct dimensions for SVG output with zero margin', () => {
    const layout = calculateLayout('svg', 0, defaultSvgScaleFactor);

    expect(layout.margin).toBe(0);
    const expectedScaledGap = PRINT_GAP_MM * defaultSvgScaleFactor;
    expect(layout.gap).toBeCloseTo(expectedScaledGap);
    
    const expectedScaledCardWidth = CARD_WIDTH_MM * defaultSvgScaleFactor;
    const expectedScaledCardHeight = CARD_HEIGHT_MM * defaultSvgScaleFactor;
    expect(layout.drawableWidth).toBeCloseTo(expectedScaledCardWidth); // No margin
    expect(layout.drawableHeight).toBeCloseTo(expectedScaledCardHeight); // No margin

    const totalScaledGapWidth = (COLS - 1) * expectedScaledGap;
    const totalScaledGapHeight = (ROWS - 1) * expectedScaledGap;

    const expectedScaledSwatchWidth = (expectedScaledCardWidth - totalScaledGapWidth) / COLS;
    const expectedScaledSwatchHeight = (expectedScaledCardHeight - totalScaledGapHeight) / ROWS;
    expect(layout.swatchWidth).toBeCloseTo(expectedScaledSwatchWidth);
    expect(layout.swatchHeight).toBeCloseTo(expectedScaledSwatchHeight);
  });
  
  it('should handle large margins resulting in non-positive drawable area correctly', () => {
    // Margin in pixels that is definitely larger than half the card width in pixels
    const veryLargeMarginPx = (CARD_WIDTH_MM * PIXELS_PER_MM) + 100; 
    const layoutPdf = calculateLayout('pdf', veryLargeMarginPx);

    expect(layoutPdf.drawableWidth).toBe(0); // Clamped by Math.max(0, ...)
    expect(layoutPdf.swatchWidth).toBe(0);   // Clamped by Math.max(0, ...)

    const layoutSvg = calculateLayout('svg', veryLargeMarginPx, defaultSvgScaleFactor);
    expect(layoutSvg.drawableWidth).toBe(0); // Clamped
    expect(layoutSvg.swatchWidth).toBe(0);   // Clamped
  });
});

// Test for hexToRgb (also in App.tsx)
import { hexToRgb } from './App'; // Assuming hexToRgb is also exported from App.tsx

describe('hexToRgb (from App.tsx)', () => {
  it('should convert valid hex colors to RGB', () => {
    expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#00FF00")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#0000FF")).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb("#1A2B3C")).toEqual({ r: 26, g: 43, b: 60 });
  });

  it('should handle hex colors with mixed case', () => {
    expect(hexToRgb("#1a2B3c")).toEqual({ r: 26, g: 43, b: 60 });
  });

  // It's good practice to test for invalid inputs if the function is robust,
  // but the current hexToRgb doesn't have explicit error handling for non-hex strings.
  // This test would fail or throw an error if hexToRgb is not robust.
  // For now, focusing on valid inputs as per current function scope.
});
