// Inject script to override protection
function injectScript(tabId) {
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
  });
}

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && 
      tab.url.includes('booktypingtechnology.in/page-typing')) {
    injectScript(tabId);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('booktypingtechnology.in/page-typing')) {
    injectScript(tab.id);
  }
});
