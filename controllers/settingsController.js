const fs = require('fs');
const path = require('path');

const settingsFilePath = path.join(__dirname, '../data/settings.json');

// Initialize settings file if not exists
function ensureSettingsExist() {
  const dir = path.dirname(settingsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(settingsFilePath)) {
    const defaultSettings = {
      cafeName: "1312 Cafe",
      phone: "+1 234 567 8900",
      email: "contact@1312cafe.com",
      address: "1312 Gourmet St, Culinary City",
      businessHours: {
        open: "08:00",
        close: "22:00",
        days: "Monday - Sunday"
      },
      deliveryCharges: 5.00,
      taxPercentage: 8.0
    };
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
  }
}

// Get Cafe Settings
async function getSettings(req, res, next) {
  try {
    ensureSettingsExist();
    const data = fs.readFileSync(settingsFilePath, 'utf-8');
    const settings = JSON.parse(data);
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

// Update Cafe Settings (Admin only)
async function updateSettings(req, res, next) {
  try {
    ensureSettingsExist();
    const currentData = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    
    const {
      cafeName,
      phone,
      email,
      address,
      businessHours,
      deliveryCharges,
      taxPercentage
    } = req.body;

    const newSettings = {
      cafeName: cafeName !== undefined ? cafeName : currentData.cafeName,
      phone: phone !== undefined ? phone : currentData.phone,
      email: email !== undefined ? email : currentData.email,
      address: address !== undefined ? address : currentData.address,
      businessHours: businessHours !== undefined ? businessHours : currentData.businessHours,
      deliveryCharges: deliveryCharges !== undefined ? parseFloat(deliveryCharges) : currentData.deliveryCharges,
      taxPercentage: taxPercentage !== undefined ? parseFloat(taxPercentage) : currentData.taxPercentage
    };

    fs.writeFileSync(settingsFilePath, JSON.stringify(newSettings, null, 2), 'utf-8');

    res.status(200).json({ success: true, message: 'Settings updated successfully', settings: newSettings });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings,
};
