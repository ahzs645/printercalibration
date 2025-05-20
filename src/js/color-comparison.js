export function generateColorComparison() {
  return `
    <h2>Compare Original vs Printed Colors</h2>
    <p>Upload your scanned/photographed color chart to analyze differences.</p>
    
    <div class="upload-section">
      <p>Upload a photo or scan of your printed color chart</p>
      <input type="file" id="chart-upload" accept="image/*">
      <p><small>For best results, ensure good lighting and minimal glare</small></p>
    </div>
    
    <div class="comparison-grid">
      <div>
        <h3>Original Colors</h3>
        <div id="original-chart-preview" style="width: 100%; height: 300px; border: 1px solid #ccc;"></div>
      </div>
      <div>
        <h3>Scanned Colors</h3>
        <div id="scanned-chart-preview" style="width: 100%; height: 300px; border: 1px solid #ccc; display: flex; justify-content: center; align-items: center;">
          <p>Upload an image to see preview</p>
        </div>
      </div>
    </div>
    
    <div id="analysis-results" style="display: none;">
      <h3>Color Analysis Results</h3>
      <table id="color-analysis-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Original Color</th>
            <th>Printed Color</th>
            <th>Difference</th>
            <th>Suggested Adjustment</th>
          </tr>
        </thead>
        <tbody>
          <!-- Will be filled with analysis results -->
        </tbody>
      </table>
    </div>
  `;
}

export function analyzeColorDifferences(originalColors, scannedColors) {
  const differences = [];
  
  for (let i = 0; i < originalColors.length; i++) {
    const original = originalColors[i];
    const scanned = scannedColors[i];
    
    // Calculate color differences using the color library
    const originalColor = new Color(original);
    const scannedColor = new Color(scanned);
    
    const diff = {
      position: `${Math.floor(i / 10) + 1}-${(i % 10) + 1}`,
      original: original,
      printed: scanned,
      difference: calculateColorDifference(originalColor, scannedColor),
      adjustment: suggestAdjustment(originalColor, scannedColor)
    };
    
    differences.push(diff);
  }
  
  return differences;
}

function calculateColorDifference(original, scanned) {
  const lab1 = original.lab();
  const lab2 = scanned.lab();
  
  // Calculate Delta E using CIE76 formula
  const deltaL = lab2[0] - lab1[0];
  const deltaA = lab2[1] - lab1[1];
  const deltaB = lab2[2] - lab1[2];
  
  const deltaE = Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  
  // Convert to human-readable format
  if (deltaE < 1) {
    return "No perceptible difference";
  } else if (deltaE < 2) {
    return "Slight difference";
  } else if (deltaE < 5) {
    return "Moderate difference";
  } else {
    return "Significant difference";
  }
}

function suggestAdjustment(original, scanned) {
  const rgb1 = original.rgb().array();
  const rgb2 = scanned.rgb().array();
  
  const adjustments = [];
  
  // Calculate percentage differences for each channel
  const redDiff = ((rgb2[0] - rgb1[0]) / rgb1[0]) * 100;
  const greenDiff = ((rgb2[1] - rgb1[1]) / rgb1[1]) * 100;
  const blueDiff = ((rgb2[2] - rgb1[2]) / rgb1[2]) * 100;
  
  if (Math.abs(redDiff) > 5) {
    adjustments.push(`Adjust red by ${-redDiff.toFixed(1)}%`);
  }
  if (Math.abs(greenDiff) > 5) {
    adjustments.push(`Adjust green by ${-greenDiff.toFixed(1)}%`);
  }
  if (Math.abs(blueDiff) > 5) {
    adjustments.push(`Adjust blue by ${-blueDiff.toFixed(1)}%`);
  }
  
  return adjustments.join(", ");
} 