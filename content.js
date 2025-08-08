// Create a self-executing function to avoid global scope pollution
(function() {
    // Constants
    const REFRESH_INTERVAL = 1000;
    const PROTECTED_EVENTS = ['copy', 'paste', 'cut', 'contextmenu', 'selectstart'];
    const IS_TARGET_SITE = window.location.href.includes('booktypingtechnology.in/page-typing');
    
    // More aggressive handling for target site
    if (IS_TARGET_SITE) {
        // Force disable all protections immediately
        try {
            // Override security functions
            Object.defineProperties(window, {
                onbeforecopy: { value: null, writable: false },
                onbeforecut: { value: null, writable: false },
                onbeforepaste: { value: null, writable: false },
                oncopy: { value: null, writable: false },
                oncut: { value: null, writable: false },
                onpaste: { value: null, writable: false },
                oncontextmenu: { value: null, writable: false },
                onselectstart: { value: null, writable: false },
                ondragstart: { value: null, writable: false }
            });

            // Override core prototypes
            ['copy', 'paste', 'cut', 'contextmenu', 'selectstart', 'dragstart'].forEach(event => {
                document.addEventListener(event, e => {
                    e.stopImmediatePropagation();
                    return true;
                }, { capture: true, passive: false });

                // Remove any existing listeners
                const existingListeners = getEventListeners(document)[event];
                if (existingListeners) {
                    existingListeners.forEach(listener => {
                        document.removeEventListener(event, listener.listener, listener.useCapture);
                    });
                }
            });

            // Disable keyboard protection
            window.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
                    e.stopImmediatePropagation();
                    return true;
                }
            }, { capture: true, passive: false });

            // Force enable copy/paste at document level
            document.designMode = 'on';
            document.execCommand("enableObjectResizing", false, true);
            document.execCommand("enableInlineTableEditing", false, true);
            
            // Add mandatory styles
            const style = document.createElement('style');
            style.innerHTML = `
                * {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                    -webkit-touch-callout: text !important;
                }
            `;
            document.head.appendChild(style);
        } catch (err) {
            console.warn('Initial protection override failed:', err);
        }
    }
    
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

    // Function to force enable selection
    function forceEnableSelection(element) {
        if (IS_TARGET_SITE) {
            const originalDisplay = element.style.display;
            const originalVisibility = element.style.visibility;
            
            // Temporarily make element visible to modify it
            element.style.visibility = 'visible';
            element.style.display = 'block';
            
            // Force enable selection
            element.contentEditable = 'true';
            element.style.userSelect = 'text';
            element.style.webkitUserSelect = 'text';
            element.style.MozUserSelect = 'text';
            element.style.msUserSelect = 'text';
            
            // Restore original visibility
            element.style.display = originalDisplay;
            element.style.visibility = originalVisibility;
        }
    }

    // Function to enable copy/paste for a specific document
    function enableCopyPaste(doc) {
        try {
            const head = doc.head || doc.getElementsByTagName('head')[0];
            
            // Add style to document if not already present
            if (head && !head.contains(style.cloneNode(true))) {
                head.appendChild(style.cloneNode(true));
            }

            if (IS_TARGET_SITE) {
                // Override document methods
                doc.designMode = 'on';
                doc.execCommand('enableObjectResizing', false, true);
                doc.execCommand('enableInlineTableEditing', false, true);
            }

            // Remove copy/paste blocking
            PROTECTED_EVENTS.forEach(event => {
                doc.addEventListener(event, (e) => {
                    e.stopImmediatePropagation();
                    return true;
                }, { capture: true, passive: false });
            });

            // Find elements based on site
            const selector = IS_TARGET_SITE 
                ? '*' // Select all elements on target site
                : 'p, span, div, h1, h2, h3, h4, h5, h6, article, section, pre, code';
            const elements = doc.querySelectorAll(selector);
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
                        
                        // Apply appropriate modifications
                        if (IS_TARGET_SITE) {
                            forceEnableSelection(el);
                        } else {
                            el.setAttribute('data-copyable', 'true');
                        }
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
