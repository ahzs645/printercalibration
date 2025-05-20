export function generateProfileManager() {
  return `
    <h2>Color Profile Manager</h2>
    <p>Create and manage color adjustment profiles for different print jobs.</p>
    
    <div class="color-adjustment">
      <h3>Color Adjustment Settings</h3>
      
      <div class="color-adjustment">
        <label for="brightness">Brightness:</label>
        <div class="slider-container">
          <input type="range" id="brightness" min="-50" max="50" value="0">
          <span id="brightness-value">0</span>
        </div>
      </div>
      
      <div class="color-adjustment">
        <label for="contrast">Contrast:</label>
        <div class="slider-container">
          <input type="range" id="contrast" min="-50" max="50" value="0">
          <span id="contrast-value">0</span>
        </div>
      </div>
      
      <div class="color-adjustment">
        <label for="saturation">Saturation:</label>
        <div class="slider-container">
          <input type="range" id="saturation" min="-50" max="50" value="0">
          <span id="saturation-value">0</span>
        </div>
      </div>
      
      <h3>Channel Adjustments</h3>
      
      <div class="color-adjustment">
        <label for="red">Red:</label>
        <div class="slider-container">
          <input type="range" id="red" min="-50" max="50" value="0">
          <span id="red-value">0</span>
        </div>
      </div>
      
      <div class="color-adjustment">
        <label for="green">Green:</label>
        <div class="slider-container">
          <input type="range" id="green" min="-50" max="50" value="0">
          <span id="green-value">0</span>
        </div>
      </div>
      
      <div class="color-adjustment">
        <label for="blue">Blue:</label>
        <div class="slider-container">
          <input type="range" id="blue" min="-50" max="50" value="0">
          <span id="blue-value">0</span>
        </div>
      </div>
    </div>
    
    <div class="preview-compare">
      <div class="preview-block">
        <h3>Original</h3>
        <div class="preview-box" id="original-preview" style="background-color: #4285f4;"></div>
        <div>HEX: <span id="original-hex">#4285f4</span></div>
      </div>
      
      <div class="preview-block">
        <h3>Adjusted (Print Preview)</h3>
        <div class="preview-box" id="adjusted-preview" style="background-color: #4285f4;"></div>
        <div>HEX: <span id="adjusted-hex">#4285f4</span></div>
      </div>
    </div>
    
    <div style="margin-top: 20px;">
      <button class="btn" id="save-profile">Save Profile</button>
      <button class="btn" id="reset-adjustments">Reset Adjustments</button>
    </div>
    
    <div style="margin-top: 30px;">
      <h3>Saved Profiles</h3>
      <table id="profiles-table">
        <thead>
          <tr>
            <th>Profile Name</th>
            <th>Device</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Will be filled with saved profiles -->
        </tbody>
      </table>
    </div>
  `;
}

export function applyColorAdjustments(color, adjustments) {
  const colorObj = new Color(color);
  
  // Apply brightness
  if (adjustments.brightness) {
    const brightness = 1 + (adjustments.brightness / 100);
    colorObj.lighten(brightness);
  }
  
  // Apply contrast
  if (adjustments.contrast) {
    const contrast = 1 + (adjustments.contrast / 100);
    const rgb = colorObj.rgb().array();
    rgb[0] = Math.min(255, Math.max(0, (rgb[0] - 128) * contrast + 128));
    rgb[1] = Math.min(255, Math.max(0, (rgb[1] - 128) * contrast + 128));
    rgb[2] = Math.min(255, Math.max(0, (rgb[2] - 128) * contrast + 128));
    colorObj.rgb(rgb);
  }
  
  // Apply saturation
  if (adjustments.saturation) {
    const saturation = 1 + (adjustments.saturation / 100);
    colorObj.saturate(saturation);
  }
  
  // Apply channel adjustments
  if (adjustments.red || adjustments.green || adjustments.blue) {
    const rgb = colorObj.rgb().array();
    if (adjustments.red) {
      rgb[0] = Math.min(255, Math.max(0, rgb[0] + adjustments.red));
    }
    if (adjustments.green) {
      rgb[1] = Math.min(255, Math.max(0, rgb[1] + adjustments.green));
    }
    if (adjustments.blue) {
      rgb[2] = Math.min(255, Math.max(0, rgb[2] + adjustments.blue));
    }
    colorObj.rgb(rgb);
  }
  
  return colorObj.hex();
}

export function saveProfile(name, adjustments) {
  const profile = {
    name,
    device: 'Canon TS705', // This could be made dynamic
    created: new Date().toLocaleDateString(),
    adjustments
  };
  
  // In a real implementation, this would save to a database or local storage
  const profiles = JSON.parse(localStorage.getItem('colorProfiles') || '[]');
  profiles.push(profile);
  localStorage.setItem('colorProfiles', JSON.stringify(profiles));
  
  return profile;
}

export function loadProfiles() {
  // In a real implementation, this would load from a database or local storage
  return JSON.parse(localStorage.getItem('colorProfiles') || '[]');
}

export function deleteProfile(profileName) {
  const profiles = JSON.parse(localStorage.getItem('colorProfiles') || '[]');
  const updatedProfiles = profiles.filter(p => p.name !== profileName);
  localStorage.setItem('colorProfiles', JSON.stringify(updatedProfiles));
} 