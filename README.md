# PVC ID Card Color Calibration System

A web-based tool for calibrating colors when printing on PVC ID cards using inkjet printers. This system helps achieve accurate color reproduction by creating and managing custom color profiles.

## Features

- Generate color swatch charts for calibration
- Compare original digital colors with printed results
- Create and manage color adjustment profiles
- Real-time color adjustment preview
- Export calibration data for use in design software

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Generate a color swatch chart using the "Generate Swatch Chart" tab
2. Print the chart on your ID card printer with color management turned OFF
3. Take a photo or scan of the printed swatch card in good lighting
4. Upload the scanned image to compare original vs printed colors
5. Create and save color adjustment profiles
6. Apply these profiles to your ID card designs

## Technical Details

- Built with HTML5, CSS3, and JavaScript
- Uses modern web APIs for color manipulation
- Supports export to SVG and PDF formats
- Compatible with standard PVC ID card sizes (CR80)

## Contributing

Feel free to submit issues and enhancement requests! 