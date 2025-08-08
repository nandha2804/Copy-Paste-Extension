# Enable Copy Paste Extension

A Chrome extension that enables copy and paste functionality on websites that try to prevent it. This extension removes copy/paste restrictions and text selection blocking from any webpage.

## Features

- Enables text selection on any website
- Allows copying and pasting of text
- Works with right-click context menu
- Supports iframes content
- Handles dynamically loaded content
- Works across all websites
- Maintains selection highlighting

## Installation

1. Clone this repository or download the files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## How it Works

The extension:
- Removes copy/paste blocking event listeners
- Enables text selection through CSS
- Overrides restrictive JavaScript protections
- Monitors for dynamic content changes
- Handles iframe content when possible
- Preserves native copy/paste functionality

## Technical Details

The extension uses various techniques to ensure copy/paste functionality:
- CSS overrides for user-select properties
- Event listener removal and blocking
- Attribute cleanup
- MutationObserver for dynamic content
- Iframe content handling
- ClipboardEvent overrides when needed

## License

MIT License - Feel free to use and modify as needed.
