// Game variables
let score = 0;
let gameRunning = false;
let shapes = [];
let clickableElements = [];
let lastHitTime = 0;
let timeWithoutHit = 0;
let hitCountdown = 5000; // 5 seconds in milliseconds
let gameLoopId = null;
let timerBarId = null;
let dots = [];
let dotSize = 4;
let dotSpacing = 40; // Increased spacing for better performance
let lastMouseMoveTime = 0;
let mouseThrottleDelay = 50; // Throttle mouse events for better performance
let mousePosition = { x: 0, y: 0 };
let animationFrameId = null;
let comboCount = 0;
let isMobileDevice = false;
let shapeGenerationInterval = 800; // Default interval for desktop
let maxShapesOnScreen = 12; // Default max shapes for desktop
let lastCheckpoint = 0; // Track the last score checkpoint (100, 200, etc.)
let isLowEndDevice = false; // Flag for very low-end devices

// Check if device is mobile and detect low-end devices
function checkMobileDevice() {
    isMobileDevice = window.innerWidth < 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Try to detect low-end devices based on memory or processor constraints
    // This is a rough estimate - devices with less memory or older processors will struggle more
    isLowEndDevice = isMobileDevice && (
        /Android 4\.|Android 5\.0|iPhone OS [789]_/.test(navigator.userAgent) || 
        window.innerWidth < 375 || 
        window.performance && window.performance.memory && window.performance.memory.jsHeapSizeLimit < 200000000
    );
    
    // Adjust shape generation interval based on device
    if (isLowEndDevice) {
        shapeGenerationInterval = 1500; // Even slower for low-end devices
        maxShapesOnScreen = 3; // Very few shapes for low-end devices
        dotSpacing = 80; // Very sparse dot grid
    } else if (isMobileDevice) {
        shapeGenerationInterval = 1200; // Slower for mobile
        maxShapesOnScreen = 5; // Fewer shapes on mobile for better performance
        dotSpacing = 60; // Larger spacing (fewer dots) on mobile
    } else {
        shapeGenerationInterval = 800; // Normal for desktop
        maxShapesOnScreen = 12; // Normal for desktop
        dotSpacing = 40; // Normal spacing for desktop
    }
    
    console.log("Device detection:", 
                isMobileDevice ? "Mobile" : "Desktop", 
                isLowEndDevice ? "(Low-end)" : "",
                "Shapes:", maxShapesOnScreen,
                "Interval:", shapeGenerationInterval);
}

// Call this on page load
checkMobileDevice();
// Also check on resize
window.addEventListener('resize', checkMobileDevice);

// DOM elements
const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
const comboCounterElement = document.getElementById('combo-counter');
const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');
const retryButton = document.getElementById('retry-btn');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const gameContainer = document.querySelector('.game-container');
const timerBar = document.getElementById('timer-bar');

// Shape properties
const shapeTypes = ['circle', 'rectangle', 'triangle'];
const borderColors = [
    '#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3', 
    '#00d2d3', '#54a0ff', '#6c5ce7', '#00cec9', '#0984e3'
];
const dangerProbability = 0.2; // 20% chance of a shape being dangerous

// Standard shape sizes
const shapeSizes = {
    circle: 50,
    rectangle: 50,
    triangle: 50
};

// Event listeners
startButton.addEventListener('click', showRulesPopup);
restartButton.addEventListener('click', restartGame);
retryButton.addEventListener('click', restartGame);
document.getElementById('start-game-btn').addEventListener('click', startGame);

// Add global click handler to improve responsiveness
document.addEventListener('pointerdown', handleGlobalClick);
document.addEventListener('touchstart', handleGlobalClick, {passive: false});

// Initialize the game
function init() {
    // Show the intro animation
    document.getElementById('intro-animation').style.display = 'flex';
    
    // Hide the game container and rules popup initially
    document.querySelector('.game-container').style.display = 'none';
    document.getElementById('rules-popup').style.display = 'none';
    
    // Animate the title letters with delay
    const titleLetters = document.querySelectorAll('.game-title span');
    titleLetters.forEach((letter, index) => {
        letter.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Create floating shapes for the intro
    createIntroShapes();
}

// Create floating shapes for the intro animation
function createIntroShapes() {
    const shapesContainer = document.querySelector('.intro-shapes-container');
    const colors = ['#4CAF50', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3'];
    const shapeTypes = ['circle', 'rectangle', 'triangle'];
    
    // Create 20 random shapes
    for (let i = 0; i < 20; i++) {
        const shape = document.createElement('div');
        shape.classList.add('intro-shape');
        
        // Random shape type
        const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        
        // Random size
        const size = 20 + Math.random() * 40;
        
        // Random position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Set shape properties
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        shape.style.left = `${x}px`;
        shape.style.top = `${y}px`;
        shape.style.borderColor = color;
        shape.style.borderWidth = '3px';
        shape.style.borderStyle = 'solid';
        shape.style.backgroundColor = 'transparent';
        
        // Set animation delay
        shape.style.animationDelay = `${Math.random() * 3}s`;
        
        // Special handling for triangle
        if (shapeType === 'triangle') {
            shape.style.width = '0';
            shape.style.height = '0';
            shape.style.borderWidth = '0 15px 30px 15px';
            shape.style.borderColor = `transparent transparent ${color} transparent`;
            shape.style.backgroundColor = 'transparent';
        } else if (shapeType === 'circle') {
            shape.style.borderRadius = '50%';
        }
        
        shapesContainer.appendChild(shape);
    }
}

// Handle intro start button click
document.getElementById('intro-start-btn').addEventListener('click', function() {
    // Hide intro animation
    document.getElementById('intro-animation').style.display = 'none';
    
    // Show game container
    document.querySelector('.game-container').style.display = 'block';
    
    // Show rules popup
    showRulesPopup();
});

// Call init when the page loads
window.addEventListener('load', init);

// Show rules popup
function showRulesPopup() {
    // Show the rules popup
    document.getElementById('rules-popup').style.display = 'flex';
    
    // Hide the start button
    startButton.style.display = 'none';
}

// Handle global click handler to improve responsiveness
function handleGlobalClick(e) {
    if (!gameRunning) return;
    
    // Play hit sound for any click
    playHitSound();
    
    // Get the position of the click/touch
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (!x || !y) return;
    
    // Check if any shape was clicked
    let hitShape = false;
    for (let i = clickableElements.length - 1; i >= 0; i--) {
        const element = clickableElements[i];
        const rect = element.getBoundingClientRect();
        
        // Expanded hit area for better touch response - increased from 10px to 20px
        const expandedRect = {
            left: rect.left - 20,
            right: rect.right + 20,
            top: rect.top - 20,
            bottom: rect.bottom + 20
        };
        
        if (x >= expandedRect.left && x <= expandedRect.right && 
            y >= expandedRect.top && y <= expandedRect.bottom) {
            
            // Trigger the shape's click handler
            element.clickHandler(e);
            hitShape = true;
            e.preventDefault();
            break;
        }
    }
    
    // If no shape was hit, reset combo and show miss text
    if (!hitShape && clickableElements.length > 0) {
        // Reset combo to 0 when missing a hit
        resetCombo();
        
        // Show "MISS!" text at the click position
        showMissText(x, y);
    }
}

// Show miss text
function showMissText(x, y) {
    const missText = document.createElement('div');
    missText.classList.add('miss-text');
    missText.textContent = "MISS!";
    
    // Position at the click position
    missText.style.left = `${x}px`;
    missText.style.top = `${y}px`;
    
    // Add to game area
    gameArea.appendChild(missText);
    
    // Remove after animation
    setTimeout(() => {
        if (gameArea.contains(missText)) {
            missText.remove();
        }
    }, 1000);
}

// Game functions
function startGame() {
    // Hide the rules popup
    document.getElementById('rules-popup').style.display = 'none';
    
    // Reset game state
    score = 0;
    comboCount = 0;
    lastCheckpoint = 0; // Reset checkpoint tracker
    shapes = [];
    clickableElements = [];
    gameArea.innerHTML = '';
    scoreElement.textContent = score;
    comboCounterElement.textContent = comboCount;
    lastHitTime = Date.now();
    timeWithoutHit = 0;
    
    // Create dot grid
    createDotGrid();
    
    // Reset timer bar
    timerBar.style.width = '100%';
    
    // Hide/show relevant elements
    startButton.style.display = 'none';
    restartButton.style.display = 'none';
    gameOverScreen.classList.add('hidden');
    
    // Start game loops
    gameRunning = true;
    
    // Use the appropriate interval based on device type
    setInterval(generateShape, shapeGenerationInterval);
    
    // Start the timer countdown
    startTimerCountdown();
    
    // Start game loop to check for time without hit
    gameLoopId = setInterval(gameLoop, 100);
}

function restartGame() {
    startGame();
}

function endGame() {
    gameRunning = false;
    
    // Stop all animations and intervals
    const allShapes = document.querySelectorAll('.shape');
    allShapes.forEach(shape => {
        cancelAnimationFrame(shape.animationId);
    });
    
    clearInterval(gameLoopId);
    clearInterval(timerBarId);
    
    // Clear clickable elements
    clickableElements = [];
    
    // Show game over screen
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    restartButton.style.display = 'inline-block';
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Calculate time since last hit
    const currentTime = Date.now();
    timeWithoutHit = currentTime - lastHitTime;
    
    // Update timer bar
    updateTimerBar();
    
    // Check if player has gone too long without a hit
    if (timeWithoutHit >= hitCountdown) {
        // End the game when timer runs out (instead of just resetting combo)
        endGame();
    }
    
    // Generate additional shapes occasionally to ensure enough shapes on screen
    // Now we do this for both mobile and desktop
    if (Math.random() > 0.95) {
        generateShape();
    }
    
    // For mobile, add even more shapes occasionally to make it more challenging
    if (isMobileDevice && Math.random() > 0.97) {
        generateShape();
    }
}

function startTimerCountdown() {
    // Clear any existing interval
    if (timerBarId) clearInterval(timerBarId);
    
    // Update timer bar every 50ms
    timerBarId = setInterval(updateTimerBar, 50);
}

function updateTimerBar() {
    // Calculate percentage of time remaining
    const percentRemaining = 100 - (timeWithoutHit / hitCountdown * 100);
    timerBar.style.width = `${Math.max(0, percentRemaining)}%`;
}

function resetTimer() {
    lastHitTime = Date.now();
    timeWithoutHit = 0;
    timerBar.style.width = '100%';
}

// Reset combo counter
function resetCombo() {
    comboCount = 0;
    comboCounterElement.textContent = comboCount;
}

// Create dot grid
function createDotGrid() {
    // Create a container for the dots
    const dotGrid = document.createElement('div');
    dotGrid.classList.add('dot-grid');
    gameArea.appendChild(dotGrid);
    
    // Skip dot grid entirely on low-end devices
    if (isLowEndDevice) {
        return;
    }
    
    // Calculate number of dots based on game area size and spacing
    const gameAreaWidth = gameArea.clientWidth;
    const gameAreaHeight = gameArea.clientHeight;
    
    const cols = Math.floor(gameAreaWidth / dotSpacing);
    const rows = Math.floor(gameAreaHeight / dotSpacing);
    
    // Create dots - limit the number for better performance
    const maxDots = isMobileDevice ? 100 : 300; // Even fewer dots on mobile
    const skipFactor = Math.max(1, Math.floor((rows * cols) / maxDots));
    
    let dotCount = 0;
    for (let row = 0; row < rows; row += skipFactor) {
        for (let col = 0; col < cols; col += skipFactor) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            
            // Position dot
            const x = col * dotSpacing + (dotSpacing / 2);
            const y = row * dotSpacing + (dotSpacing / 2);
            
            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;
            
            // Store dot position for later use
            dot.dataset.x = x;
            dot.dataset.y = y;
            
            dotGrid.appendChild(dot);
            dots.push(dot);
            dotCount++;
            
            if (dotCount >= maxDots) break;
        }
        if (dotCount >= maxDots) break;
    }
    
    // Add mouse move event listener to illuminate dots with throttling
    if (!isLowEndDevice) { // Skip on very low-end devices
        gameArea.addEventListener('mousemove', handleMouseMove);
        gameArea.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
}

// Handle mouse move with throttling
function handleMouseMove(e) {
    const currentTime = Date.now();
    
    // Store the current mouse position
    const rect = gameArea.getBoundingClientRect();
    mousePosition.x = e.clientX - rect.left;
    mousePosition.y = e.clientY - rect.top;
    
    // Create particle trail - less frequent on mobile
    if (gameRunning && currentTime - lastMouseMoveTime > (isMobileDevice ? 60 : 30)) {
        createTrailParticle(mousePosition.x, mousePosition.y);
    }
    
    // Throttle the actual illumination - more throttling on mobile
    if (currentTime - lastMouseMoveTime > (isMobileDevice ? 100 : 50)) {
        lastMouseMoveTime = currentTime;
        
        // Use requestAnimationFrame for better performance
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
            illuminateDotsAtPosition(mousePosition.x, mousePosition.y);
        });
    }
}

// Create trail particle
function createTrailParticle(x, y) {
    // On mobile, create fewer particles
    if (isMobileDevice && Math.random() > 0.5) return;
    
    const particle = document.createElement('div');
    particle.classList.add('particle-trail');
    
    // Random size
    const size = 3 + Math.random() * 5;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random color variation
    const hue = 120 + Math.floor(Math.random() * 40 - 20); // Green with variation
    particle.style.backgroundColor = `hsla(${hue}, 70%, 50%, 0.7)`;
    
    // Position
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // Add to game area
    gameArea.appendChild(particle);
    
    // Remove after animation - shorter time on mobile
    setTimeout(() => {
        if (gameArea.contains(particle)) {
            particle.remove();
        }
    }, isMobileDevice ? 500 : 1000);
}

// Handle touch move for mobile devices
function handleTouchMove(e) {
    const currentTime = Date.now();
    const touch = e.touches[0];
    
    if (touch) {
        const rect = gameArea.getBoundingClientRect();
        mousePosition.x = touch.clientX - rect.left;
        mousePosition.y = touch.clientY - rect.top;
        
        // Create particle trail for touch as well - less frequent on mobile
        if (gameRunning && currentTime - lastMouseMoveTime > 60) {
            createTrailParticle(mousePosition.x, mousePosition.y);
        }
        
        // Throttle the actual illumination - more throttling on mobile
        if (currentTime - lastMouseMoveTime > 100) {
            lastMouseMoveTime = currentTime;
            
            // Use requestAnimationFrame for better performance
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            animationFrameId = requestAnimationFrame(() => {
                illuminateDotsAtPosition(mousePosition.x, mousePosition.y);
            });
        }
    }
}

function illuminateDotsAtPosition(x, y) {
    // Find dots near the cursor and activate them
    const radius = isMobileDevice ? 80 : 100; // Smaller radius on mobile
    const radiusSquared = radius * radius; // Square the radius for performance
    
    // On mobile, only update a subset of dots each time for better performance
    const updateEvery = isMobileDevice ? 2 : 1;
    let counter = 0;
    
    dots.forEach(dot => {
        // On mobile, only update some dots each time
        if (isMobileDevice) {
            counter++;
            if (counter % updateEvery !== 0) return;
        }
        
        const dotX = parseFloat(dot.dataset.x);
        const dotY = parseFloat(dot.dataset.y);
        
        // Calculate distance squared (faster than using Math.sqrt)
        const distanceSquared = Math.pow(dotX - x, 2) + Math.pow(dotY - y, 2);
        
        // Activate dots within radius
        if (distanceSquared < radiusSquared) {
            // The closer to the center, the more intense the glow
            const intensity = 1 - (Math.sqrt(distanceSquared) / radius);
            dot.classList.add('active');
            dot.style.opacity = intensity;
        } else {
            dot.classList.remove('active');
            dot.style.opacity = '';
        }
    });
}

function generateShape() {
    if (!gameRunning) return;
    
    // Check if we already have too many shapes on screen
    if (clickableElements.length >= maxShapesOnScreen) {
        return; // Don't create more shapes if we've reached the limit
    }
    
    // Create a new shape element
    const shape = document.createElement('div');
    shape.classList.add('shape');
    
    // Determine shape type
    const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    shape.classList.add(shapeType);
    
    // Determine if shape is dangerous
    const isDangerous = Math.random() < dangerProbability;
    if (isDangerous) {
        shape.classList.add('dangerous');
    } 
    
    // Set border color
    const borderColor = isDangerous ? 'red' : borderColors[Math.floor(Math.random() * borderColors.length)];
    shape.style.borderColor = borderColor;
    
    // Special handling for triangle
    if (shapeType === 'triangle') {
        if (isDangerous) {
            shape.style.borderColor = 'transparent transparent red transparent';
        } else {
            shape.style.borderColor = `transparent transparent ${borderColor} transparent`;
        }
    }
    
    // Set shape properties based on standard sizes
    const size = shapeSizes[shapeType];
    shape.style.width = `${size}px`;
    shape.style.height = `${size}px`;
    
    // Position the shape
    const maxX = gameArea.clientWidth - size;
    const randomX = Math.floor(Math.random() * maxX);
    shape.style.left = `${randomX}px`;
    shape.style.top = '-50px';
    
    // Add special effects to some shapes (not dangerous ones)
    if (!isDangerous && Math.random() > 0.7) {
        // Add glow effect to some shapes
        shape.classList.add('glow');
    }
    
    // Physics properties - only vertical movement and rotation
    const physics = {
        x: randomX,
        y: -50,
        speedX: 0,                         // No horizontal movement
        speedY: Math.random() * 2 + 1.5,   // Falling speed
        acceleration: 0.1,                 // Gravity
        rotation: Math.random() * 360,     // Initial rotation
        rotationSpeed: (Math.random() - 0.5) * 10, // Rotation speed
        wobbleAngle: 0                     // Current wobble angle
    };
    
    // Define click handler function
    shape.clickHandler = function(e) {
        if (e) {
            e.preventDefault(); // Prevent default to improve responsiveness
            e.stopPropagation(); // Stop event bubbling
        }
        
        if (!gameRunning) return;
        
        // Remove from clickable elements
        const index = clickableElements.indexOf(shape);
        if (index > -1) {
            clickableElements.splice(index, 1);
        }
        
        if (isDangerous) {
            // Game over if clicked on dangerous shape
            endGame();
        } else {
            // Increase score if clicked on safe shape - now 6 points per combo hit!
            const pointsToAdd = comboCount >= 1 ? 6 : 1; // 6 points for combo hits
            score += pointsToAdd;
            scoreElement.textContent = score;
            
            // Check for score checkpoints (100, 200, 300, etc.)
            const currentCheckpoint = Math.floor(score / 100) * 100;
            if (currentCheckpoint > lastCheckpoint && currentCheckpoint > 0) {
                // We've reached a new checkpoint
                lastCheckpoint = currentCheckpoint;
                triggerCheckpointExplosion(currentCheckpoint);
            }
            
            // Reset the timer on successful hit
            resetTimer();
            
            // Update combo counter - combo increases with each hit within the timer
            comboCount++;
            comboCounterElement.textContent = comboCount;
            
            // Show combo text for every hit after the first one
            if (comboCount >= 2) {
                // Get the position of the shape for the combo text
                const rect = shape.getBoundingClientRect();
                const gameAreaRect = gameArea.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2 - gameAreaRect.left;
                const centerY = rect.top + rect.height / 2 - gameAreaRect.top;
                
                showComboText(comboCount, centerX, centerY);
            }
            
            // Show score popup
            showScorePopup(physics.x, physics.y, pointsToAdd);
            
            // Create burst effect
            createBurstEffect(shape, physics.x, physics.y);
            
            // Remove shape
            cancelAnimationFrame(shape.animationId);
            shape.remove();
        }
    };
    
    // Add to clickable elements array
    clickableElements.push(shape);
    
    // Add to game area
    gameArea.appendChild(shape);
    
    // Animate with physics
    function animate() {
        if (!gameRunning) return;
        
        // Update physics
        physics.speedY += physics.acceleration;
        physics.y += physics.speedY;
        
        // Update rotation
        physics.rotation += physics.rotationSpeed;
        
        // Apply position and rotation
        shape.style.top = `${physics.y}px`;
        shape.style.left = `${physics.x}px`;
        shape.style.transform = `rotate(${physics.rotation}deg)`;
        
        // Check if shape is out of bounds
        if (physics.y > gameArea.clientHeight + 50) {
            // Remove from clickable elements
            const index = clickableElements.indexOf(shape);
            if (index > -1) {
                clickableElements.splice(index, 1);
            }
            
            // Don't reset combo when shapes fall off screen
            // This is the key change - we no longer call resetCombo() here
            
            shape.remove();
            return;
        }
        
        // Continue animation
        shape.animationId = requestAnimationFrame(animate);
    }
    
    // Start animation
    shape.animationId = requestAnimationFrame(animate);
}

// Show combo text
function showComboText(count, x, y) {
    const comboText = document.createElement('div');
    comboText.classList.add('combo-text');
    comboText.textContent = `${count}x COMBO!`;
    
    // Position at the center of the clicked shape
    comboText.style.left = `${x}px`;
    comboText.style.top = `${y - 30}px`;
    
    // Add to game area
    gameArea.appendChild(comboText);
    
    // Remove after animation
    setTimeout(() => {
        if (gameArea.contains(comboText)) {
            comboText.remove();
        }
    }, 1200);
}

// Show score popup
function showScorePopup(x, y, points) {
    const scorePopup = document.createElement('div');
    scorePopup.classList.add('score-popup');
    
    // Show the actual points earned
    scorePopup.textContent = `+${points}`;
    
    // Position
    scorePopup.style.left = `${x}px`;
    scorePopup.style.top = `${y}px`;
    
    // Add to game area
    gameArea.appendChild(scorePopup);
    
    // Remove after animation
    setTimeout(() => {
        if (gameArea.contains(scorePopup)) {
            scorePopup.remove();
        }
    }, 1000);
}

// Create burst effect when shape is clicked
function createBurstEffect(shape, x, y) {
    // Add burst animation to the shape
    shape.classList.add('burst');
    
    // Create sonic boom effect
    const sonicBoom = document.createElement('div');
    sonicBoom.classList.add('sonic-boom');
    
    // Position at the center of the clicked shape
    const rect = shape.getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    const centerX = rect.left + rect.width / 2 - gameAreaRect.left;
    const centerY = rect.top + rect.height / 2 - gameAreaRect.top;
    
    sonicBoom.style.left = `${centerX}px`;
    sonicBoom.style.top = `${centerY}px`;
    sonicBoom.style.width = `${rect.width * 4}px`;
    sonicBoom.style.height = `${rect.height * 4}px`;
    
    gameArea.appendChild(sonicBoom);
    
    // Add enhanced screen shake effect
    gameArea.classList.add('screen-shake');
    setTimeout(() => {
        gameArea.classList.remove('screen-shake');
    }, 400);
    
    // Create lightning flash effect
    const lightning = document.createElement('div');
    lightning.classList.add('lightning');
    gameArea.appendChild(lightning);
    
    // Create lightning bolt
    const createLightningBolt = () => {
        const bolt = document.createElement('div');
        bolt.classList.add('thunder-bolt');
        
        // Random position
        const startX = Math.random() * gameArea.clientWidth;
        bolt.style.left = `${startX}px`;
        bolt.style.top = '0px';
        
        // Random height
        const height = gameArea.clientHeight * (0.5 + Math.random() * 0.5);
        bolt.style.setProperty('--bolt-height', `${height}px`);
        
        // Random rotation
        const rotation = (Math.random() - 0.5) * 30;
        bolt.style.transform = `rotate(${rotation}deg)`;
        
        gameArea.appendChild(bolt);
        
        // Remove after animation
        setTimeout(() => {
            if (gameArea.contains(bolt)) {
                bolt.remove();
            }
        }, 500);
    };
    
    // Create multiple lightning bolts
    createLightningBolt();
    setTimeout(createLightningBolt, 100);
    
    // Remove lightning flash after animation
    setTimeout(() => {
        if (gameArea.contains(lightning)) {
            lightning.remove();
        }
    }, 300);
    
    // Create energy field effect
    const energyField = document.createElement('div');
    energyField.classList.add('energy-field');
    energyField.style.left = `${centerX}px`;
    energyField.style.top = `${centerY}px`;
    energyField.style.width = `${rect.width}px`;
    energyField.style.height = `${rect.height}px`;
    gameArea.appendChild(energyField);
    
    // Remove energy field after animation
    setTimeout(() => {
        if (gameArea.contains(energyField)) {
            energyField.remove();
        }
    }, 800);
    
    // Create shattered pieces effect - optimized for performance
    const numShards = 30; // Reduced number of fragments for better performance
    const particleColors = [
        '#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3', 
        '#00d2d3', '#54a0ff', '#6c5ce7', '#fdcb6e', '#e84393'
    ];
    
    // Get the shape's color for the shards
    const shapeColor = window.getComputedStyle(shape).borderColor;
    
    // Create a fragment container for better performance
    const fragmentContainer = document.createElement('div');
    fragmentContainer.className = 'fragment-container';
    gameArea.appendChild(fragmentContainer);
    
    for (let i = 0; i < numShards; i++) {
        const shard = document.createElement('div');
        shard.classList.add('shard');
        
        // Use shape's color for some shards, random colors for others
        const useShapeColor = Math.random() > 0.5;
        const color = useShapeColor ? shapeColor : particleColors[Math.floor(Math.random() * particleColors.length)];
        shard.style.backgroundColor = color;
        shard.style.borderColor = color;
        
        // Random size for varied effect - smaller for more realistic shards
        const size = 5 + Math.random() * 15;
        shard.style.width = `${size}px`;
        shard.style.height = `${size}px`;
        
        // Position at the center of the clicked shape
        shard.style.left = `${centerX}px`;
        shard.style.top = `${centerY}px`;
        
        // Random direction with more spread
        const angle = (i / numShards) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 150 + Math.random() * 250;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        // Random rotation for each shard
        const rotation = Math.random() * 720 - 360;
        shard.style.setProperty('--tx', `${tx}px`);
        shard.style.setProperty('--ty', `${ty}px`);
        shard.style.setProperty('--rot', `${rotation}deg`);
        
        // Add to fragment container
        fragmentContainer.appendChild(shard);
    }
    
    // Remove fragment container after animation
    setTimeout(() => {
        if (gameArea.contains(fragmentContainer)) {
            fragmentContainer.remove();
        }
    }, 1800);
    
    // Remove sonic boom after animation
    setTimeout(() => {
        if (gameArea.contains(sonicBoom)) {
            sonicBoom.remove();
        }
    }, 1000);
    
    // Play explosion sound for successful hits
    playExplosionSound();
}

// Play hit sound (for any click)
function playHitSound() {
    // Get the hit sound element
    const hitSound = document.getElementById('hit-sound');
    
    // Reset the sound to the beginning
    hitSound.currentTime = 0;
    
    // Set volume
    hitSound.volume = 0.7;
    
    // Play the sound
    hitSound.play().catch(e => {
        console.log('Error playing sound:', e);
    });
}

// Play explosion sound (for successful hits)
function playExplosionSound() {
    // Get the explosion sound element
    const explosionSound = document.getElementById('explosion-sound');
    
    // Reset the sound to the beginning
    explosionSound.currentTime = 0;
    
    // Set volume
    explosionSound.volume = 0.7;
    
    // Play the sound
    explosionSound.play().catch(e => {
        console.log('Error playing sound:', e);
    });
}
// Trigger checkpoint explosion when reaching 100, 200, 300, etc.
function triggerCheckpointExplosion(checkpoint) {
    // Pause the game briefly
    const wasGameRunning = gameRunning;
    gameRunning = false;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.classList.add('checkpoint-overlay');
    gameArea.appendChild(overlay);
    
    // Create checkpoint text
    const checkpointText = document.createElement('div');
    checkpointText.classList.add('checkpoint-text');
    checkpointText.textContent = checkpoint;
    overlay.appendChild(checkpointText);
    
    // Create mega explosion effect
    const megaExplosion = document.createElement('div');
    megaExplosion.classList.add('mega-explosion');
    gameArea.appendChild(megaExplosion);
    
    // Create multiple explosion rings
    for (let i = 0; i < 3; i++) {
        const ring = document.createElement('div');
        ring.classList.add('mega-explosion-ring');
        ring.style.animationDelay = `${i * 0.2}s`;
        megaExplosion.appendChild(ring);
    }
    
    // Explode all shapes on screen
    const allShapes = [...clickableElements]; // Create a copy to avoid modification issues
    
    // Explode shapes with a slight delay between each
    allShapes.forEach((shape, index) => {
        setTimeout(() => {
            if (gameArea.contains(shape)) {
                // Get shape position
                const rect = shape.getBoundingClientRect();
                const gameAreaRect = gameArea.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - gameAreaRect.left;
                const y = rect.top + rect.height / 2 - gameAreaRect.top;
                
                // Only explode non-dangerous shapes
                if (!shape.classList.contains('dangerous')) {
                    // Create explosion effect
                    createBurstEffect(shape, x, y);
                    
                    // Remove from clickable elements
                    const index = clickableElements.indexOf(shape);
                    if (index > -1) {
                        clickableElements.splice(index, 1);
                    }
                    
                    // Remove shape
                    cancelAnimationFrame(shape.animationId);
                    shape.remove();
                }
            }
        }, index * 100); // Stagger explosions for visual effect
    });
    
    // Play explosion sound
    playExplosionSound();
    
    // Remove overlay and resume game after animation
    setTimeout(() => {
        if (gameArea.contains(overlay)) {
            overlay.remove();
        }
        if (gameArea.contains(megaExplosion)) {
            megaExplosion.remove();
        }
        gameRunning = wasGameRunning;
    }, 1500);
}
// Create burst effect when shape is clicked - optimized version
function createBurstEffect(shape, x, y) {
    // Add burst animation to the shape
    shape.classList.add('burst');
    
    // Skip most effects on low-end devices
    if (isLowEndDevice) {
        // Play explosion sound
        playExplosionSound();
        return;
    }
    
    // Create sonic boom effect
    const sonicBoom = document.createElement('div');
    sonicBoom.classList.add('sonic-boom');
    
    // Position at the center of the clicked shape
    const rect = shape.getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    const centerX = rect.left + rect.width / 2 - gameAreaRect.left;
    const centerY = rect.top + rect.height / 2 - gameAreaRect.top;
    
    sonicBoom.style.left = `${centerX}px`;
    sonicBoom.style.top = `${centerY}px`;
    sonicBoom.style.width = `${rect.width * 4}px`;
    sonicBoom.style.height = `${rect.height * 4}px`;
    
    gameArea.appendChild(sonicBoom);
    
    // Skip screen shake and lightning on mobile
    if (!isMobileDevice) {
        // Add enhanced screen shake effect
        gameArea.classList.add('screen-shake');
        setTimeout(() => {
            gameArea.classList.remove('screen-shake');
        }, 400);
        
        // Create lightning flash effect
        const lightning = document.createElement('div');
        lightning.classList.add('lightning');
        gameArea.appendChild(lightning);
        
        // Create lightning bolt
        const createLightningBolt = () => {
            const bolt = document.createElement('div');
            bolt.classList.add('thunder-bolt');
            
            // Random position
            const startX = Math.random() * gameArea.clientWidth;
            bolt.style.left = `${startX}px`;
            bolt.style.top = '0px';
            
            // Random height
            const height = gameArea.clientHeight * (0.5 + Math.random() * 0.5);
            bolt.style.setProperty('--bolt-height', `${height}px`);
            
            // Random rotation
            const rotation = (Math.random() - 0.5) * 30;
            bolt.style.transform = `rotate(${rotation}deg)`;
            
            gameArea.appendChild(bolt);
            
            // Remove after animation
            setTimeout(() => {
                if (gameArea.contains(bolt)) {
                    bolt.remove();
                }
            }, 500);
        };
        
        // Create multiple lightning bolts
        createLightningBolt();
        setTimeout(createLightningBolt, 100);
        
        // Remove lightning flash after animation
        setTimeout(() => {
            if (gameArea.contains(lightning)) {
                lightning.remove();
            }
        }, 300);
    }
    
    // Create energy field effect - simpler on mobile
    const energyField = document.createElement('div');
    energyField.classList.add('energy-field');
    energyField.style.left = `${centerX}px`;
    energyField.style.top = `${centerY}px`;
    energyField.style.width = `${rect.width}px`;
    energyField.style.height = `${rect.height}px`;
    gameArea.appendChild(energyField);
    
    // Remove energy field after animation
    setTimeout(() => {
        if (gameArea.contains(energyField)) {
            energyField.remove();
        }
    }, 800);
    
    // Create shattered pieces effect - optimized for performance
    // Skip on low-end devices, fewer on mobile
    const numShards = isMobileDevice ? 10 : 20;
    
    // Skip shards on very low-end devices
    if (!isMobileDevice) {
        const particleColors = [
            '#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3', 
            '#00d2d3', '#54a0ff', '#6c5ce7', '#fdcb6e', '#e84393'
        ];
        
        // Get the shape's color for the shards
        const shapeColor = window.getComputedStyle(shape).borderColor;
        
        // Create a fragment container for better performance
        const fragmentContainer = document.createElement('div');
        fragmentContainer.className = 'fragment-container';
        gameArea.appendChild(fragmentContainer);
        
        for (let i = 0; i < numShards; i++) {
            const shard = document.createElement('div');
            shard.classList.add('shard');
            
            // Use shape's color for some shards, random colors for others
            const useShapeColor = Math.random() > 0.5;
            const color = useShapeColor ? shapeColor : particleColors[Math.floor(Math.random() * particleColors.length)];
            shard.style.backgroundColor = color;
            shard.style.borderColor = color;
            
            // Random size for varied effect - smaller for more realistic shards
            const size = 5 + Math.random() * 15;
            shard.style.width = `${size}px`;
            shard.style.height = `${size}px`;
            
            // Position at the center of the clicked shape
            shard.style.left = `${centerX}px`;
            shard.style.top = `${centerY}px`;
            
            // Random direction with more spread
            const angle = (i / numShards) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 150 + Math.random() * 250;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            // Random rotation for each shard
            const rotation = Math.random() * 720 - 360;
            shard.style.setProperty('--tx', `${tx}px`);
            shard.style.setProperty('--ty', `${ty}px`);
            shard.style.setProperty('--rot', `${rotation}deg`);
            
            // Add to fragment container
            fragmentContainer.appendChild(shard);
        }
        
        // Remove fragment container after animation - shorter time on mobile
        setTimeout(() => {
            if (gameArea.contains(fragmentContainer)) {
                fragmentContainer.remove();
            }
        }, isMobileDevice ? 1000 : 1800);
    }
    
    // Remove sonic boom after animation
    setTimeout(() => {
        if (gameArea.contains(sonicBoom)) {
            sonicBoom.remove();
        }
    }, 1000);
    
    // Play explosion sound
    playExplosionSound();
}
