import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from 'three';

const ANISOTROPY = 8;

function drawingContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('Não foi possível criar o contexto 2D para as texturas 3D.');
  }
  return context;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function repeating(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = ANISOTROPY;
  return texture;
}

export function createMeshAlphaTexture(
  panelWidth: number,
  height: number,
  wireSpacingX: number,
  wireSpacingY: number,
): CanvasTexture {
  const canvas = createCanvas(64, 128);
  const context = drawingContext(canvas);
  context.fillStyle = '#1a1a1a';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, 10, canvas.height);
  context.fillRect(0, 0, canvas.width, 8);

  const texture = repeating(canvas);
  texture.repeat.set(panelWidth / wireSpacingX, height / wireSpacingY);
  return texture;
}

export function createLawnTexture(repeatX: number, repeatY: number): CanvasTexture {
  const canvas = createCanvas(256, 256);
  const context = drawingContext(canvas);
  const random = seededRandom(7);
  context.fillStyle = '#93a483';
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let blade = 0; blade < 2800; blade++) {
    const light = random() > 0.5;
    const alpha = 0.05 + random() * 0.09;
    context.fillStyle = light ? `rgba(255, 255, 230, ${alpha})` : `rgba(45, 75, 35, ${alpha})`;
    context.fillRect(
      random() * canvas.width,
      random() * canvas.height,
      1 + random() * 2,
      3 + random() * 5,
    );
  }

  const texture = repeating(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

export function createPavingTexture(repeatX: number): CanvasTexture {
  const canvas = createCanvas(256, 128);
  const context = drawingContext(canvas);
  const random = seededRandom(21);
  context.fillStyle = '#d8d8d3';
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let speck = 0; speck < 900; speck++) {
    const dark = random() > 0.5;
    const alpha = 0.04 + random() * 0.08;
    context.fillStyle = dark ? `rgba(70, 70, 65, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    context.fillRect(
      random() * canvas.width,
      random() * canvas.height,
      1 + random() * 2,
      1 + random() * 2,
    );
  }

  context.fillStyle = 'rgba(55, 55, 50, 0.55)';
  context.fillRect(canvas.width / 2 - 1, 0, 2, canvas.height);
  context.fillStyle = 'rgba(0, 0, 0, 0.14)';
  context.fillRect(0, 0, canvas.width, 1);
  context.fillRect(0, canvas.height - 1, canvas.width, 1);

  const texture = repeating(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.repeat.set(repeatX, 1);
  return texture;
}
