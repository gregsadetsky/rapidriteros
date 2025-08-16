export const renderToCanvas = (canvasId: string, base64Data: string) => {
  try {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Decode base64 to binary data
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create ImageData for 96x38 1-bit display
    const imageData = ctx.createImageData(96, 38);
    const data = imageData.data;
    
    // Convert 1-bit data to RGBA
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      for (let bit = 0; bit < 8; bit++) {
        const pixelIndex = i * 8 + bit;
        const x = pixelIndex % 96;
        const y = Math.floor(pixelIndex / 96);
        
        if (x < 96 && y < 38) {
          const rgbaIndex = (y * 96 + x) * 4;
          const isOn = (byte >> (7 - bit)) & 1;
          const color = isOn ? 255 : 0;
          
          data[rgbaIndex] = color;
          data[rgbaIndex + 1] = color;
          data[rgbaIndex + 2] = color;
          data[rgbaIndex + 3] = 255;
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  } catch (err) {
    console.error('Error rendering canvas:', err);
  }
};