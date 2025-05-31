// Canvas-based background effects
let bgCanvas, bgCtx;
let dots = [];
let trailParticles = [];
let bgMousePosition = { x: 0, y: 0 };
let lastMouseMoveTime = 0;
let bgAnimationFrameId = null;
let bgLastFrameTime = 0;

// Initialize background canvas
function initBackground() {
    console.log("Initializing background...");
    
    // Create canvas element
    bgCanvas = document.createElement('canvas');
    bgCanvas.className = 'background-canvas';
    bgCanvas.style.position = 'absolute';
    bgCanvas.style.top = '0';
    bgCanvas.style.left = '0';
    bgCanvas.style.width = '100%';
    bgCanvas.style.height = '100%';
    bgCanvas.style.zIndex = '1';
    
    // Add to game area
    document.getElementById('game-area').appendChild(bgCanvas);
    
    // Get context and set size
    bgCtx = bgCanvas.getContext('2d');
    resizeBackgroundCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeBackgroundCanvas);
    
    // Create dot grid
    createDotGrid();
    
    // Add mouse move event listener
    bgCanvas.addEventListener('mousemove', handleBgMouseMove);
    bgCanvas.addEventListener('touchmove', handleBgTouchMove, { passive: true });
    
    // Start animation loop
    bgLastFrameTime = performance.now();
    bgAnimationFrameId = requestAnimationFrame(renderBackground);
    
    console.log("Background initialized with canvas dimensions:", bgCanvas.width, bgCanvas.height);
}

// Resize background canvas
function resizeBackgroundCanvas() {
    if (!bgCanvas) return;
    
    const gameArea = document.getElementById('game-area');
    const rect = gameArea.getBoundingClientRect();
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    bgCanvas.width = rect.width * dpr;
    bgCanvas.height = rect.height * dpr;
    bgCtx.scale(dpr, dpr);
    bgCanvas.style.width = `${rect.width}px`;
    bgCanvas.style.height = `${rect.height}px`;
    
    // Recreate dot grid after resize
    createDotGrid();
}

// Create dot grid
function createDotGrid() {
    // Clear existing dots
    dots = [];
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth < 768;
    
    // Calculate dot spacing based on device
    const dotSpacing = isMobile ? 80 : 40;
    const dotSize = 4;
    
    // Calculate number of dots
    const cols = Math.floor(bgCanvas.width / dotSpacing);
    const rows = Math.floor(bgCanvas.height / dotSpacing);
    
    // Create dots - limit the number for better performance
    const maxDots = isMobile ? 120 : 300;
    const skipFactor = Math.max(1, Math.floor((rows * cols) / maxDots));
    
    for (let row = 0; row < rows; row += skipFactor) {
        for (let col = 0; col < cols; col += skipFactor) {
            const x = col * dotSpacing + (dotSpacing / 2);
            const y = row * dotSpacing + (dotSpacing / 2);
            
            dots.push({
                x: x,
                y: y,
                size: dotSize,
                active: false,
                opacity: 0
            });
            
            if (dots.length >= maxDots) break;
        }
        if (dots.length >= maxDots) break;
    }
    
    console.log("Created dot grid with", dots.length, "dots");
}

// Handle mouse movement
function handleBgMouseMove(e) {
    const currentTime = Date.now();
    const rect = bgCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Update mouse position
    bgMousePosition.x = (e.clientX - rect.left) * (bgCanvas.width / rect.width / dpr);
    bgMousePosition.y = (e.clientY - rect.top) * (bgCanvas.height / rect.height / dpr);
    
    // Create trail particles with throttling
    if (currentTime - lastMouseMoveTime > 30) {
        lastMouseMoveTime = currentTime;
        createTrailParticle();
    }
}

// Handle touch movement
function handleBgTouchMove(e) {
    const currentTime = Date.now();
    
    if (e.touches && e.touches[0]) {
        const rect = bgCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Update mouse position
        bgMousePosition.x = (e.touches[0].clientX - rect.left) * (bgCanvas.width / rect.width / dpr);
        bgMousePosition.y = (e.touches[0].clientY - rect.top) * (bgCanvas.height / rect.height / dpr);
        
        // Create trail particles with throttling
        if (currentTime - lastMouseMoveTime > 60) {
            lastMouseMoveTime = currentTime;
            createTrailParticle();
        }
    }
}

// Create trail particle
function createTrailParticle() {
    // Check if game is running
    if (!window.gameRunning) return;
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth < 768;
    
    // On mobile, create fewer particles
    if (isMobile && Math.random() > 0.5) return;
    
    // Random size
    const size = 3 + Math.random() * 5;
    
    // Random color variation
    const hue = 120 + Math.floor(Math.random() * 40 - 20); // Green with variation
    
    trailParticles.push({
        x: bgMousePosition.x,
        y: bgMousePosition.y,
        size: size,
        color: `hsla(${hue}, 70%, 50%, 0.7)`,
        life: isMobile ? 30 : 60,
        maxLife: isMobile ? 30 : 60
    });
}

// Main render loop for background
function renderBackground(timestamp) {
    if (!bgCtx || !bgCanvas) return;
    
    // Calculate delta time for smooth animations
    const currentTime = timestamp || performance.now();
    const deltaTime = currentTime - bgLastFrameTime;
    bgLastFrameTime = currentTime;
    
    // Clear canvas
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Draw dot grid
    drawDotGrid();
    
    // Update and draw trail particles
    updateTrailParticles(deltaTime);
    
    // Continue animation loop
    bgAnimationFrameId = requestAnimationFrame(renderBackground);
}

// Draw dot grid
function drawDotGrid() {
    // Check if game is running
    const gameRunning = window.gameRunning;
    
    // Draw each dot
    for (const dot of dots) {
        // Skip inactive dots when game is not running
        if (!gameRunning && !dot.active) continue;
        
        // Calculate distance to mouse
        const dx = dot.x - bgMousePosition.x;
        const dy = dot.y - bgMousePosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Activate dots near the mouse
        const radius = 100;
        if (distance < radius) {
            // The closer to the center, the more intense the glow
            const intensity = 1 - (distance / radius);
            dot.active = true;
            dot.opacity = intensity;
        } else {
            // Gradually fade out
            if (dot.active) {
                dot.opacity -= 0.05;
                if (dot.opacity <= 0) {
                    dot.active = false;
                    dot.opacity = 0;
                }
            }
        }
        
        // Draw dot
        if (gameRunning || dot.active) {
            bgCtx.fillStyle = dot.active ? 
                `rgba(76, 175, 80, ${dot.opacity})` : 
                'rgba(17, 17, 17, 1)';
            
            bgCtx.beginPath();
            bgCtx.arc(dot.x, dot.y, dot.size / 2, 0, Math.PI * 2);
            bgCtx.fill();
            
            // Add glow for active dots
            if (dot.active) {
                bgCtx.shadowBlur = 10;
                bgCtx.shadowColor = 'rgba(76, 175, 80, 0.5)';
                bgCtx.beginPath();
                bgCtx.arc(dot.x, dot.y, dot.size / 2, 0, Math.PI * 2);
                bgCtx.fill();
                bgCtx.shadowBlur = 0;
            }
        }
    }
}

// Update and draw trail particles
function updateTrailParticles(deltaTime) {
    // Normalize speed based on frame rate
    const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
    
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const particle = trailParticles[i];
        
        // Decrease life
        particle.life -= speedFactor;
        
        // Remove dead particles
        if (particle.life <= 0) {
            trailParticles.splice(i, 1);
            continue;
        }
        
        // Calculate opacity based on remaining life
        const opacity = particle.life / particle.maxLife;
        
        // Draw particle
        bgCtx.globalAlpha = opacity;
        bgCtx.fillStyle = particle.color;
        bgCtx.beginPath();
        bgCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.globalAlpha = 1;
    }
}

// Clean up resources
function cleanupBackground() {
    if (bgAnimationFrameId) {
        cancelAnimationFrame(bgAnimationFrameId);
        bgAnimationFrameId = null;
    }
    
    if (bgCanvas && bgCanvas.parentNode) {
        bgCanvas.parentNode.removeChild(bgCanvas);
    }
    
    bgCanvas = null;
    bgCtx = null;
    dots = [];
    trailParticles = [];
    
    console.log("Background resources cleaned up");
}

// Export functions for use in other files
window.initBackground = initBackground;
window.cleanupBackground = cleanupBackground;
