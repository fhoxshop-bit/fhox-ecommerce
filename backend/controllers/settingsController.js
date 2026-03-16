const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'settings.json');

// Initialize default settings
function initializeSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaultSettings = {
      globalCodEnabled: true,
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf8');
  }
}

function readSettings() {
  try {
    initializeSettings();
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { globalCodEnabled: true };
  }
}

function writeSettings(settings) {
  initializeSettings();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

// Get global COD setting
exports.getGlobalCodSetting = (req, res) => {
  try {
    const settings = readSettings();
    res.json({ globalCodEnabled: settings.globalCodEnabled });
  } catch (error) {
    console.error('Error fetching global COD setting:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update global COD setting
exports.updateGlobalCodSetting = (req, res) => {
  try {
    const { globalCodEnabled } = req.body;
    const settings = readSettings();
    settings.globalCodEnabled = globalCodEnabled;
    writeSettings(settings);
    res.json({ success: true, globalCodEnabled: settings.globalCodEnabled });
  } catch (error) {
    console.error('Error updating global COD setting:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
