// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url.includes('booktypingtechnology.in/page-typing')) {
    // Attach debugger when page starts loading
    chrome.debugger.attach({ tabId }, '1.0', () => {
      // Pause execution immediately
      chrome.debugger.sendCommand({ tabId }, 'Debugger.pause', {}, () => {
        // Enable events we want to intercept
        chrome.debugger.sendCommand({ tabId }, 'Debugger.setBreakpointsActive', { active: true });
      });
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('booktypingtechnology.in/page-typing')) {
    // Toggle debugger state
    chrome.debugger.getTargets((targets) => {
      const target = targets.find(t => t.tabId === tab.id);
      if (target && target.attached) {
        chrome.debugger.detach({ tabId: tab.id });
      } else {
        chrome.debugger.attach({ tabId: tab.id }, '1.0');
      }
    });
  }
});