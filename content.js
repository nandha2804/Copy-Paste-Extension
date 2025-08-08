// Enable copy/paste functionality
function enableCopyPaste() {
    // Make document editable
    document.designMode = 'on';
    document.documentElement.contentEditable = true;

    // Force clipboard permissions
    if (navigator.clipboard) {
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                readText: () => Promise.resolve(''),
                writeText: text => Promise.resolve(text)
            },
            writable: false
        });
    }

    // Enable selection and paste
    const style = document.createElement('style');
    style.textContent = `
        * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
            -webkit-user-modify: read-write !important;
            -moz-user-modify: read-write !important;
        }
        input, textarea {
            -webkit-user-select: text !important;
            user-select: text !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // Process all elements
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
        try {
            // Make element editable
            el.contentEditable = true;
            el.style.userSelect = 'text';
            el.style.webkitUserSelect = 'text';

            // Remove restrictions
            ['unselectable', 'readonly', 'disabled', 'spellcheck', 
             'autocorrect', 'autocomplete', 'contenteditable'].forEach(attr => {
                el.removeAttribute(attr);
            });

            // Clear event handlers
            ['copy', 'paste', 'cut', 'select', 'selectstart',
             'contextmenu', 'beforecopy', 'beforecut', 'beforepaste'].forEach(evt => {
                el['on' + evt] = null;
                el.removeAttribute('on' + evt);
            });
        } catch(e) {}
    });

    // Handle paste events
    function handlePaste(e) {
        e.stopImmediatePropagation();
        const text = e.clipboardData.getData('text/plain');
        const target = e.target || document.activeElement;

        if (target) {
            // Handle input/textarea
            if ('value' in target) {
                const start = target.selectionStart || 0;
                const end = target.selectionEnd || start;
                target.value = target.value.substring(0, start) + text + target.value.substring(end);
                target.selectionStart = target.selectionEnd = start + text.length;
            } 
            // Handle contenteditable
            else {
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    selection.deleteFromDocument();
                    selection.getRangeAt(0).insertNode(document.createTextNode(text));
                }
            }
        }
        e.preventDefault();
    }

    // Add event listeners
    document.addEventListener('paste', handlePaste, true);
    window.addEventListener('paste', handlePaste, true);

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
            e.stopImmediatePropagation();
            navigator.clipboard.readText().then(text => {
                const evt = new ClipboardEvent('paste', {
                    bubbles: true,
                    clipboardData: new DataTransfer()
                });
                Object.defineProperty(evt.clipboardData, 'getData', { value: () => text });
                document.activeElement.dispatchEvent(evt);
            });
        }
    }, true);
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableCopyPaste);
} else {
    enableCopyPaste();
}

// Run on dynamic content
const observer = new MutationObserver(() => {
    enableCopyPaste();
});

// Start observing
if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
    });
}
