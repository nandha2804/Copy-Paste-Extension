// Inject script to override protection
function injectScript(tabId) {
  // First check if tab exists
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.warn('Tab not found:', chrome.runtime.lastError.message);
      return;
    }
    
    // Proceed with injection if tab exists
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
      // Override security functions
      const overrides = {
        addEventListener: EventTarget.prototype.addEventListener,
        setAttribute: Element.prototype.setAttribute,
        appendChild: Element.prototype.appendChild
      };

      // Override event listener to allow copy/paste
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (!['copy', 'paste', 'cut', 'contextmenu', 'keydown', 'keyup', 'select', 'selectstart'].includes(type)) {
          return overrides.addEventListener.call(this, type, listener, options);
        }
      };

      // Override setAttribute to prevent copy blocking
      Element.prototype.setAttribute = function(name, value) {
        if (!['unselectable', 'style', 'oncontextmenu', 'oncopy', 'oncut', 'onpaste', 'onselectstart'].includes(name)) {
          return overrides.setAttribute.call(this, name, value);
        }
      };

      // Force enable selection and copy
      document.documentElement.style.setProperty('-webkit-user-select', 'text', 'important');
      document.documentElement.style.setProperty('user-select', 'text', 'important');
      }
    }).catch(err => {
      console.warn('Script injection failed:', err.message);
    });
  });
}

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && tab.url && 
        tab.url.includes('booktypingtechnology.in/page-typing')) {
      injectScript(tabId);
    }
  } catch (err) {
    console.warn('Tab update handling failed:', err.message);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  try {
    if (tab && tab.id && tab.url && tab.url.includes('booktypingtechnology.in/page-typing')) {
      injectScript(tab.id);
    }
  } catch (err) {
    console.warn('Extension icon click handling failed:', err.message);
  }
});
