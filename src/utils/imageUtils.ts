// Utility functions for image manipulation

export const resizeBase64Image = async (
  base64: string,
  size = 200
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context");
      ctx.fillStyle = "#FFF";
      ctx.fillRect(0, 0, size, size);
      // Draw image centered and scaled to fit
      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;
      if (img.width > img.height) {
        sx = (img.width - img.height) / 2;
        sw = sh = img.height;
      } else if (img.height > img.width) {
        sy = (img.height - img.width) / 2;
        sw = sh = img.width;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      const resizedBase64 = canvas.toDataURL("image/png").split(",")[1];
      resolve(resizedBase64);
    };
    img.onerror = reject;
    img.src = "data:image/png;base64," + base64;
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// SIMPLIFIED: Gets mouse or touch position relative to canvas in CSS pixels
// The canvas context scaling handles DPR conversion automatically
export const getCanvasPos = (
  canvas: HTMLCanvasElement,
  e: MouseEvent | TouchEvent
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  
  // Get the client coordinates
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

  // Return position in CSS pixels - let canvas context handle DPR scaling
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

// Converts a hex color string to an RGBA array [R, G, B, A]
export const hexToRgbA = (hex: string): [number, number, number, number] => {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = "0x" + c.join("");
    return [
      Number(c >> 16) & 255,
      Number(c >> 8) & 255,
      Number(c) & 255,
      255,
    ]; // Alpha channel is always 255 (fully opaque)
  }
  throw new Error("Invalid Hex color format");
};

// Gets the RGBA color of a pixel at (x, y) from an ImageData array
export const getPixelColor = (
  pixels: Uint8ClampedArray,
  x: number,
  y: number,
  width: number
): [number, number, number, number] => {
  const index = (y * width + x) * 4;
  return [
    pixels[index],
    pixels[index + 1],
    pixels[index + 2],
    pixels[index + 3],
  ];
};

// Sets the RGBA color of a pixel at (x, y) in an ImageData array
export const setPixelColor = (
  pixels: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  color: [number, number, number, number]
) => {
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3]; // Alpha
};

// Compares two RGBA colors with a given tolerance
export const colorsMatch = (
  color1: [number, number, number, number],
  color2: [number, number, number, number],
  tolerance = 10
): boolean => {
  return (
    Math.abs(color1[0] - color2[0]) <= tolerance &&
    Math.abs(color1[1] - color2[1]) <= tolerance &&
    Math.abs(color1[2] - color2[2]) <= tolerance &&
    Math.abs(color1[3] - color2[3]) <= tolerance
  );
};