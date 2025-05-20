export function generateStandardSwatches() {
  return `
    <h2>Generate Color Swatch Chart</h2>
    <p>Create a custom color swatch chart to print on your ID cards.</p>
    
    <h3>Standard Color Swatches</h3>
    <div id="standard-swatches" class="color-grid">
      <!-- Row headers -->
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
      
      <!-- Row 1 - Primary Colors -->
      <div class="row-label">1</div>
      <div class="swatch" style="background-color: #000000;" data-color="#000000"></div>
      <div class="swatch" style="background-color: #FF0000;" data-color="#FF0000"></div>
      <div class="swatch" style="background-color: #00FF00;" data-color="#00FF00"></div>
      <div class="swatch" style="background-color: #0000FF;" data-color="#0000FF"></div>
      <div class="swatch" style="background-color: #FFFF00;" data-color="#FFFF00"></div>
      <div class="swatch" style="background-color: #FF00FF;" data-color="#FF00FF"></div>
      <div class="swatch" style="background-color: #00FFFF;" data-color="#00FFFF"></div>
      <div class="swatch" style="background-color: #FFFFFF;" data-color="#FFFFFF"></div>
      <div class="swatch" style="background-color: #FFC0CB;" data-color="#FFC0CB"></div>
      <div class="swatch" style="background-color: #A52A2A;" data-color="#A52A2A"></div>
      
      <!-- Row 2 - Grayscale -->
      <div class="row-label">2</div>
      <div class="swatch" style="background-color: #000000;" data-color="#000000"></div>
      <div class="swatch" style="background-color: #222222;" data-color="#222222"></div>
      <div class="swatch" style="background-color: #444444;" data-color="#444444"></div>
      <div class="swatch" style="background-color: #666666;" data-color="#666666"></div>
      <div class="swatch" style="background-color: #888888;" data-color="#888888"></div>
      <div class="swatch" style="background-color: #AAAAAA;" data-color="#AAAAAA"></div>
      <div class="swatch" style="background-color: #CCCCCC;" data-color="#CCCCCC"></div>
      <div class="swatch" style="background-color: #DDDDDD;" data-color="#DDDDDD"></div>
      <div class="swatch" style="background-color: #EEEEEE;" data-color="#EEEEEE"></div>
      <div class="swatch" style="background-color: #FFFFFF;" data-color="#FFFFFF"></div>
      
      <!-- Row 3 - Skin tones -->
      <div class="row-label">3</div>
      <div class="swatch" style="background-color: #8D5524;" data-color="#8D5524"></div>
      <div class="swatch" style="background-color: #C68642;" data-color="#C68642"></div>
      <div class="swatch" style="background-color: #E0AC69;" data-color="#E0AC69"></div>
      <div class="swatch" style="background-color: #F1C27D;" data-color="#F1C27D"></div>
      <div class="swatch" style="background-color: #FFDBAC;" data-color="#FFDBAC"></div>
      <div class="swatch" style="background-color: #F5F5DC;" data-color="#F5F5DC"></div>
      <div class="swatch" style="background-color: #FFE0BD;" data-color="#FFE0BD"></div>
      <div class="swatch" style="background-color: #FAD6A5;" data-color="#FAD6A5"></div>
      <div class="swatch" style="background-color: #EAC086;" data-color="#EAC086"></div>
      <div class="swatch" style="background-color: #D8A077;" data-color="#D8A077"></div>
      
      <!-- Row 4 - Red shades -->
      <div class="row-label">4</div>
      <div class="swatch" style="background-color: #FFCCCC;" data-color="#FFCCCC"></div>
      <div class="swatch" style="background-color: #FF9999;" data-color="#FF9999"></div>
      <div class="swatch" style="background-color: #FF6666;" data-color="#FF6666"></div>
      <div class="swatch" style="background-color: #FF3333;" data-color="#FF3333"></div>
      <div class="swatch" style="background-color: #FF0000;" data-color="#FF0000"></div>
      <div class="swatch" style="background-color: #CC0000;" data-color="#CC0000"></div>
      <div class="swatch" style="background-color: #990000;" data-color="#990000"></div>
      <div class="swatch" style="background-color: #800000;" data-color="#800000"></div>
      <div class="swatch" style="background-color: #660000;" data-color="#660000"></div>
      <div class="swatch" style="background-color: #330000;" data-color="#330000"></div>
    </div>
    
    <div class="color-picker">
      <h3>Custom Colors</h3>
      <p>Add specific colors you want to calibrate:</p>
      
      <div class="color-pair">
        <input type="color" id="custom-color" value="#4285f4" class="color-input">
        <div class="color-display" id="color-preview" style="background-color: #4285f4;"></div>
        <div class="color-info">
          <div>HEX: <span id="hex-value">#4285f4</span></div>
          <div>RGB: <span id="rgb-value">rgb(66, 133, 244)</span></div>
        </div>
        <button class="btn" id="add-color">Add to Chart</button>
      </div>
      
      <h3>Custom Grid</h3>
      <div id="custom-grid" class="color-grid">
        <!-- Will be filled with custom colors -->
      </div>
    </div>
    
    <div style="margin-top: 20px;">
      <button class="btn" id="download-svg">Download SVG</button>
      <button class="btn" id="download-pdf">Download PDF</button>
      <button class="btn" id="print-chart">Print Chart</button>
    </div>
  `;
} 