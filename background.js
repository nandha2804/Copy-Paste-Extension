// Handle extension icon click for manual re-enabling
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            // Notify user
            const div = document.createElement('div');
            div.textContent = 'Copy/Paste Re-enabled!';
            div.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 999999;
                font-family: Arial, sans-serif;
            `;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);

            // Re-trigger copy/paste enabling
            const evt = new Event('readystatechange');
            document.dispatchEvent(evt);
        }
    }).catch(() => {});
});
