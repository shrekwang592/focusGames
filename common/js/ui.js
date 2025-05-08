export function showMessage(messageBoxId, message, duration = 2000) {
    const messageBox = document.getElementById(messageBoxId);
    if (!messageBox) return;
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, duration);
}

// You can add helpers for button states, etc. 