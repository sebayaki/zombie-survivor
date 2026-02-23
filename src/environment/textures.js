import * as THREE from "three";

function createCanvas(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return { canvas, ctx: canvas.getContext("2d") };
}

export function createAsphaltTexture() {
  const size = 1024;
  const { canvas, ctx } = createCanvas(size);

  const imageData = ctx.createImageData(size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    d[i] = 38 + n;
    d[i + 1] = 38 + n;
    d[i + 2] = 42 + n;
    d[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  for (let i = 0; i < 6000; i++) {
    const b = 65 + Math.random() * 25;
    ctx.fillStyle = `rgba(${b},${b},${b + 3},0.35)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }

  ctx.lineCap = "round";
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    const segs = 5 + Math.floor(Math.random() * 6);
    for (let j = 0; j < segs; j++) {
      x += (Math.random() - 0.5) * 70;
      y += (Math.random() - 0.5) * 70;
      ctx.lineTo(x, y);
      if (Math.random() > 0.65) {
        ctx.lineTo(
          x + (Math.random() - 0.5) * 35,
          y + (Math.random() - 0.5) * 35,
        );
        ctx.moveTo(x, y);
      }
    }
    ctx.strokeStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      12 + Math.random() * 20,
      8 + Math.random() * 15,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = `rgba(22,22,26,${0.2 + Math.random() * 0.2})`;
    ctx.fill();
  }

  for (let i = 0; i < 4; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 12 + Math.random() * 20;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(18,12,28,0.25)");
    g.addColorStop(1, "rgba(20,20,25,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(50,50,52,0.06)";
  ctx.fillRect(size * 0.2, 0, size * 0.12, size);
  ctx.fillRect(size * 0.68, 0, size * 0.12, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createAsphaltBumpMap() {
  const size = 512;
  const { canvas, ctx } = createCanvas(size);

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4000; i++) {
    const v = 128 + ((Math.random() - 0.5) * 40) | 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const s = Math.random() * 3 + 0.5;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, s, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(40,40,40,0.5)";
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

export function createSidewalkTexture() {
  const size = 512;
  const { canvas, ctx } = createCanvas(size);

  const imageData = ctx.createImageData(size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    d[i] = 72 + n;
    d[i + 1] = 72 + n;
    d[i + 2] = 74 + n;
    d[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  const ps = size / 4;
  ctx.strokeStyle = "rgba(40,40,42,0.6)";
  ctx.lineWidth = 2;
  for (let x = ps; x < size; x += ps) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = ps; y < size; y += ps) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 8 + Math.random() * 15;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(50,48,52,0.2)");
    g.addColorStop(1, "rgba(60,58,62,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
