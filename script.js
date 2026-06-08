// script.js – Handles image uploads, canvas drawing, drag & drop, and download

// Global state
let baseImage = null; // HTMLImageElement for the background
let stickerImage = null; // HTMLImageElement for the sticker
let stickerPos = { x: 0, y: 0 }; // Top‑left corner of the sticker on the canvas
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

// ------------------------------------------------------------
// Utility: Fit an image inside the canvas while preserving aspect ratio
function drawImageFit(img) {
  const canvasRatio = canvas.width / canvas.height;
  const imgRatio = img.width / img.height;
  let drawWidth, drawHeight, offsetX, offsetY;
  if (imgRatio > canvasRatio) {
    // Image is wider than canvas
    drawWidth = canvas.width;
    drawHeight = drawWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2;
  } else {
    // Image is taller than canvas
    drawHeight = canvas.height;
    drawWidth = drawHeight * imgRatio;
    offsetY = 0;
    offsetX = (canvas.width - drawWidth) / 2;
  }
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  return { offsetX, offsetY, drawWidth, drawHeight };
}

// ------------------------------------------------------------
// Redraw the whole canvas – base image + sticker at current position
function renderCanvas() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (baseImage) {
    // Draw base image scaled to fit the canvas
    drawImageFit(baseImage);
  }

  if (stickerImage) {
    // If sticker position not yet set, centre it
    if (!stickerPos.initialised) {
      const centreX = (canvas.width - stickerImage.width) / 2;
      const centreY = (canvas.height - stickerImage.height) / 2;
      stickerPos = { x: centreX, y: centreY, initialised: true };
    }
    ctx.drawImage(stickerImage, stickerPos.x, stickerPos.y);
  }
}

// ------------------------------------------------------------
// File input handlers
function handleBaseUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      baseImage = img;
      // Reset sticker position (centre) whenever a new base image is loaded
      stickerPos = { x: 0, y: 0, initialised: false };
      renderCanvas();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleStickerUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      stickerImage = img;
      // Reset position to centre of canvas (or of base image if already drawn)
      stickerPos = { x: 0, y: 0, initialised: false };
      renderCanvas();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ------------------------------------------------------------
// Drag‑and‑drop logic for the sticker
canvas.addEventListener('mousedown', e => {
  if (!stickerImage) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  // Simple hit‑test: is the mouse inside the sticker bounds?
  if (
    mouseX >= stickerPos.x &&
    mouseX <= stickerPos.x + stickerImage.width &&
    mouseY >= stickerPos.y &&
    mouseY <= stickerPos.y + stickerImage.height
  ) {
    isDragging = true;
    dragOffset.x = mouseX - stickerPos.x;
    dragOffset.y = mouseY - stickerPos.y;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  stickerPos.x = mouseX - dragOffset.x;
  stickerPos.y = mouseY - dragOffset.y;
  renderCanvas();
});

canvas.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    canvas.style.cursor = 'default';
  }
});
canvas.addEventListener('mouseleave', () => {
  if (isDragging) {
    isDragging = false;
    canvas.style.cursor = 'default';
  }
});

// ------------------------------------------------------------
// Download combined image
function downloadCombined() {
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'combined.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ------------------------------------------------------------
// Wire up UI controls
document.getElementById('baseInput').addEventListener('change', handleBaseUpload);
document.getElementById('stickerInput').addEventListener('change', handleStickerUpload);
document.getElementById('downloadBtn').addEventListener('click', downloadCombined);

// Initial canvas styling – show a helpful placeholder until images are loaded
ctx.fillStyle = '#00000033';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.font = '16px Inter, sans-serif';
ctx.fillStyle = '#fff';
ctx.textAlign = 'center';
ctx.fillText('Upload images to start', canvas.width / 2, canvas.height / 2);
