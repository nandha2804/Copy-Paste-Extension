// Add styles to enable selection
const style = document.createElement('style');
style.textContent = `
    * {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        user-select: text !important;
        pointer-events: auto !important;
    }
`;

// Function to enable copy/paste
function enableCopyPaste() {
    // Add style to document
    if (document.head) {
        if (!document.head.contains(style)) {
            document.head.appendChild(style);
        }
    }

    // Remove copy/paste blocking
    ['copy', 'paste', 'cut', 'contextmenu'].forEach(event => {
        document.addEventListener(event, (e) => {
            e.stopImmediatePropagation();
            return true;
        }, true);
    });

    // Remove protection from elements
    document.querySelectorAll('*').forEach(el => {
        // Remove event listeners
        el.oncopy = null;
        el.onpaste = null;
        el.oncut = null;
        el.onselectstart = null;
        el.oncontextmenu = null;
        
        // Remove attributes
        el.removeAttribute('unselectable');
        el.removeAttribute('style');
        
        // Add selection style
        el.style.userSelect = 'text';
        el.style.webkitUserSelect = 'text';
    });
}

// Initial run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableCopyPaste);
} else {
    enableCopyPaste();
}

// Run when page is fully loaded
window.addEventListener('load', enableCopyPaste);

// Run periodically to catch dynamic changes
setInterval(enableCopyPaste, 1000);