// Lightweight mouse trail effect
let mouseTrailCanvas, mouseTrailCtx;
let mouseTrailPoints = [];
let mouseTrailAnimationId = null;
let lastMousePosition = { x: 0, y: 0 };
let lastTrailTime = 0;

// Initialize mouse trail
function initMouseTrail() {
    console.log("Initializing mouse trail...");
    
    // Create canvas element
    mouseTrailCanvas = document.createElement('canvas');
    mouseTrailCanvas.className = 'mouse-trail-canvas';
    mouseTrailCanvas.style.position = 'absolute';
    mouseTrailCanvas.style.top = '0';
    mouseTrailCanvas.style.left = '0';
    mouseTrailCanvas.style.width = '100%';
    mouseTrailCanvas.style.height = '100%';
    mouseTrailCanvas.style.pointerEvents = 'none';
    mouseTrailCanvas.style.zIndex = '20';
    
    // Add to game area
    document.getElementById('game-area').appendChild(mouseTrailCanvas);
    
    // Get context and set size
    mouseTrailCtx = mouseTrailCanvas.getContext('2d', { alpha: true });
    resizeMouseTrailCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeMouseTrailCanvas);
    
    // Add mouse move listener
    document.getElementById('game-area').addEventListener('mousemove', handleMouseTrailMove);
    document.getElementById('game-area').addEventListener('touchmove', handleTouchTrailMove, { passive: true });
    
    // Start animation loop
    mouseTrailAnimationId = requestAnimationFrame(renderMouseTrail);
    
    console.log("Mouse trail initialized");
}

// Resize mouse trail canvas
function resizeMouseTrailCanvas() {
    if (!mouseTrailCanvas) return;
    
    const gameArea = document.getElementById('game-area');
    const rect = gameArea.getBoundingClientRect();
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    mouseTrailCanvas.width = rect.width * dpr;
    mouseTrailCanvas.height = rect.height * dpr;
    mouseTrailCtx.scale(dpr, dpr);
    mouseTrailCanvas.style.width = `${rect.width}px`;
    mouseTrailCanvas.style.height = `${rect.height}px`;
}

// Handle mouse movement
function handleMouseTrailMove(e) {
    const rect = mouseTrailCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * (mouseTrailCanvas.width / rect.width / dpr);
    const y = (e.clientY - rect.top) * (mouseTrailCanvas.height / rect.height / dpr);
    
    // Only add points at certain intervals to avoid too many points
    const currentTime = performance.now();
    if (currentTime - lastTrailTime > 30) { // Throttle to 30ms
        addTrailPoint(x, y);
        lastTrailTime = currentTime;
    }
    
    lastMousePosition = { x, y };
}

// Handle touch movement
function handleTouchTrailMove(e) {
    if (e.touches && e.touches[0]) {
        const rect = mouseTrailCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (e.touches[0].clientX - rect.left) * (mouseTrailCanvas.width / rect.width / dpr);
        const y = (e.touches[0].clientY - rect.top) * (mouseTrailCanvas.height / rect.height / dpr);
        
        // Only add points at certain intervals to avoid too many points
        const currentTime = performance.now();
        if (currentTime - lastTrailTime > 50) { // Throttle more on touch devices
            addTrailPoint(x, y);
            lastTrailTime = currentTime;
        }
        
        lastMousePosition = { x, y };
    }
}

// Add a point to the trail
function addTrailPoint(x, y) {
    mouseTrailPoints.push({
        x: x,
        y: y,
        size: 5,
        opacity: 0.7,
        life: 15
    });
    
    // Limit the number of points to avoid performance issues
    if (mouseTrailPoints.length > 10) {
        mouseTrailPoints.shift();
    }
}

// Render mouse trail
function renderMouseTrail() {
    if (!mouseTrailCtx || !mouseTrailCanvas) return;
    
    // Clear canvas with transparent fill
    mouseTrailCtx.clearRect(0, 0, mouseTrailCanvas.width, mouseTrailCanvas.height);
    
    // Update and draw trail points
    for (let i = mouseTrailPoints.length - 1; i >= 0; i--) {
        const point = mouseTrailPoints[i];
        
        // Decrease life
        point.life--;
        point.opacity *= 0.9;
        point.size *= 0.95;
        
        // Remove dead points
        if (point.life <= 0) {
            mouseTrailPoints.splice(i, 1);
            continue;
        }
        
        // Draw point
        mouseTrailCtx.beginPath();
        mouseTrailCtx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        mouseTrailCtx.fillStyle = `rgba(76, 175, 80, ${point.opacity})`;
        mouseTrailCtx.fill();
    }
    
    // Draw cursor dot at current position
    mouseTrailCtx.beginPath();
    mouseTrailCtx.arc(lastMousePosition.x, lastMousePosition.y, 3, 0, Math.PI * 2);
    mouseTrailCtx.fillStyle = 'rgba(76, 175, 80, 0.9)';
    mouseTrailCtx.fill();
    
    // Continue animation loop
    mouseTrailAnimationId = requestAnimationFrame(renderMouseTrail);
}

// Clean up resources
function cleanupMouseTrail() {
    if (mouseTrailAnimationId) {
        cancelAnimationFrame(mouseTrailAnimationId);
        mouseTrailAnimationId = null;
    }
    
    if (mouseTrailCanvas && mouseTrailCanvas.parentNode) {
        mouseTrailCanvas.parentNode.removeChild(mouseTrailCanvas);
    }
    
    mouseTrailCanvas = null;
    mouseTrailCtx = null;
    mouseTrailPoints = [];
}

// Export functions for use in other files
window.initMouseTrail = initMouseTrail;
window.cleanupMouseTrail = cleanupMouseTrail;
