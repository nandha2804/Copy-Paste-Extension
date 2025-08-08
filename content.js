// Create a self-executing function to avoid global scope pollution
(function() {
    // Constants
    const REFRESH_INTERVAL = 1000;
    const PROTECTED_EVENTS = ['copy', 'paste', 'cut', 'contextmenu', 'selectstart', 'beforepaste', 'beforecopy', 'beforecut'];
    const PROTECTED_ATTRIBUTES = ['unselectable', 'oncopy', 'onpaste', 'oncut', 'onselectstart', 'onbeforecopy', 'onbeforecut', 'onbeforepaste', 'contenteditable', 'data-clipboard-readonly'];
    const IS_TARGET_SITE = window.location.href.includes('booktypingtechnology.in/page-typing');
    
    // More aggressive handling for target site
    if (IS_TARGET_SITE) {
        // Force disable all protections immediately
        try {
            // Override security functions and ensure paste works
            const pasteHandler = function(e) {
                e.stopImmediatePropagation();
                
                try {
                    const activeElement = document.activeElement;
                    if (activeElement && (activeElement.isContentEditable ||
                        activeElement.tagName === 'INPUT' ||
                        activeElement.tagName === 'TEXTAREA')) {
                        
                        let content;
                        // Try HTML first, fallback to plain text
                        try {
                            if (e.clipboardData.types.includes('text/html')) {
                                content = e.clipboardData.getData('text/html');
                                // Sanitize HTML
                                const div = document.createElement('div');
                                div.innerHTML = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                                     .replace(/on\w+="[^"]*"/g, '')
                                                     .replace(/javascript:/gi, '');
                                content = div.innerText || div.textContent;
                            } else {
                                content = e.clipboardData.getData('text/plain');
                            }
                        } catch (err) {
                            content = e.clipboardData.getData('text/plain');
                            console.warn('HTML paste failed, using plain text:', err);
                        }

                        if (content) {
                            if (activeElement.isContentEditable) {
                                const selection = window.getSelection();
                                const range = selection.getRangeAt(0);
                                range.deleteContents();
                                // Create text node with sanitized content
                                const textNode = document.createTextNode(content);
                                range.insertNode(textNode);
                                
                                // Update selection
                                range.setStartAfter(textNode);
                                range.setEndAfter(textNode);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            } else {
                                const start = activeElement.selectionStart || 0;
                                const end = activeElement.selectionEnd || 0;
                                const value = activeElement.value || '';
                                activeElement.value = value.substring(0, start) + content + value.substring(end);
                                activeElement.selectionStart = activeElement.selectionEnd = start + content.length;
                                
                                // Trigger input event for reactivity
                                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Paste handler error:', err);
                }
                
                return true;
            };

            Object.defineProperties(window, {
                onbeforecopy: { value: null, writable: false },
                onbeforecut: { value: null, writable: false },
                onbeforepaste: { value: pasteHandler, writable: false },
                oncopy: { value: null, writable: false },
                oncut: { value: null, writable: false },
                onpaste: { value: pasteHandler, writable: false },
                oncontextmenu: { value: null, writable: false },
                onselectstart: { value: null, writable: false },
                ondragstart: { value: null, writable: false }
            });

            // Override paste-blocking checks
            const originalHasAttribute = Element.prototype.hasAttribute;
            Element.prototype.hasAttribute = function(name) {
                if (name === 'contenteditable' || name === 'data-clipboard-readonly') {
                    return false;
                }
                return originalHasAttribute.apply(this, arguments);
            };

            // Override clipboard permissions and APIs
            navigator.permissions.query = new Proxy(navigator.permissions.query, {
                apply: function(target, thisArg, args) {
                    if (args[0].name === 'clipboard-read' || args[0].name === 'clipboard-write') {
                        return Promise.resolve({ state: 'granted', status: 'granted' });
                    }
                    return target.apply(thisArg, args);
                }
            });
            
            // Override clipboard API comprehensively
            if (navigator.clipboard) {
                // Override read methods
                navigator.clipboard.readText = () => Promise.resolve('');
                navigator.clipboard.read = () => Promise.resolve([]);
                
                // Override write methods
                navigator.clipboard.writeText = text => Promise.resolve(text);
                navigator.clipboard.write = items => Promise.resolve();
                
                // Override events
                navigator.clipboard.addEventListener = () => {};
                navigator.clipboard.removeEventListener = () => {};
                
                // Add additional clipboard capabilities
                const clipboardProxy = new Proxy(navigator.clipboard, {
                    get: (target, prop) => {
                        if (prop === 'read' || prop === 'readText') {
                            return () => Promise.resolve('');
                        }
                        if (prop === 'write' || prop === 'writeText') {
                            return () => Promise.resolve();
                        }
                        return target[prop];
                    }
                });
                
                Object.defineProperty(navigator, 'clipboard', {
                    value: clipboardProxy,
                    writable: false,
                    configurable: false
                });
            }

            // Override document methods and security checks
            const originalExecCommand = document.execCommand;
            document.execCommand = function(command) {
                const cmd = command.toLowerCase();
                if (cmd === 'paste' || cmd === 'copy' || cmd === 'cut') {
                    return true;
                }
                return originalExecCommand.apply(this, arguments);
            };

            // Override additional document security methods
            Object.defineProperties(document, {
                queryCommandSupported: {
                    value: (command) => true,
                    configurable: false
                },
                queryCommandEnabled: {
                    value: (command) => true,
                    configurable: false
                }
            });

            // Override element prototype methods for paste protection
            Element.prototype.matches = new Proxy(Element.prototype.matches, {
                apply: (target, thisArg, args) => {
                    const selector = args[0];
                    if (selector.includes(':not') && 
                        (selector.includes('[contenteditable]') || 
                         selector.includes('user-select') || 
                         selector.includes('pointer-events'))) {
                        return false;
                    }
                    return target.apply(thisArg, args);
                }
            });

            // Add pointer-events override
            const pointerEventsStyle = document.createElement('style');
            pointerEventsStyle.textContent = `
                * {
                    pointer-events: auto !important;
                    -webkit-user-modify: read-write !important;
                    -moz-user-modify: read-write !important;
                }
            `;
            document.head.appendChild(pointerEventsStyle);

            // Override core prototypes and ensure paste works
            ['copy', 'paste', 'cut', 'contextmenu', 'selectstart', 'dragstart'].forEach(event => {
                const handler = (e) => {
                    e.stopImmediatePropagation();
                    if (event === 'paste') {
                        try {
                            const text = e.clipboardData.getData('text/plain');
                            const activeElement = document.activeElement;
                            
                            if (activeElement) {
                                // Handle different types of editable elements
                                if (activeElement.isContentEditable) {
                                    // Handle contentEditable elements
                                    const selection = window.getSelection();
                                    const range = selection.getRangeAt(0);
                                    range.deleteContents();
                                    
                                    const textNode = document.createTextNode(text);
                                    range.insertNode(textNode);
                                    range.setStartAfter(textNode);
                                    range.setEndAfter(textNode);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                } else if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                                    // Handle input/textarea elements
                                    const start = activeElement.selectionStart || 0;
                                    const end = activeElement.selectionEnd || 0;
                                    const value = activeElement.value || '';
                                    activeElement.value = value.substring(0, start) + text + value.substring(end);
                                    activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
                                } else {
                                    // Try to make element editable and paste
                                    activeElement.contentEditable = true;
                                    const range = document.createRange();
                                    const selection = window.getSelection();
                                    range.selectNodeContents(activeElement);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                    
                                    // Insert text at cursor position
                                    const textNode = document.createTextNode(text);
                                    range.deleteContents();
                                    range.insertNode(textNode);
                                }
                                
                                // Dispatch input and change events
                                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                                activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        } catch (err) {
                            console.warn('Paste handler error, trying fallback:', err);
                            
                            // Paste simulation fallback
                            if (activeElement) {
                                try {
                                    // Try multiple paste methods
                                    const methods = [
                                        // Method 1: execCommand
                                        () => document.execCommand('insertText', false, text),
                                        // Method 2: Input event simulation
                                        () => {
                                            const event = new InputEvent('input', {
                                                inputType: 'insertText',
                                                data: text,
                                                bubbles: true,
                                                cancelable: true
                                            });
                                            activeElement.dispatchEvent(event);
                                        },
                                        // Method 3: Direct value manipulation
                                        () => {
                                            if (activeElement.value !== undefined) {
                                                const start = activeElement.selectionStart || 0;
                                                const end = activeElement.selectionEnd || start;
                                                activeElement.value =
                                                    activeElement.value.substring(0, start) +
                                                    text +
                                                    activeElement.value.substring(end);
                                                activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
                                            } else {
                                                activeElement.textContent = text;
                                            }
                                            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                                            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                                        }
                                    ];

                                    // Try each method until one succeeds
                                    for (const method of methods) {
                                        try {
                                            method();
                                            console.log('Paste fallback succeeded');
                                            break;
                                        } catch (e) {
                                            continue;
                                        }
                                    }
                                } catch (fallbackErr) {
                                    console.warn('All paste fallbacks failed:', fallbackErr);
                                }
                            }
                        }
                    }
                    return true;
                };

                const options = { capture: true, passive: false };
                
                // Attach handlers at multiple levels
                document.addEventListener(event, handler, options);
                window.addEventListener(event, handler, options);
                document.documentElement.addEventListener(event, handler, options);
                
                // Handle shadow DOM
                const processShadowDOM = (root) => {
                    if (root instanceof DocumentFragment) {
                        // Attach handler to shadow root
                        root.addEventListener(event, handler, options);
                        
                        // Process all elements in shadow DOM
                        root.querySelectorAll('*').forEach(el => {
                            el.addEventListener(event, handler, options);
                            
                            // Recursively process nested shadow roots
                            if (el.shadowRoot) {
                                processShadowDOM(el.shadowRoot);
                            }
                        });
                    }
                };
                
                // Process existing shadow roots
                document.querySelectorAll('*').forEach(el => {
                    if (el.shadowRoot) {
                        processShadowDOM(el.shadowRoot);
                    }
                });
                
                // Watch for new shadow roots
                const shadowObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && node.shadowRoot) {
                                processShadowDOM(node.shadowRoot);
                            }
                        });
                    });
                });
                
                shadowObserver.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });

                // Remove existing listeners that might block paste
                try {
                    const win = document.defaultView;
                    const listeners = win.getEventListeners && win.getEventListeners(document)[event] || [];
                    listeners.forEach(listener => {
                        if (listener.listener.toString().includes('preventDefault')) {
                            document.removeEventListener(event, listener.listener, listener.useCapture);
                        }
                    });
                } catch (err) {
                    console.warn('Listener removal failed:', err);
                }
            });

            // Disable keyboard protection
            window.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
                    e.stopImmediatePropagation();
                    return true;
                }
            }, { capture: true, passive: false });

            // Force enable editing capabilities
            try {
                document.designMode = 'on';
                document.execCommand("enableObjectResizing", false, true);
                document.execCommand("enableInlineTableEditing", false, true);
                
                // Enable contentEditable on key elements
                const inputs = document.querySelectorAll('input[type="text"], textarea');
                inputs.forEach(input => {
                    input.contentEditable = true;
                    input.addEventListener('paste', (e) => {
                        e.stopImmediatePropagation();
                        const text = e.clipboardData.getData('text/plain');
                        const start = input.selectionStart;
                        const end = input.selectionEnd;
                        input.value = input.value.substring(0, start) + text + input.value.substring(end);
                        input.selectionStart = input.selectionEnd = start + text.length;
                        e.preventDefault();
                    }, true);
                });
            } catch (err) {
                console.warn('Edit mode setup failed:', err);
            }
            
            // Add comprehensive style overrides
            const style = document.createElement('style');
            style.innerHTML = `
                * {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                    -webkit-touch-callout: text !important;
                    -webkit-user-modify: read-write !important;
                    -moz-user-modify: read-write !important;
                    user-modify: read-write !important;
                    pointer-events: auto !important;
                    cursor: text !important;
                }
                
                input, textarea, [contenteditable="true"] {
                    -webkit-user-select: text !important;
                    user-select: text !important;
                    -webkit-user-modify: read-write-plaintext-only !important;
                    -moz-user-modify: read-write-plaintext-only !important;
                    user-modify: read-write-plaintext-only !important;
                }
                
                :not(input):not(textarea) {
                    -webkit-user-select: text !important;
                    user-select: text !important;
                }
            `;
            document.head.appendChild(style);
            
            // Override CSS property getters
            const originalGetComputedStyle = window.getComputedStyle;
            window.getComputedStyle = new Proxy(originalGetComputedStyle, {
                apply: function(target, thisArg, args) {
                    const style = target.apply(thisArg, args);
                    const handler = {
                        get: function(target, property) {
                            if (['userSelect', 'webkitUserSelect', 'pointerEvents'].includes(property)) {
                                return 'text';
                            }
                            return target[property];
                        }
                    };
                    return new Proxy(style, handler);
                }
            });
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
                        
            // Remove protection related attributes
            PROTECTED_ATTRIBUTES.forEach(attr => {
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

    // Function to handle iframes more aggressively
    function enableCopyPasteInIframes() {
        try {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                try {
                    // Try multiple methods to access iframe content
                    let doc;
                    try {
                        // Try standard access
                        doc = iframe.contentDocument;
                    } catch (e) {
                        // Try to handle cross-origin iframe
                        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
                        doc = iframe.contentDocument;
                    }

                    if (doc) {
                        enableCopyPaste(doc);
                        
                        // Add comprehensive event handlers
                        ['paste', 'beforepaste'].forEach(eventType => {
                            iframe.addEventListener(eventType, (e) => {
                            e.stopImmediatePropagation();
                            const text = e.clipboardData.getData('text/plain');
                            
                            // Try to find active element in iframe
                            const activeElement = doc.activeElement;
                            if (activeElement) {
                                // Make element editable if it isn't already
                                if (!activeElement.isContentEditable) {
                                    activeElement.contentEditable = true;
                                }
                                
                                try {
                                    // Try multiple paste methods
                                    if (activeElement.value !== undefined) {
                                        // Handle input/textarea
                                        const start = activeElement.selectionStart || 0;
                                        const end = activeElement.selectionEnd || 0;
                                        activeElement.value = activeElement.value.substring(0, start) + 
                                            text + activeElement.value.substring(end);
                                        activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
                                    } else {
                                        // Handle contenteditable or other elements
                                        const selection = doc.getSelection();
                                        const range = selection.getRangeAt(0);
                                        range.deleteContents();
                                        const textNode = doc.createTextNode(text);
                                        range.insertNode(textNode);
                                        range.setStartAfter(textNode);
                                        range.setEndAfter(textNode);
                                        selection.removeAllRanges();
                                        selection.addRange(range);
                                    }

                                    // Trigger appropriate events
                                    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                                    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                                } catch (pasteErr) {
                                    // Fallback: Try execCommand
                                    doc.execCommand('insertText', false, text);
                                }
                            }
                            }, { capture: true, passive: false });
                        });
                        
                        // Monitor iframe content changes with enhanced error handling
                        const iframeObserver = new MutationObserver((mutations) => {
                            enableCopyPaste(doc);
                        });
                        
                        iframeObserver.observe(doc.body, {
                            childList: true,
                            subtree: true
                        });
                    }
                } catch (err) {
                    // Try multiple fallback approaches for inaccessible iframes
                    try {
                        // Attempt to make iframe accessible
                        const attempts = [
                            () => { iframe.src = 'javascript:void(0)'; },
                            () => { iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts'); },
                            () => { iframe.setAttribute('security', 'restricted'); }
                        ];

                        for (let attempt of attempts) {
                            try {
                                attempt();
                                enableCopyPaste(iframe.contentDocument);
                                break;
                            } catch (e) {
                                continue;
                            }
                        }
                    } catch (e) {
                        handleError(e);
                    }
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
