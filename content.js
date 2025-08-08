// Create a self-executing function to avoid global scope pollution
(function() {
    // Constants
    const REFRESH_INTERVAL = 1000;
    const PROTECTED_EVENTS = ['copy', 'paste', 'cut', 'contextmenu', 'selectstart'];
    
    // Add minimal style just for text selection
    const style = document.createElement('style');
    style.textContent = `
        [data-copyable="true"] {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;

    // Function to handle errors gracefully
    function handleError(error) {
        console.warn('Copy-Paste Extension:', error);
    }

    // Function to enable copy/paste for a specific document
    function enableCopyPaste(doc) {
        try {
            const head = doc.head || doc.getElementsByTagName('head')[0];
            
            // Add style to document if not already present
            if (head && !head.contains(style.cloneNode(true))) {
                head.appendChild(style.cloneNode(true));
            }

            // Remove copy/paste blocking
            PROTECTED_EVENTS.forEach(event => {
                doc.addEventListener(event, (e) => {
                    e.stopImmediatePropagation();
                    return true;
                }, { capture: true, passive: false });
            });

            // Find text elements that should be copyable
            const elements = doc.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, article, section, pre, code');
            elements.forEach(el => {
                try {
                    // Only process text-containing elements
                    if (el.textContent.trim()) {
                        // Remove only copy/paste related event handlers
                        PROTECTED_EVENTS.forEach(event => {
                            const prop = 'on' + event;
                            if (el[prop]) el[prop] = null;
                        });
                        
                        // Remove only copy/paste related attributes
                        ['unselectable', 'oncopy', 'onpaste', 'oncut', 'onselectstart'].forEach(attr => {
                            if (el.hasAttribute(attr)) {
                                el.removeAttribute(attr);
                            }
                        });
                        
                        // Mark as copyable without modifying other styles
                        el.setAttribute('data-copyable', 'true');
                    }
                } catch (err) {
                    handleError(err);
                }
            });

            // Override clipboard protection
            if (typeof ClipboardEvent === 'function') {
                doc.addEventListener('copy', (e) => {
                    const selection = doc.getSelection();
                    if (selection.toString()) {
                        e.clipboardData.setData('text/plain', selection.toString());
                        e.preventDefault();
                    }
                }, true);
            }
        } catch (err) {
            handleError(err);
        }
    }

    // Function to handle iframes
    function enableCopyPasteInIframes() {
        try {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                try {
                    const doc = iframe.contentDocument;
                    if (doc) {
                        enableCopyPaste(doc);
                    }
                } catch (err) {
                    // Skip iframes we can't access due to same-origin policy
                    handleError(err);
                }
            });
        } catch (err) {
            handleError(err);
        }
    }

    // Main function to enable copy/paste everywhere
    function enableCopyPasteEverywhere() {
        enableCopyPaste(document);
        enableCopyPasteInIframes();
    }

    // Initial run
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableCopyPasteEverywhere);
    } else {
        enableCopyPasteEverywhere();
    }

    // Run when page is fully loaded
    window.addEventListener('load', enableCopyPasteEverywhere);

    // Watch for dynamic changes more efficiently
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    enableCopyPaste(node.ownerDocument);
                }
            });
        });
    });

    // Start observing once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    } else {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Fallback periodic check for extra reliability
    setInterval(enableCopyPasteEverywhere, REFRESH_INTERVAL);
})();
