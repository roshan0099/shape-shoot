// Simple checkpoint notification when reaching 100, 200, 300, etc.
// NO explosions, NO object removal, just a visual indicator
// console.log("start")
function triggerCheckpointExplosion(checkpoint) {
    console.log("Checkpoint reached:", checkpoint);
    
    // Create checkpoint text overlay (without affecting gameplay)
    const checkpointText = document.createElement('div');
    checkpointText.classList.add('checkpoint-text');
    checkpointText.textContent = checkpoint;
    
    // Make sure it's added to the game area (not the body)
    const gameArea = document.getElementById('game-area');
    gameArea.appendChild(checkpointText);
    
    // Make sure it's visible on top of everything
    checkpointText.style.zIndex = "1000";
    
    // Remove the text after animation completes
    setTimeout(() => {
        if (gameArea.contains(checkpointText)) {
            checkpointText.remove();
        }
    }, 1500);
}
