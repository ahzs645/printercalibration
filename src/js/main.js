import Color from 'color';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateStandardSwatches } from './swatch-generator.js';
import { generateColorComparison, analyzeColorDifferences } from './color-comparison.js';
import { generateProfileManager, applyColorAdjustments, saveProfile, loadProfiles, deleteProfile } from './profile-manager.js';

// Initialize tab content
document.getElementById('swatch-generator').innerHTML = generateStandardSwatches();
document.getElementById('color-comparison').innerHTML = generateColorComparison();
document.getElementById('profile-manager').innerHTML = generateProfileManager();

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});

// Color picker functionality
const customColor = document.getElementById('custom-color');
const colorPreview = document.getElementById('color-preview');
const hexValue = document.getElementById('hex-value');
const rgbValue = document.getElementById('rgb-value');

if (customColor && colorPreview && hexValue && rgbValue) {
  customColor.addEventListener('input', () => {
    const color = customColor.value;
    colorPreview.style.backgroundColor = color;
    hexValue.textContent = color;
    
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    rgbValue.textContent = `rgb(${r}, ${g}, ${b})`;
  });
}

// Adjustment sliders functionality
const sliders = ['brightness', 'contrast', 'saturation', 'red', 'green', 'blue'];
sliders.forEach(slider => {
  const input = document.getElementById(slider);
  const value = document.getElementById(`${slider}-value`);
  
  if (input && value) {
    input.addEventListener('input', () => {
      value.textContent = input.value;
      updateAdjustedPreview();
    });
  }
});

// Function to update the adjusted preview
function updateAdjustedPreview() {
  const originalPreview = document.getElementById('original-preview');
  const adjustedPreview = document.getElementById('adjusted-preview');
  const originalHex = document.getElementById('original-hex');
  const adjustedHex = document.getElementById('adjusted-hex');
  
  if (!originalPreview || !adjustedPreview || !originalHex || !adjustedHex) return;
  
  const originalColor = originalPreview.style.backgroundColor;
  const adjustments = {
    brightness: parseInt(document.getElementById('brightness')?.value || 0),
    contrast: parseInt(document.getElementById('contrast')?.value || 0),
    saturation: parseInt(document.getElementById('saturation')?.value || 0),
    red: parseInt(document.getElementById('red')?.value || 0),
    green: parseInt(document.getElementById('green')?.value || 0),
    blue: parseInt(document.getElementById('blue')?.value || 0)
  };
  
  const adjustedColor = applyColorAdjustments(originalColor, adjustments);
  adjustedPreview.style.backgroundColor = adjustedColor;
  adjustedHex.textContent = adjustedColor.toUpperCase();
}

// Initialize the adjusted preview
const originalPreview = document.getElementById('original-preview');
const originalHex = document.getElementById('original-hex');
if (originalPreview && originalHex) {
  originalPreview.style.backgroundColor = '#4285F4';
  originalHex.textContent = '#4285F4';
  updateAdjustedPreview();
}

// Reset adjustments button
const resetButton = document.getElementById('reset-adjustments');
if (resetButton) {
  resetButton.addEventListener('click', () => {
    sliders.forEach(slider => {
      const input = document.getElementById(slider);
      const value = document.getElementById(`${slider}-value`);
      if (input && value) {
        input.value = 0;
        value.textContent = '0';
      }
    });
    updateAdjustedPreview();
  });
}

// Add to chart button
let customColorCount = 0;
const addColorButton = document.getElementById('add-color');
if (addColorButton) {
  addColorButton.addEventListener('click', () => {
    if (customColorCount < 10) {
      const color = customColor.value;
      const customGrid = document.getElementById('custom-grid');
      
      if (customGrid) {
        if (customColorCount === 0) {
          customGrid.innerHTML = `
            <div class="row-label"></div>
            <div class="col-label">1</div>
            <div class="col-label">2</div>
            <div class="col-label">3</div>
            <div class="col-label">4</div>
            <div class="col-label">5</div>
            <div class="col-label">6</div>
            <div class="col-label">7</div>
            <div class="col-label">8</div>
            <div class="col-label">9</div>
            <div class="col-label">10</div>
          `;
        }
        
        const row = Math.floor(customColorCount / 10) + 1;
        const col = (customColorCount % 10) + 1;
        
        if (col === 1) {
          customGrid.innerHTML += `<div class="row-label">C${row}</div>`;
        }
        
        customGrid.innerHTML += `<div class="swatch" style="background-color: ${color};" data-color="${color}"></div>`;
        
        customColorCount++;
      }
    } else {
      alert('You can add up to 10 custom colors.');
    }
  });
}

// File upload preview
const chartUpload = document.getElementById('chart-upload');
if (chartUpload) {
  chartUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        
        const preview = document.getElementById('scanned-chart-preview');
        if (preview) {
          preview.innerHTML = '';
          preview.appendChild(img);
        }
        
        const analysisResults = document.getElementById('analysis-results');
        if (analysisResults) {
          analysisResults.style.display = 'block';
        }
        
        // In a real implementation, this would analyze the uploaded image
        // and compare it with the original colors
        const tableBody = document.getElementById('color-analysis-table')?.querySelector('tbody');
        if (tableBody) {
          tableBody.innerHTML = `
            <tr>
              <td>1-1</td>
              <td style="background-color: #000000; color: white;">#000000</td>
              <td style="background-color: #1A1A1A; color: white;">#1A1A1A</td>
              <td>+26 lightness</td>
              <td>Reduce brightness by 10%</td>
            </tr>
            <tr>
              <td>1-2</td>
              <td style="background-color: #FF0000;">#FF0000</td>
              <td style="background-color: #E60000;">#E60000</td>
              <td>-10% saturation</td>
              <td>Increase red channel by 15%</td>
            </tr>
            <tr>
              <td>1-3</td>
              <td style="background-color: #00FF00;">#00FF00</td>
              <td style="background-color: #00E600;">#00E600</td>
              <td>-10% brightness</td>
              <td>Increase green channel by 10%</td>
            </tr>
            <tr>
              <td>2-1</td>
              <td style="background-color: #000000; color: white;">#000000</td>
              <td style="background-color: #1A1A1A; color: white;">#1A1A1A</td>
              <td>+26 lightness</td>
              <td>Reduce brightness by 10%</td>
            </tr>
            <tr>
              <td>3-5</td>
              <td style="background-color: #FFDBAC;">#FFDBAC</td>
              <td style="background-color: #F5D1A2;">#F5D1A2</td>
              <td>Brownish tint</td>
              <td>Reduce red by 5%, increase blue by 8%</td>
            </tr>
          `;
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// Download buttons
const downloadSvg = document.getElementById('download-svg');
const downloadPdf = document.getElementById('download-pdf');
const printChart = document.getElementById('print-chart');

if (downloadSvg) {
  downloadSvg.addEventListener('click', () => {
    alert('In a real implementation, this would download the color chart as an SVG file.');
  });
}

if (downloadPdf) {
  downloadPdf.addEventListener('click', async () => {
    const element = document.querySelector('.color-grid');
    if (element) {
      const canvas = await html2canvas(element);
      const pdf = new jsPDF();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0);
      pdf.save('color-chart.pdf');
    }
  });
}

if (printChart) {
  printChart.addEventListener('click', () => {
    window.print();
  });
}

// Save profile button
const saveProfileButton = document.getElementById('save-profile');
if (saveProfileButton) {
  saveProfileButton.addEventListener('click', () => {
    const profileName = prompt('Enter a name for this profile:');
    if (profileName) {
      const adjustments = {
        brightness: parseInt(document.getElementById('brightness')?.value || 0),
        contrast: parseInt(document.getElementById('contrast')?.value || 0),
        saturation: parseInt(document.getElementById('saturation')?.value || 0),
        red: parseInt(document.getElementById('red')?.value || 0),
        green: parseInt(document.getElementById('green')?.value || 0),
        blue: parseInt(document.getElementById('blue')?.value || 0)
      };
      
      const profile = saveProfile(profileName, adjustments);
      updateProfilesTable();
      alert('Profile saved successfully!');
    }
  });
}

// Update profiles table
function updateProfilesTable() {
  const tableBody = document.getElementById('profiles-table')?.querySelector('tbody');
  if (tableBody) {
    const profiles = loadProfiles();
    tableBody.innerHTML = profiles.map(profile => `
      <tr>
        <td>${profile.name}</td>
        <td>${profile.device}</td>
        <td>${profile.created}</td>
        <td>
          <button class="btn" style="padding: 3px 8px; font-size: 12px;" onclick="loadProfile('${profile.name}')">Load</button>
          <button class="btn" style="padding: 3px 8px; font-size: 12px; background-color: #f44336;" onclick="deleteProfile('${profile.name}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }
}

// Initialize profiles table
updateProfilesTable(); 