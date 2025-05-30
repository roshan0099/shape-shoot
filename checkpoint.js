// Simple checkpoint notification when reaching 100, 200, 300, etc.
function triggerCheckpointExplosion(checkpoint) {
    console.log("Checkpoint reached:", checkpoint);
    
    // Create checkpoint text overlay (without pausing the game)
    const checkpointText = document.createElement('div');
    checkpointText.classList.add('checkpoint-text');
    checkpointText.textContent = checkpoint;
    gameArea.appendChild(checkpointText);
    
    // Remove the text after animation completes
    setTimeout(() => {
        if (gameArea.contains(checkpointText)) {
            checkpointText.remove();
        }
    }, 1500);
}
