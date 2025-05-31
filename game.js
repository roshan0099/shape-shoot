// Canvas-based game implementation
let canvas, ctx;
let gameRunning = false;
let score = 0;
let comboCount = 0;
let lastHitTime = 0;
let timeWithoutHit = 0;
let hitCountdown = 5000; // 5 seconds
let shapes = [];
let gameMousePosition = { x: 0, y: 0 };
let isMobileDevice = false;
let lastCheckpoint = 0;
let animationFrameId = null;
let gameLastFrameTime = 0;

// Initialize the game
function initGame() {
    console.log("Initializing game...");
    // Get canvas and context
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    
    // Add event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    
    // Check if device is mobile
    checkMobileDevice();
    
    console.log("Game initialized with canvas dimensions:", canvas.width, canvas.height);
}

// Resize canvas to fill game area
function resizeCanvas() {
    const gameArea = document.getElementById('game-area');
    const rect = gameArea.getBoundingClientRect();
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas dimensions to match game area exactly
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale context to account for high DPI displays
    ctx.scale(dpr, dpr);
    
    // Set canvas CSS size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    console.log("Canvas resized to:", rect.width, "x", rect.height, "with DPR:", dpr);
    
    // Adjust any existing shapes to stay within bounds if canvas size changed
    if (shapes.length > 0) {
        shapes.forEach(shape => {
            if (shape.x < 0) shape.x = shape.size;
            if (shape.x > canvas.width / dpr) shape.x = (canvas.width / dpr) - shape.size;
        });
    }
}

// Check if device is mobile
function checkMobileDevice() {
    isMobileDevice = window.innerWidth < 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("Device detected as:", isMobileDevice ? "mobile" : "desktop");
}

// Handle mouse movement
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    gameMousePosition.x = (e.clientX - rect.left) * (canvas.width / rect.width / dpr);
    gameMousePosition.y = (e.clientY - rect.top) * (canvas.height / rect.height / dpr);
}

// Handle canvas click
function handleCanvasClick(e) {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * (canvas.width / rect.width / dpr);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height / dpr);
    
    checkShapeCollision(x, y);
}

// Handle touch on canvas
function handleCanvasTouch(e) {
    if (!gameRunning) return;
    e.preventDefault();
    
    if (e.touches && e.touches[0]) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width / dpr);
        const y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height / dpr);
        
        checkShapeCollision(x, y);
    }
}

// Handle keyboard input
function handleKeyDown(e) {
    if (e.code === 'Space' && gameRunning) {
        e.preventDefault();
        checkShapeCollision(gameMousePosition.x, gameMousePosition.y);
    }
}

// Check if a click/touch hit any shape
function checkShapeCollision(x, y) {
    let hitShape = false;
    let closestDistance = Infinity;
    let closestShapeIndex = -1;
    
    // Find the closest shape to the click
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        const distance = Math.sqrt(Math.pow(shape.x - x, 2) + Math.pow(shape.y - y, 2));
        
        // Use a larger hit area for better user experience
        const hitRadius = shape.size + 20;
        
        if (distance < hitRadius && distance < closestDistance) {
            closestDistance = distance;
            closestShapeIndex = i;
            hitShape = true;
        }
    }
    
    // Handle the hit
    if (hitShape && closestShapeIndex !== -1) {
        const shape = shapes[closestShapeIndex];
        
        if (shape.isDangerous) {
            // Game over if hit dangerous shape
            endGame();
        } else {
            // Handle successful hit
            handleSuccessfulHit(shape, closestShapeIndex);
        }
    } else {
        // Handle miss
        handleMiss(x, y);
    }
}

// Handle successful hit on a shape
function handleSuccessfulHit(shape, index) {
    // Remove the shape
    shapes.splice(index, 1);
    
    // Increase score - 6 points per combo hit
    const pointsToAdd = comboCount >= 1 ? 6 : 1;
    score += pointsToAdd;
    document.getElementById('score').textContent = score;
    
    // Reset timer
    lastHitTime = Date.now();
    timeWithoutHit = 0;
    
    // Update combo
    comboCount++;
    document.getElementById('combo-counter').textContent = comboCount;
    
    // Create explosion effect
    createExplosion(shape.x, shape.y, shape.color);
    
    // Add lightning effect on higher combos
    if (comboCount > 5) {
        createLightningEffect(shape.x, shape.y, shape.color);
    }
    
    // Show combo popup for combos >= 2
    if (comboCount >= 2) {
        showComboPopup(shape.x, shape.y, comboCount);
    }
    
    // Trigger screen shake based on combo
    if (typeof triggerScreenShake === 'function') {
        // Intensity increases with combo - much stronger now
        const shakeIntensity = Math.min(8 + comboCount * 1.2, 30);
        triggerScreenShake(shakeIntensity);
    }
    
    // Check for checkpoint
    const currentCheckpoint = Math.floor(score / 100) * 100;
    if (currentCheckpoint > lastCheckpoint && currentCheckpoint > 0) {
        lastCheckpoint = currentCheckpoint;
        triggerCheckpoint(currentCheckpoint);
    }
    
    // Play sound
    playHitSound();
}

// Show combo popup
function showComboPopup(x, y, comboCount) {
    // Create a text effect for the combo
    if (typeof createComboText === 'function') {
        createComboText(x, y, `${comboCount}X`, getComboColor(comboCount));
    }
}

// Get color based on combo count
function getComboColor(comboCount) {
    if (comboCount >= 10) {
        return '#FF5722'; // Orange/red for high combos
    } else if (comboCount >= 5) {
        return '#FFEB3B'; // Yellow for medium combos
    } else {
        return '#4CAF50'; // Green for low combos
    }
}

// Handle miss
function handleMiss(x, y) {
    // Reset combo
    comboCount = 0;
    document.getElementById('combo-counter').textContent = comboCount;
    
    // Show miss text
    createMissText(x, y);
    
    // Play sound
    playHitSound();
}

// Start the game
function startGame() {
    console.log("Starting game...");
    
    // Cancel any existing animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Reset game state
    score = 0;
    comboCount = 0;
    lastCheckpoint = 0;
    shapes = [];
    lastHitTime = Date.now();
    timeWithoutHit = 0;
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('combo-counter').textContent = comboCount;
    document.getElementById('timer-bar').style.width = '100%';
    
    // Hide/show relevant elements
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('restart-btn').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    
    // Start game loops
    gameRunning = true;
    window.gameRunning = true;
    
    // Generate initial shapes - fewer on mobile
    const initialShapes = isMobileDevice ? 4 : 5;
    for (let i = 0; i < initialShapes; i++) {
        generateShape();
    }
    
    // Start shape generation
    startShapeGeneration();
    
    // Start game loop
    gameLastFrameTime = performance.now();
    startGameLoop();
    
    console.log("Game started with", shapes.length, "initial shapes");
}

// Main game loop
function startGameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Calculate delta time for smooth animations
    const currentTime = timestamp || performance.now();
    const deltaTime = currentTime - gameLastFrameTime;
    gameLastFrameTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw shapes
    updateShapes(deltaTime);
    
    // Update timer
    updateTimer();
    
    // Apply screen shake if available
    if (typeof applyScreenShake === 'function') {
        applyScreenShake();
    }
    
    // Request next frame
    animationFrameId = requestAnimationFrame(startGameLoop);
}

// Update and draw all shapes
function updateShapes(deltaTime) {
    // Normalize speed based on frame rate
    const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
    
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        
        // Update position with frame rate independent movement
        shape.y += shape.speed * speedFactor;
        
        // Update rotation
        shape.rotation += shape.rotationSpeed * speedFactor;
        
        // Draw shape
        drawShape(shape);
        
        // Remove if out of bounds
        if (shape.y > canvas.height / (window.devicePixelRatio || 1) + 50) {
            shapes.splice(i, 1);
        }
    }
}

// Draw a shape on canvas
function drawShape(shape) {
    ctx.save();
    
    // Translate to shape position
    ctx.translate(shape.x, shape.y);
    
    // Rotate
    ctx.rotate(shape.rotation * Math.PI / 180);
    
    // Set color
    ctx.strokeStyle = shape.isDangerous ? 'red' : shape.color;
    ctx.lineWidth = 3;
    
    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = shape.isDangerous ? 'rgba(255, 0, 0, 0.7)' : shape.color;
    
    // Draw based on shape type
    switch (shape.type) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
        case 'rectangle':
            ctx.beginPath();
            ctx.strokeRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
            break;
            
        case 'triangle':
            const h = shape.size * 0.866; // height of equilateral triangle
            ctx.beginPath();
            ctx.moveTo(0, -h / 2);
            ctx.lineTo(-shape.size / 2, h / 2);
            ctx.lineTo(shape.size / 2, h / 2);
            ctx.closePath();
            ctx.stroke();
            break;
            
        case 'hexagon':
            drawPolygon(ctx, 0, 0, 6, shape.size / 2);
            ctx.stroke();
            break;
            
        case 'diamond':
            ctx.beginPath();
            ctx.moveTo(0, -shape.size / 2);
            ctx.lineTo(shape.size / 2, 0);
            ctx.lineTo(0, shape.size / 2);
            ctx.lineTo(-shape.size / 2, 0);
            ctx.closePath();
            ctx.stroke();
            break;
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    ctx.restore();
}

// Helper function to draw a regular polygon
function drawPolygon(ctx, cx, cy, sides, radius) {
    ctx.beginPath();
    ctx.moveTo(cx + radius * Math.cos(0), cy + radius * Math.sin(0));
    
    for (let i = 1; i <= sides; i++) {
        const angle = i * 2 * Math.PI / sides;
        ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
    
    ctx.closePath();
}

// Generate shapes at intervals
function startShapeGeneration() {
    const interval = isMobileDevice ? 1000 : 600; // Slower generation on mobile
    
    // Generate shapes at regular intervals
    const shapeInterval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(shapeInterval);
            return;
        }
        
        // Generate fewer shapes at once on mobile
        const shapesToGenerate = isMobileDevice ? 1 : 1;
        for (let i = 0; i < shapesToGenerate; i++) {
            generateShape();
        }
    }, interval);
}

// Generate a single shape
function generateShape() {
    const shapeTypes = ['circle', 'rectangle', 'triangle', 'hexagon', 'diamond'];
    const colors = [
        '#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3', 
        '#00d2d3', '#54a0ff', '#6c5ce7', '#00cec9', '#0984e3'
    ];
    
    // Get canvas dimensions accounting for DPI
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    
    // Create shape object with faster speed
    const shape = {
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        size: 50, // Standard size maintained
        x: Math.random() * (canvasWidth - 100) + 50, // Keep shapes away from edges
        y: -50,
        speed: Math.random() * 2 + 2.5, // Increased speed
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        isDangerous: Math.random() < 0.2 // 20% chance
    };
    
    // Add to shapes array
    shapes.push(shape);
    
    return shape;
}

// Update timer bar
function updateTimer() {
    const currentTime = Date.now();
    timeWithoutHit = currentTime - lastHitTime;
    
    // Calculate percentage of time remaining
    const percentRemaining = 100 - (timeWithoutHit / hitCountdown * 100);
    document.getElementById('timer-bar').style.width = `${Math.max(0, percentRemaining)}%`;
    
    // Check if timer ran out
    if (timeWithoutHit >= hitCountdown) {
        endGame();
    }
}

// End the game
function endGame() {
    console.log("Game over. Final score:", score);
    gameRunning = false;
    window.gameRunning = false;
    
    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Show game over screen
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('restart-btn').style.display = 'inline-block';
}

// Create explosion effect
function createExplosion(x, y, color) {
    // This will be implemented in the effects.js file
    if (typeof createCanvasExplosion === 'function') {
        createCanvasExplosion(x, y, color);
    }
}

// Create lightning effect for higher combos
function createLightningEffect(x, y, color) {
    // This will be implemented in the effects.js file
    if (typeof createCanvasLightning === 'function') {
        createCanvasLightning(x, y, color);
    }
}

// Create miss text
function createMissText(x, y) {
    // This will be implemented in the effects.js file
    if (typeof createCanvasMissText === 'function') {
        createCanvasMissText(x, y);
    }
}

// Trigger checkpoint celebration
function triggerCheckpoint(checkpoint) {
    console.log("Checkpoint reached:", checkpoint);
    
    // Create special effects at checkpoint
    if (typeof createCheckpointExplosion === 'function') {
        createCheckpointExplosion(canvas.width / (window.devicePixelRatio || 1) / 2, 
                                 canvas.height / (window.devicePixelRatio || 1) / 2);
    }
    
    // Trigger a very strong screen shake
    if (typeof triggerScreenShake === 'function') {
        triggerScreenShake(40); // Much stronger shake for checkpoint
    }
    
    // Play explosion sound
    playExplosionSound();
}

// Play hit sound
function playHitSound() {
    const hitSound = document.getElementById('hit-sound');
    if (hitSound) {
        hitSound.currentTime = 0;
        hitSound.volume = 0.7;
        hitSound.play().catch(e => console.log('Error playing sound:', e));
    }
}

// Play explosion sound
function playExplosionSound() {
    const explosionSound = document.getElementById('explosion-sound');
    if (explosionSound) {
        explosionSound.currentTime = 0;
        explosionSound.volume = 0.7;
        explosionSound.play().catch(e => console.log('Error playing sound:', e));
    }
}

// Export functions for use in other files
window.initGame = initGame;
window.startGame = startGame;
window.gameRunning = gameRunning;
