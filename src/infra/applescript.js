// OS boundary: runs AppleScript to read the active terminal buffer.
// Returns a string on success, null on failure (no permission, non-mac, timeout).

const { exec } = require('child_process');

const SCRIPT = `
  set appName to ""
  set content to ""
  tell application "System Events"
    try
      set appName to name of first application process whose frontmost is true
    end try
  end tell
  if appName is "Terminal" then
    tell application "Terminal"
      try
        set content to contents of selected tab of front window
      end try
    end tell
  else if appName is "iTerm2" then
    tell application "iTerm2"
      try
        set content to text of current session of current tab of current window
      end try
    end tell
  end if
  return content
`;

function getTerminalContent() {
  return new Promise(resolve => {
    if (process.platform !== 'darwin') return resolve(null);
    exec(
      `osascript -e '${SCRIPT.replace(/'/g, "'\\''")}'`,
      { timeout: 4000 },
      (err, stdout) => resolve(err ? null : (stdout || '').trim()),
    );
  });
}

// Returns the name of the frontmost app (e.g. "Code", "zoom.us"), or null.
function getFrontmostApp() {
  return new Promise(resolve => {
    if (process.platform !== 'darwin') return resolve(null);
    exec(
      `osascript -e 'tell application "System Events" to name of first application process whose frontmost is true'`,
      { timeout: 3000 },
      (err, stdout) => resolve(err ? null : (stdout || '').trim() || null),
    );
  });
}

module.exports = { getTerminalContent, getFrontmostApp };
