import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Button } from "./components/ui/button"
import { Slider } from "./components/ui/slider"
import { useState, useRef, useEffect } from "react"
import QRCode from 'qrcode'

interface ColorProfile {
  id: string
  name: string
  device: string
  created: string
  adjustments: {
    brightness: number
    contrast: number
    saturation: number
    red: number
    green: number
    blue: number
  }
}

interface ColorComparison {
  original: string
  scanned: string
  difference: {
    r: number
    g: number
    b: number
  }
}

const DEFAULT_SWATCHES = [
  // Basic Colors
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#00FFFF", // Cyan
  "#FF00FF", // Magenta
  "#FFFF00", // Yellow
  "#FFA500", // Orange
  "#BFFF00", // Lime
  "#008080", // Teal
  "#800080", // Purple

  // Skin Tones
  "#FBE8D3", // Light
  "#F3C6A5",
  "#E0AC69",
  "#C68642",
  "#8D5524",
  "#5A3825", // Dark

  // Pastels
  "#FFB3BA", // Pink
  "#FFDFBA", // Peach
  "#FFFFBA", // Lemon
  "#BAFFC9", // Mint
  "#BAE1FF", // Sky blue
  "#E0BBE4", // Lavender
  "#D5F4E6", // Light aqua
  "#F6E2B3", // Light sand

  // Earthy Colors
  "#8B4513", // Saddle brown
  "#A0522D", // Sienna
  "#CD853F", // Peru
  "#D2B48C", // Tan
  "#556B2F", // Dark olive
  "#6B8E23", // Olive drab

  // Neutrals & Grays
  "#FFFFFF", // White
  "#E0E0E0",
  "#C0C0C0",
  "#A0A0A0",
  "#808080", // Middle gray
  "#606060",
  "#404040",
  "#303030",
  "#202020",
  "#000000", // Black

  // Red Ramp
  "#1A0000",
  "#330000",
  "#4D0000",
  "#660000",
  "#800000",
  "#990000",
  "#B30000",
  "#CC0000",
  "#E60000",
  "#FF0000",

  // Green Ramp
  "#001A00",
  "#003300",
  "#004D00",
  "#006600",
  "#008000",
  "#009900",
  "#00B300",
  "#00CC00",
  "#00E600",
  "#00FF00",

  // Blue Ramp
  "#00001A",
  "#000033",
  "#00004D",
  "#000066",
  "#000080",
  "#000099",
  "#0000B3",
  "#0000CC",
  "#0000E6",
  "#0000FF",
]

// Helper to wait for OpenCV to be ready
function waitForOpenCV(callback: () => void) {
  if ((window as any).cv && (window as any).cv.imread) {
    callback();
  } else {
    setTimeout(() => waitForOpenCV(callback), 100);
  }
}

// Constants and Helper Function for Layout Calculations
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 54;
const ROWS = 7;
const COLS = 10;
const PREVIEW_GAP_PX = 2; // Tailwind gap-0.5 = 0.125rem * 16px/rem = 2px (assuming 1rem = 16px)
const PRINT_GAP_MM = 0.5; // Desired print gap in mm

const DPI = 96; // Assumed DPI for preview pixel calculations
const MM_PER_INCH = 25.4;
const PIXELS_PER_MM = DPI / MM_PER_INCH; // Approx. 3.7795 px/mm

interface LayoutCalculations {
  cardWidth: number;
  cardHeight: number;
  margin: number;
  gap: number;
  swatchWidth: number;
  swatchHeight: number;
  drawableWidth: number;
  drawableHeight: number;
}

function calculateLayout(
  targetUnit: 'svg' | 'pdf',
  currentCardMarginPx: number,
  svgScaleFactor: number = 10 // Only relevant for SVG, applied to mm units
): LayoutCalculations {
  let cardWidth: number, cardHeight: number, margin: number, gap: number;

  if (targetUnit === 'pdf') {
    cardWidth = CARD_WIDTH_MM;
    cardHeight = CARD_HEIGHT_MM;
    margin = currentCardMarginPx / PIXELS_PER_MM; // Convert px margin to mm
    gap = PRINT_GAP_MM; // Use specified print gap in mm
  } else { // svg
    // For SVG, all dimensions will be scaled versions of their mm counterparts
    cardWidth = CARD_WIDTH_MM * svgScaleFactor;
    cardHeight = CARD_HEIGHT_MM * svgScaleFactor;
    const marginMm = currentCardMarginPx / PIXELS_PER_MM;
    margin = marginMm * svgScaleFactor; // Scale mm margin to SVG units
    gap = PRINT_GAP_MM * svgScaleFactor; // Scale mm gap to SVG units
  }

  const drawableWidth = cardWidth - (2 * margin);
  const drawableHeight = cardHeight - (2 * margin);

  const totalGapWidth = (COLS - 1) * gap;
  const totalGapHeight = (ROWS - 1) * gap;

  const swatchWidth = (drawableWidth - totalGapWidth) / COLS;
  const swatchHeight = (drawableHeight - totalGapHeight) / ROWS;
  
  return { 
    cardWidth, 
    cardHeight, 
    margin, 
    gap, 
    swatchWidth: Math.max(0, swatchWidth), 
    swatchHeight: Math.max(0, swatchHeight), 
    drawableWidth: Math.max(0, drawableWidth),
    drawableHeight: Math.max(0, drawableHeight)
  };
}


function App() {
  const [activeTab, setActiveTab] = useState("swatch-generator")
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    red: 0,
    green: 0,
    blue: 0
  })
  const [selectedColor, setSelectedColor] = useState("#4285f4")
  const [colorChart, setColorChart] = useState<string[]>(DEFAULT_SWATCHES)
  const [profiles, setProfiles] = useState<ColorProfile[]>([])
  const [newProfileName, setNewProfileName] = useState("")
  const [newProfileDevice, setNewProfileDevice] = useState("")
  const [hoveredSwatch, setHoveredSwatch] = useState<number | null>(null)
  const [cardMargin, setCardMargin] = useState(16) // Default margin in pixels
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [processedImageDataUrl, setProcessedImageDataUrl] = useState<string | null>(null)
  const [colorComparisons, setColorComparisons] = useState<ColorComparison[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  // const [referencePosition, setReferencePosition] = useState<{ x: number, y: number } | null>(null) // No longer used for QR code placement

  useEffect(() => {
    // Use calculateLayout to get precise dimensions in mm for the QR code data
    const layout = calculateLayout('pdf', cardMargin); // targetUnit 'pdf' gives mm
    
    const qrCodePhysicalSizeMm = 15; // Define the QR code's printed size (e.g., 15mm x 15mm)
    const qrCodePositionOnCardMm = { x: 1, y: 1 }; // Top-left corner of QR code relative to card's top-left (in mm)

    const qrDataContent = {
      type: 'color-chart-reference',
      version: '1.1', // Updated version to reflect new structure
      // Card layout details (all in mm)
      cardLayout: {
        cardWidthMm: layout.cardWidth, // Should be CARD_WIDTH_MM
        cardHeightMm: layout.cardHeight, // Should be CARD_HEIGHT_MM
        marginMm: layout.margin,
        gapMm: layout.gap,
        rows: ROWS,
        cols: COLS,
        swatchWidthMm: layout.swatchWidth,
        swatchHeightMm: layout.swatchHeight,
      },
      // QR code's own properties (all in mm)
      qrCodeProperties: {
        physicalSizeMm: qrCodePhysicalSizeMm,
        topLeftOnCardMm: qrCodePositionOnCardMm,
      }
    };

    const qrDataString = JSON.stringify(qrDataContent);
    
    QRCode.toDataURL(qrDataString, { 
      width: 100, // Display size of QR code in UI (pixels) - can be smaller for display
      margin: 2, // Margin around QR code graphic
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }).then(url => {
      setQrCodeDataUrl(url)
    })
  }, [cardMargin])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value)
  }

  const handleAddToChart = () => {
    if (colorChart.length >= 70) return // Limit to 10x7 grid
    setColorChart(prev => [...prev, selectedColor])
  }

  const getRGBValues = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgb(${r}, ${g}, ${b})`
  }

  const handleSaveProfile = () => {
    if (!newProfileName || !newProfileDevice) return

    const newProfile: ColorProfile = {
      id: Date.now().toString(),
      name: newProfileName,
      device: newProfileDevice,
      created: new Date().toLocaleDateString(),
      adjustments: { ...adjustments }
    }

    setProfiles(prev => [...prev, newProfile])
    setNewProfileName("")
    setNewProfileDevice("")
  }

  const handleResetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      red: 0,
      green: 0,
      blue: 0
    })
  }

  const handleLoadProfile = (profile: ColorProfile) => {
    setAdjustments(profile.adjustments)
  }

  const handleDeleteProfile = (profileId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId))
  }

  const applyAdjustments = (color: string) => {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)

    // Apply adjustments
    const adjustedR = Math.max(0, Math.min(255, r + adjustments.red))
    const adjustedG = Math.max(0, Math.min(255, g + adjustments.green))
    const adjustedB = Math.max(0, Math.min(255, b + adjustments.blue))

    // Convert back to hex
    return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`
  }

  const handleRemoveSwatch = (index: number) => {
    setColorChart(prev => prev.filter((_, i) => i !== index))
  }

  const handleReplaceSwatch = (index: number) => {
    setColorChart(prev => {
      const newChart = [...prev]
      newChart[index] = selectedColor
      return newChart
    })
  }

  const generateSVG = () => {
    const svgScaleFactor = 10; // Defines the scaling for SVG units (e.g., 1mm = 10 SVG units)
    const layout = calculateLayout('svg', cardMargin, svgScaleFactor);

    const svgContent = `
      <svg width="${layout.cardWidth}" height="${layout.cardHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        ${colorChart.map((color, index) => {
          const rowIndex = Math.floor(index / COLS) // Use COLS from constants
          const colIndex = index % COLS         // Use COLS from constants
          const x = layout.margin + (colIndex * (layout.swatchWidth + layout.gap))
          const y = layout.margin + (rowIndex * (layout.swatchHeight + layout.gap))
          return `<rect 
            x="${x}" 
            y="${y}" 
            width="${layout.swatchWidth}" 
            height="${layout.swatchHeight}" 
            fill="${color || '#E5E7EB'}"
          />`
        }).join('')}
      </svg>
    `

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'color-swatch-chart.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generatePDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const layout = calculateLayout('pdf', cardMargin);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [layout.cardWidth, layout.cardHeight] 
      })

      // Add white background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, layout.cardWidth, layout.cardHeight, 'F');

      // Add swatches
      colorChart.forEach((color, index) => {
        const rowIndex = Math.floor(index / COLS); // Use COLS from constants
        const colIndex = index % COLS;          // Use COLS from constants
        const x = layout.margin + (colIndex * (layout.swatchWidth + layout.gap));
        const y = layout.margin + (rowIndex * (layout.swatchHeight + layout.gap));

        if (color) {
          const rgb = hexToRgb(color);
          pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        } else {
          pdf.setFillColor(229, 231, 235); // #E5E7EB
        }

        pdf.rect(x, y, layout.swatchWidth, layout.swatchHeight, 'F');
      })

      pdf.save('color-swatch-chart.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

const hexToRgb = (hex: string) => { // Removed export
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setScannedImage(event.target?.result as string)
      analyzeImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true)
    const img = new window.Image()
    img.onload = () => {
      const mainCanvas = canvasRef.current // This is the hidden canvas used for OpenCV
      if (!mainCanvas) return
      const mainCtx = mainCanvas.getContext('2d')
      if (!mainCtx) return
      mainCanvas.width = img.width
      mainCanvas.height = img.height
      mainCtx.drawImage(img, 0, 0)

      waitForOpenCV(() => {
        const cv = (window as any).cv;
        const src = cv.imread(mainCanvas);
        let qrDecodedInfoJson = "";
        let qrCodePixelCorners: { x: number, y: number }[] = [];
        const points = new cv.Mat(); 
        const straight_qrcode = new cv.Mat();

        try {
          const detector = new cv.QRCodeDetector();
          qrDecodedInfoJson = detector.detectAndDecode(src, points, straight_qrcode);

          if (qrDecodedInfoJson && qrDecodedInfoJson.length > 0) {
            console.log("QR Code Decoded:", qrDecodedInfoJson);
            if (!points.empty()) {
              // points is a Mat with dimensions N x 1, type CV_32FC2, where N is the number of points (4 for a QR code).
              // Each point has two float components (x, y).
              // So, data32F will contain [x1, y1, x2, y2, x3, y3, x4, y4]
              if (points.rows === 4 && points.cols === 1 && points.type() === cv.CV_32FC2) {
                 for (let i = 0; i < points.rows; ++i) {
                    qrCodePixelCorners.push({ x: points.data32F[i*2], y: points.data32F[i*2+1] });
                 }
                 console.log("QR Code Pixel Corners (TopLeft, TopRight, BottomRight, BottomLeft):", qrCodePixelCorners);
              } else {
                 console.warn("QR code corner points Mat format not as expected (expected 4x1 CV_32FC2):", points.dump());
                 // Attempt to read if it's 1x4 CV_32FC2 (sometimes detector might output this way)
                 if (points.rows === 1 && points.cols === 4 && points.type() === cv.CV_32FC2) {
                    for (let i = 0; i < points.cols; ++i) {
                       qrCodePixelCorners.push({ x: points.data32F[i*2], y: points.data32F[i*2+1] });
                    }
                    console.log("QR Code Pixel Corners (Alt format 1x4):", qrCodePixelCorners);
                 } else {
                    console.error("Cannot extract QR corners due to unexpected Mat structure.");
                 }
              }
            } else {
              console.warn("QR Code decoded, but corner points Mat is empty.");
              qrDecodedInfoJson = ""; // Treat as not found if corners are missing
            }
          } else {
            console.log("QR Code not detected or could not be decoded.");
            qrDecodedInfoJson = ""; // Ensure it's empty if not detected
          }
        } catch (e) {
          console.error("Error during QR code detection:", e);
          qrDecodedInfoJson = ""; // Ensure it's empty on error
        } finally {
          points.delete(); 
          straight_qrcode.delete();
        }
        
        // Fallback to contour detection if QR code is not found or fails
        if (!qrDecodedInfoJson || qrCodePixelCorners.length < 4) {
          console.log("Falling back to contour-based swatch detection.");
          let gray = new cv.Mat();
          let thresh = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
          cv.threshold(gray, thresh, 240, 255, cv.THRESH_BINARY); 
          let contours = new cv.MatVector();
          let hierarchy = new cv.Mat();
          cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

          let boxes: {x: number, y: number, w: number, h: number}[] = []
          for (let i = 0; i < contours.size(); i++) {
            const rect = cv.boundingRect(contours.get(i));
            if (rect.width > src.cols/30 && rect.width < src.cols/5 && 
                rect.height > src.rows/30 && rect.height < src.rows/5) {
              boxes.push(rect);
            }
          }
          contours.delete(); hierarchy.delete(); gray.delete(); thresh.delete();
          
          boxes.sort((a, b) => {
            const rowA = Math.round(a.y / (src.rows / ROWS)); 
            const rowB = Math.round(b.y / (src.rows / ROWS));
            if (rowA === rowB) return a.x - b.x;
            return rowA - rowB;
          });
          
          if (boxes.length > 0) {
            const processedCanvas = document.createElement('canvas')
            processedCanvas.width = img.width
            processedCanvas.height = img.height
            const processedCtx = processedCanvas.getContext('2d')
            if (!processedCtx) {
              src.delete();
              setIsAnalyzing(false);
              return;
            }
            processedCtx.drawImage(img, 0, 0); 

            const scannedColors: string[] = boxes.map(box => {
              processedCtx.strokeStyle = 'red'; // Red for contour-detected boxes
              processedCtx.lineWidth = 1; // Thinner line for fallback
              processedCtx.strokeRect(box.x, box.y, box.w, box.h);
              const cx = Math.round(box.x + box.w/2);
              const cy = Math.round(box.y + box.h/2);
              const pixel = mainCtx.getImageData(cx, cy, 1, 1).data;
              const hexColor = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
              // Optional: Draw text for fallback, keep it minimal
              // processedCtx.fillStyle = 'red';
              // processedCtx.font = '8px Arial';
              // processedCtx.fillText(hexColor.substring(1,4), box.x + 1, box.y + 8); // Shorter text
              return hexColor;
            });
            setProcessedImageDataUrl(processedCanvas.toDataURL('image/jpeg'));
            while (scannedColors.length < ROWS * COLS) scannedColors.push('#E5E7EB'); 
            const comparisons = colorChart.map((original, index) => ({
              original,
              scanned: scannedColors[index] || '#E5E7EB',
              difference: calculateColorDifference(original, scannedColors[index] || '#E5E7EB')
            }));
            setColorComparisons(comparisons);
          } else {
            console.log("Contour detection did not find enough boxes.");
            setProcessedImageDataUrl(null); 
            setColorComparisons([]);
          }
        } else {
          // Step 3: Calculate Swatch Bounding Boxes using QR Data
          try {
            const qrDataContent = JSON.parse(qrDecodedInfoJson);
            console.log("Parsed QR Data Content:", qrDataContent);

            if (!qrDataContent.qrCodeProperties || !qrDataContent.cardLayout) {
              throw new Error("QR data content is missing necessary properties.");
            }

            const { physicalSizeMm, topLeftOnCardMm } = qrDataContent.qrCodeProperties;
            const { marginMm, gapMm, swatchWidthMm, swatchHeightMm, rows, cols } = qrDataContent.cardLayout;

            // Calculate QR code pixel dimensions (average width and height)
            // Assuming qrCodePixelCorners are [TL, TR, BR, BL]
            const qrPixelWidth1 = Math.abs(qrCodePixelCorners[1].x - qrCodePixelCorners[0].x);
            const qrPixelWidth2 = Math.abs(qrCodePixelCorners[2].x - qrCodePixelCorners[3].x);
            const avgQrPixelWidth = (qrPixelWidth1 + qrPixelWidth2) / 2;

            const qrPixelHeight1 = Math.abs(qrCodePixelCorners[3].y - qrCodePixelCorners[0].y);
            const qrPixelHeight2 = Math.abs(qrCodePixelCorners[2].y - qrCodePixelCorners[1].y);
            const avgQrPixelHeight = (qrPixelHeight1 + qrPixelHeight2) / 2;
            
            const pixelsPerMmX = avgQrPixelWidth / physicalSizeMm;
            const pixelsPerMmY = avgQrPixelHeight / physicalSizeMm; // Assuming QR is square in mm

            console.log(`pixelsPerMmX: ${pixelsPerMmX}, pixelsPerMmY: ${pixelsPerMmY}`);

            const qrOffsetPxX = topLeftOnCardMm.x * pixelsPerMmX;
            const qrOffsetPxY = topLeftOnCardMm.y * pixelsPerMmY;

            const cardTopLeftPixelX = qrCodePixelCorners[0].x - qrOffsetPxX;
            const cardTopLeftPixelY = qrCodePixelCorners[0].y - qrOffsetPxY;
            console.log(`Card Top-Left in Pixels: (${cardTopLeftPixelX}, ${cardTopLeftPixelY})`);

            const marginPxX = marginMm * pixelsPerMmX;
            const marginPxY = marginMm * pixelsPerMmY; // Assuming same margin for X and Y from single marginMm
            const gapPxX = gapMm * pixelsPerMmX;
            const gapPxY = gapMm * pixelsPerMmY; // Assuming same gap for X and Y from single gapMm
            const swatchWidthPx = swatchWidthMm * pixelsPerMmX;
            const swatchHeightPx = swatchHeightMm * pixelsPerMmY;

            let calculatedBoxes: {x: number, y: number, w: number, h: number}[] = [];
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const swatchX_px = cardTopLeftPixelX + marginPxX + c * (swatchWidthPx + gapPxX);
                const swatchY_px = cardTopLeftPixelY + marginPxY + r * (swatchHeightPx + gapPxY);
                calculatedBoxes.push({
                  x: swatchX_px,
                  y: swatchY_px,
                  w: swatchWidthPx,
                  h: swatchHeightPx,
                });
              }
            }
            console.log("Calculated boxes from QR:", calculatedBoxes.length, calculatedBoxes.length > 0 ? calculatedBoxes[0] : "Empty");
            
            // Step 4: Extract Colors and Update Processed Image using 'calculatedBoxes'
            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = img.width;
            processedCanvas.height = img.height;
            const processedCtx = processedCanvas.getContext('2d');

            if (!processedCtx) {
              src.delete();
              setIsAnalyzing(false);
              throw new Error("Could not get 2D context from processed canvas.");
            }
            
            processedCtx.drawImage(img, 0, 0); // Draw original image first

            const scannedColorsFromQR: string[] = calculatedBoxes.map((box, index) => {
              if (box.w <= 0 || box.h <= 0) {
                console.warn(`Box ${index} has zero or negative dimensions:`, box);
                return '#000000'; // Return a default color for invalid boxes
              }
              // Clamp box coordinates and dimensions to be within the canvas
              const ix = Math.max(0, Math.round(box.x));
              const iy = Math.max(0, Math.round(box.y));
              const iw = Math.max(1, Math.round(box.w)); // Ensure width/height are at least 1
              const ih = Math.max(1, Math.round(box.h));

              // Ensure the sampling point is within the canvas boundaries
              const cx = Math.min(Math.max(ix + iw / 2, 0), mainCanvas.width - 1);
              const cy = Math.min(Math.max(iy + ih / 2, 0), mainCanvas.height - 1);
              
              const pixel = mainCtx.getImageData(cx, cy, 1, 1).data;
              const hexColor = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
              
              processedCtx.strokeStyle = 'lime'; // Lime green for QR-derived boxes
              processedCtx.lineWidth = 1; 
              processedCtx.strokeRect(ix, iy, iw, ih);
              
              processedCtx.fillStyle = 'lime';
              processedCtx.font = '8px Arial';
              // Only show first 3 chars of hex (e.g., #123) to save space
              processedCtx.fillText(hexColor.substring(0, 4), ix + 1, iy + 8); 
              return hexColor;
            });

            // Draw the detected QR outline on top
            if(qrCodePixelCorners.length === 4){
              processedCtx.strokeStyle = 'cyan';
              processedCtx.lineWidth = 2;
              processedCtx.beginPath();
              processedCtx.moveTo(qrCodePixelCorners[0].x, qrCodePixelCorners[0].y);
              for(let i=1; i<4; i++){ processedCtx.lineTo(qrCodePixelCorners[i].x, qrCodePixelCorners[i].y); }
              processedCtx.closePath();
              processedCtx.stroke();
            }

            setProcessedImageDataUrl(processedCanvas.toDataURL('image/jpeg'));

            // Populate colorComparisons
            const comparisons = colorChart.map((original, index) => ({
              original,
              scanned: scannedColorsFromQR[index] || '#E5E7EB', // Fallback if not enough scanned colors
              difference: calculateColorDifference(original, scannedColorsFromQR[index] || '#E5E7EB')
            }));
            setColorComparisons(comparisons);

          } catch (parseError) {
            console.error("Error parsing QR JSON or processing QR-derived boxes:", parseError);
            // Fallback to showing original image if QR processing fails badly
            setProcessedImageDataUrl(imageData); 
            setColorComparisons([]);
          }
        }
        
        src.delete(); 
        setIsAnalyzing(false);
      })
    }
    img.src = imageData
  }

  const exportCardTemplate = () => {
    const templateData = {
      version: "1.0",
      colorChart: colorChart,
      cardMargin: cardMargin
    };
    const jsonString = JSON.stringify(templateData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'color-card-template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTemplateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const parsedData = JSON.parse(result);

          // Basic validation
          if (
            parsedData &&
            typeof parsedData.version === 'string' && // Check version, though not strictly used yet
            Array.isArray(parsedData.colorChart) &&
            parsedData.colorChart.every((color: any) => typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)) &&
            typeof parsedData.cardMargin === 'number'
          ) {
            setColorChart(parsedData.colorChart);
            setCardMargin(parsedData.cardMargin);
            alert('Card template imported successfully!');
          } else {
            alert('Invalid template file format.');
          }
        }
      } catch (error) {
        console.error('Error parsing template file:', error);
        alert('Error parsing template file. Please ensure it is a valid JSON template.');
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Error reading file.');
    };
    reader.readAsText(file);
    // Reset file input to allow re-uploading the same file name
    if (e.target) {
      e.target.value = '';
    }
  };

  const calculateColorDifference = (color1: string, color2: string) => {
    const rgb1 = hexToRgb(color1)
    const rgb2 = hexToRgb(color2)
    return {
      r: rgb2.r - rgb1.r,
      g: rgb2.g - rgb1.g,
      b: rgb2.b - rgb1.b
    }
  }

  const createProfileFromComparison = () => {
    if (colorComparisons.length === 0) {
      alert("Please analyze an image first to get color comparisons.");
      return;
    }

    let totalDiffR = 0;
    let totalDiffG = 0;
    let totalDiffB = 0;

    colorComparisons.forEach(comp => {
      totalDiffR += comp.difference.r;
      totalDiffG += comp.difference.g;
      totalDiffB += comp.difference.b;
    });

    const numComparisons = colorComparisons.length;
    const avgDiffR = totalDiffR / numComparisons;
    const avgDiffG = totalDiffG / numComparisons;
    const avgDiffB = totalDiffB / numComparisons;

    // Heuristic for adjustments
    // If scanned color is lower (e.g., scanned red is 200, original is 220, diff.r = -20),
    // we need to increase the printer's output for that channel.
    // The adjustment sliders add to the original color value before printing.
    // So, if red is too low by 20 (diff.r = -20), we want an adjustment that *adds* 20.
    // Thus, suggestedRedAdjustment should be positive if avgDiffR is negative.
    const suggestedRedAdjustment = -avgDiffR;
    const suggestedGreenAdjustment = -avgDiffG;
    const suggestedBlueAdjustment = -avgDiffB;

    const avgOverallDiff = (avgDiffR + avgDiffG + avgDiffB) / 3;
    // If overall colors are darker (avgOverallDiff is negative), suggest increasing brightness.
    // A positive brightness adjustment lightens the output.
    const suggestedBrightness = -avgOverallDiff / 5; // Damping factor

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value)));

    setAdjustments(prev => ({
      ...prev, // Keep existing contrast and saturation, or other non-calculated values
      red: clamp(suggestedRedAdjustment, -50, 50),
      green: clamp(suggestedGreenAdjustment, -50, 50),
      blue: clamp(suggestedBlueAdjustment, -50, 50),
      brightness: clamp(suggestedBrightness, -50, 50),
      // For now, explicitly set contrast and saturation to 0 or keep previous,
      // as deriving them from RGB diffs is complex.
      // Let's reset them to 0 for a new profile suggestion.
      contrast: 0, 
      saturation: 0,
    }));

    setActiveTab("profile-manager");
    // Optionally, clear the profile name and device fields
    setNewProfileName("Suggested Profile");
    setNewProfileDevice("From Comparison");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">ID Card Color Calibration Tool</h1>
        
        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to Calibrate Colors for ID Card Printing</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Generate a color swatch chart using the "Generate Swatch Chart" tab</li>
            <li>Print the chart on your ID card printer with color management turned OFF</li>
            <li>Take a photo or scan of the printed swatch card in good lighting</li>
            <li>Compare the original digital colors with your printed results</li>
            <li>Use the "Color Comparison" tab to analyze differences and create adjustments</li>
            <li>Apply these adjustments to future ID card designs to get accurate color reproduction</li>
          </ol>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg p-6">
          <Tabs defaultValue="swatch-generator" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="swatch-generator">Generate Swatch Chart</TabsTrigger>
              <TabsTrigger value="color-comparison">Color Comparison</TabsTrigger>
              <TabsTrigger value="profile-manager">Profile Manager</TabsTrigger>
            </TabsList>
            
            <TabsContent value="swatch-generator" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Generate Color Swatch Chart</h2>
                  <p className="text-muted-foreground">Create a custom color swatch chart to print on your ID cards.</p>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <input 
                    type="color" 
                    className="w-12 h-12 rounded cursor-pointer" 
                    value={selectedColor}
                    onChange={handleColorChange}
                  />
                  <div 
                    className="w-16 h-16 rounded border border-border" 
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm">HEX: <span className="font-mono">{selectedColor}</span></div>
                    <div className="text-sm">RGB: <span className="font-mono">{getRGBValues(selectedColor)}</span></div>
                  </div>
                  <Button 
                    onClick={handleAddToChart}
                    disabled={colorChart.length >= 70}
                  >
                    Add to Chart
                  </Button>
                </div>

                <div className="flex gap-8">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium mb-4">Color Swatch Chart</h3>
                    <div className="grid grid-cols-10 gap-1 p-4 bg-muted/20 rounded-lg">
                      {Array.from({ length: 70 }).map((_, index) => (
                        <div 
                          key={index}
                          className="aspect-square border border-border relative group rounded-sm overflow-hidden"
                          style={{ backgroundColor: colorChart[index] || '#E5E7EB' }}
                          onMouseEnter={() => setHoveredSwatch(index)}
                          onMouseLeave={() => setHoveredSwatch(null)}
                        >
                          {hoveredSwatch === index && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 p-1">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleReplaceSwatch(index)}
                              >
                                Replace
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleRemoveSwatch(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-[300px]">
                    <h3 className="text-xl font-medium mb-4">CR80 Card Preview</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Card Margin</label>
                          <span className="text-sm font-mono">{cardMargin}px</span>
                        </div>
                        <Slider
                          value={[cardMargin]}
                          onValueChange={([value]) => setCardMargin(value)}
                          min={0}
                          max={32}
                          step={1}
                        />
                      </div>
                      <div 
                        className="aspect-[85.6/54] border-2 border-border rounded-lg overflow-hidden bg-muted/20"
                        style={{ padding: `${cardMargin}px` }}
                      >
                        <div className="grid grid-cols-10 grid-rows-7 gap-0.5 h-full">
                          {Array.from({ length: 70 }).map((_, index) => (
                            <div 
                              key={index}
                              className="border border-border rounded-sm"
                              style={{ backgroundColor: colorChart[index] || '#E5E7EB' }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        CR80 Card Size: {CARD_WIDTH_MM} mm × {CARD_HEIGHT_MM} mm
                      </p>
                    </div>
                    {qrCodeDataUrl && (
                      <div className="mt-4 p-4 border border-dashed rounded-lg">
                        <h4 className="text-md font-medium mb-2">Calibration QR Code</h4>
                        <img src={qrCodeDataUrl} alt="Calibration QR Code" className="mx-auto border rounded-md" />
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Include this QR code when printing your chart. It helps automatically align and scale the scanned image.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4 flex-wrap">
                  <Button onClick={generateSVG}>Download SVG</Button>
                  <Button onClick={generatePDF}>Download PDF</Button>
                  <Button>Print Chart</Button>
                  <Button onClick={exportCardTemplate}>Export Card Template</Button>
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleTemplateFileChange} 
                    style={{ display: 'none' }} 
                    id="import-template-input" 
                  />
                  <Button onClick={() => document.getElementById('import-template-input')?.click()}>
                    Import Card Template
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="color-comparison" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Compare Original vs Printed Colors</h2>
                  <p className="text-muted-foreground">Upload your scanned/photographed color chart to analyze differences.</p>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <p className="mb-2">Upload a photo or scan of your printed color chart</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    onChange={handleImageUpload}
                  />
                  <p className="text-sm text-muted-foreground mt-2">For best results, ensure good lighting and minimal glare</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-medium mb-4">Original Colors</h3>
                    <div className="grid grid-cols-10 gap-1 p-4 bg-muted/20 rounded-lg">
                      {colorChart.map((color, index) => (
                        <div
                          key={`original-${index}`}
                          className="aspect-square rounded-sm"
                          style={{ backgroundColor: color || '#E5E7EB' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-4">Scanned Swatches (Detected)</h3>
                     {isAnalyzing ? (
                      <p className="text-center text-muted-foreground">Analyzing colors...</p>
                    ) : colorComparisons.length > 0 ? (
                      <div className="grid grid-cols-10 gap-1 p-4 bg-muted/20 rounded-lg">
                        {colorComparisons.map((comparison, index) => (
                          <div
                            key={`scanned-swatch-${index}`}
                            className="aspect-square rounded-sm border border-border"
                            style={{ backgroundColor: comparison.scanned || '#E5E7EB' }}
                          />
                        ))}
                      </div>
                    ) : (
                       !scannedImage && <p className="text-muted-foreground">Upload an image to see detected swatches.</p>
                    )}
                  </div>
                </div>
                
                {scannedImage && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-medium mb-2">Original Scan</h3>
                      <img 
                        src={scannedImage} 
                        alt="Original scanned color chart" 
                        className="w-full rounded-lg border border-border"
                      />
                    </div>
                    {processedImageDataUrl && (
                      <div>
                        <h3 className="text-xl font-medium mb-2">Processed Scan with Detected Swatches</h3>
                        <img 
                          src={processedImageDataUrl} 
                          alt="Processed scan with detected swatches" 
                          className="w-full rounded-lg border border-border"
                        />
                      </div>
                    )}
                  </div>
                )}

                {colorComparisons.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-medium mb-4">Color Difference Analysis</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {colorComparisons.map((comparison, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 border border-border rounded-md bg-muted/20">
                            <div style={{backgroundColor: comparison.original, width: 24, height: 24, borderRadius: 4, border: '1px solid #777'}} title={`Original: ${comparison.original}`} />
                            <div style={{backgroundColor: comparison.scanned, width: 24, height: 24, borderRadius: 4, border: '1px solid #777'}} title={`Scanned: ${comparison.scanned}`} />
                            <span className="text-xs whitespace-nowrap">
                              ΔR: {comparison.difference.r > 0 ? `+${comparison.difference.r}` : comparison.difference.r}<br />
                              ΔG: {comparison.difference.g > 0 ? `+${comparison.difference.g}` : comparison.difference.g}<br />
                              ΔB: {comparison.difference.b > 0 ? `+${comparison.difference.b}` : comparison.difference.b}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={createProfileFromComparison}
                      disabled={colorComparisons.length === 0}
                    >
                      Create Initial Profile from Differences
                    </Button>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>
            </TabsContent>
            
            <TabsContent value="profile-manager" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Color Profile Manager</h2>
                  <p className="text-muted-foreground">Create and manage color adjustment profiles for different print jobs.</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium mb-4">Color Adjustment Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Brightness</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.brightness]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.brightness}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Contrast</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.contrast]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, contrast: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.contrast}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Saturation</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.saturation]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, saturation: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.saturation}</span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-medium mt-8 mb-4">Channel Adjustments</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Red</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.red]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, red: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.red}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Green</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.green]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, green: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.green}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Blue</label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[adjustments.blue]}
                            onValueChange={([value]) => setAdjustments(prev => ({ ...prev, blue: value }))}
                            min={-50}
                            max={50}
                            step={1}
                          />
                          <span className="text-sm font-mono w-12 text-right">{adjustments.blue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-medium mb-4">Original</h3>
                      <div className="w-full h-32 rounded-lg border border-border" style={{ backgroundColor: selectedColor }} />
                      <div className="mt-2 text-sm font-mono">HEX: {selectedColor}</div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium mb-4">Adjusted (Print Preview)</h3>
                      <div className="w-full h-32 rounded-lg border border-border" style={{ backgroundColor: applyAdjustments(selectedColor) }} />
                      <div className="mt-2 text-sm font-mono">HEX: {applyAdjustments(selectedColor)}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-4">
                      <input
                        type="text"
                        placeholder="Profile Name"
                        className="w-full px-3 py-2 border rounded-md"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Device Name"
                        className="w-full px-3 py-2 border rounded-md"
                        value={newProfileDevice}
                        onChange={(e) => setNewProfileDevice(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSaveProfile}>Save Profile</Button>
                    <Button variant="secondary" onClick={handleResetAdjustments}>Reset Adjustments</Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-4">Saved Profiles</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left font-medium">Profile Name</th>
                          <th className="px-4 py-2 text-left font-medium">Device</th>
                          <th className="px-4 py-2 text-left font-medium">Created</th>
                          <th className="px-4 py-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {profiles.map(profile => (
                          <tr key={profile.id}>
                            <td className="px-4 py-2">{profile.name}</td>
                            <td className="px-4 py-2">{profile.device}</td>
                            <td className="px-4 py-2">{profile.created}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => handleLoadProfile(profile)}>
                                  Load
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default App
