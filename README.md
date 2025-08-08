# Enable Copy Paste Extension

A Chrome extension that enables copy and paste functionality on websites that try to prevent it. This extension carefully removes copy/paste restrictions without affecting the website's layout or functionality.

## Features

- Enables text selection and copy/paste on protected websites
- Works with right-click context menu for copy/paste
- Non-intrusive: doesn't modify website appearance
- Supports text inside iframes when possible
- Handles dynamically loaded content

## Installation

1. Clone this repository or download the files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## How it Works

The extension:
- Enables copy/paste by removing restrictions on text elements
- Preserves website layout and functionality
- Only modifies copy/paste related behaviors
- Carefully handles dynamic content updates
- Works with iframe content when possible

## Technical Details

The extension uses targeted techniques to enable copy/paste:
- Selective text element enhancement
- Copy/paste event handler management
- Focused attribute handling
- Smart dynamic content detection
- Non-intrusive CSS modifications

## License

MIT License - Feel free to use and modify as needed.
