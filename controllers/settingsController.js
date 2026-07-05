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
      taxPercentage: 8.0,
      shopLatitude: 19.5786,
      shopLongitude: 72.8223,
      deliveryRangeKm: 10.0,
      deliveryChargePerKm: 10.0,
      signatureProductIds: [],
      popularCategoryIds: [],
      heroImages: [],
      homeHeroTitle: "Where Craft Meets Tranquility",
      homeHeroSubtitle: "Experience premium coffee brewing and fresh artisanal bites crafted with precision, served in our modern aesthetic sanctuary.",
      homeCommunityTitle: "Join the 1312 Community",
      homeCommunityDescription: "We brew artisanal coffee and curate fresh culinary snacks with one simple mission: providing a clean, aesthetic, and welcoming space for creators, thinkers, and coffee connoisseurs.",
      aboutHeroTitle: "Crafting Everyday Sanctuaries",
      aboutHeroImage: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1000&auto=format&fit=crop",
      aboutPhilosophyTitle: "The Philosophy",
      aboutPhilosophyText: "We believe that coffee is more than just a morning caffeine routine. It is a moment of pause, a medium for conversation, and a craft that rewards patience and precision. Every bean we roast and brew is ethically sourced from single-origin cooperatives. Our baristas undergo rigorous training to master temperature, grind size, and extraction timing to bring out the perfect flavor profile in your cup.",
      aboutMainImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop",
      termsTitle: "Terms of Service",
      termsContent: "1. Ordering & Acceptance\nBy placing an order through 1312 Cafe, you agree to buy the selected items at the prices displayed. All orders are subject to availability and kitchen operating hours. We reserve the right to cancel or refuse any order due to stock constraints, pricing errors, or general kitchen capacity limits.\n\n2. Cancellations and Changes\nWe know plans change! You are allowed to cancel your order directly from the tracking page within 10 seconds of submitting the order. Once the 10-second window closes, the order is locked and sent to prep, and cancellations or refunds will no longer be possible.\n\n3. Payments & Billing\nWe support multiple payment choices, including Cash, Card, and UPI.\n- Cash: Cash payments are due at the counter upon picking up your order (Takeaway) or to the driver upon delivery.\n- Card / UPI: Payments must be authorized at checkout. Any promo codes must be applied before final payment.\n\n4. Delivery and Pick Up\nWe provide Takeaway and Home Delivery services:\n- Takeaway: You are responsible for picking up your order from our counter within a reasonable time. We cannot guarantee beverage temperature for late pick ups.\n- Home Delivery: Delivery will be executed to the address supplied during checkout. You must ensure someone is available to receive and pay for the order (if paying via Cash).\n\n5. Terms Revisions\nWe may revise these Terms of Service at any time. Your continued use of our ordering platform constitutes agreement to the updated terms."
    };
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
  } else {
    // Migrate settings: ensure new fields exist
    try {
      const data = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
      let modified = false;
      if (!data.hasOwnProperty('signatureProductIds')) {
        data.signatureProductIds = [];
        modified = true;
      }
      if (!data.hasOwnProperty('popularCategoryIds')) {
        data.popularCategoryIds = [];
        modified = true;
      }
      if (!data.hasOwnProperty('heroImages')) {
        data.heroImages = [];
        modified = true;
      }
      if (!data.hasOwnProperty('homeHeroTitle')) {
        data.homeHeroTitle = "Where Craft Meets Tranquility";
        modified = true;
      }
      if (!data.hasOwnProperty('homeHeroSubtitle')) {
        data.homeHeroSubtitle = "Experience premium coffee brewing and fresh artisanal bites crafted with precision, served in our modern aesthetic sanctuary.";
        modified = true;
      }
      if (!data.hasOwnProperty('homeCommunityTitle')) {
        data.homeCommunityTitle = "Join the 1312 Community";
        modified = true;
      }
      if (!data.hasOwnProperty('homeCommunityDescription')) {
        data.homeCommunityDescription = "We brew artisanal coffee and curate fresh culinary snacks with one simple mission: providing a clean, aesthetic, and welcoming space for creators, thinkers, and coffee connoisseurs.";
        modified = true;
      }
      if (!data.hasOwnProperty('aboutHeroTitle')) {
        data.aboutHeroTitle = "Crafting Everyday Sanctuaries";
        modified = true;
      }
      if (!data.hasOwnProperty('aboutHeroImage')) {
        data.aboutHeroImage = "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1000&auto=format&fit=crop";
        modified = true;
      }
      if (!data.hasOwnProperty('aboutPhilosophyTitle')) {
        data.aboutPhilosophyTitle = "The Philosophy";
        modified = true;
      }
      if (!data.hasOwnProperty('aboutPhilosophyText')) {
        data.aboutPhilosophyText = "We believe that coffee is more than just a morning caffeine routine. It is a moment of pause, a medium for conversation, and a craft that rewards patience and precision. Every bean we roast and brew is ethically sourced from single-origin cooperatives. Our baristas undergo rigorous training to master temperature, grind size, and extraction timing to bring out the perfect flavor profile in your cup.";
        modified = true;
      }
      if (!data.hasOwnProperty('aboutMainImage')) {
        data.aboutMainImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop";
        modified = true;
      }
      if (!data.hasOwnProperty('termsTitle')) {
        data.termsTitle = "Terms of Service";
        modified = true;
      }
      if (!data.hasOwnProperty('shopLatitude')) {
        data.shopLatitude = 19.5786;
        modified = true;
      }
      if (!data.hasOwnProperty('shopLongitude')) {
        data.shopLongitude = 72.8223;
        modified = true;
      }
      if (!data.hasOwnProperty('deliveryRangeKm')) {
        data.deliveryRangeKm = 10.0;
        modified = true;
      }
      if (!data.hasOwnProperty('deliveryChargePerKm')) {
        data.deliveryChargePerKm = 10.0;
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Error migrating settings:', e);
    }
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
      taxPercentage,
      shopLatitude,
      shopLongitude,
      deliveryRangeKm,
      deliveryChargePerKm,
      signatureProductIds,
      popularCategoryIds,
      heroImages,
      homeHeroTitle,
      homeHeroSubtitle,
      homeCommunityTitle,
      homeCommunityDescription,
      aboutHeroTitle,
      aboutHeroImage,
      aboutPhilosophyTitle,
      aboutPhilosophyText,
      aboutMainImage,
      termsTitle,
      termsContent
    } = req.body;

    const newSettings = {
      cafeName: cafeName !== undefined ? cafeName : currentData.cafeName,
      phone: phone !== undefined ? phone : currentData.phone,
      email: email !== undefined ? email : currentData.email,
      address: address !== undefined ? address : currentData.address,
      businessHours: businessHours !== undefined ? businessHours : currentData.businessHours,
      deliveryCharges: deliveryCharges !== undefined ? parseFloat(deliveryCharges) : currentData.deliveryCharges,
      taxPercentage: taxPercentage !== undefined ? parseFloat(taxPercentage) : currentData.taxPercentage,
      shopLatitude: shopLatitude !== undefined ? parseFloat(shopLatitude) : currentData.shopLatitude,
      shopLongitude: shopLongitude !== undefined ? parseFloat(shopLongitude) : currentData.shopLongitude,
      deliveryRangeKm: deliveryRangeKm !== undefined ? parseFloat(deliveryRangeKm) : currentData.deliveryRangeKm,
      deliveryChargePerKm: deliveryChargePerKm !== undefined ? parseFloat(deliveryChargePerKm) : currentData.deliveryChargePerKm,
      signatureProductIds: signatureProductIds !== undefined ? signatureProductIds : (currentData.signatureProductIds || []),
      popularCategoryIds: popularCategoryIds !== undefined ? popularCategoryIds : (currentData.popularCategoryIds || []),
      heroImages: heroImages !== undefined ? heroImages : (currentData.heroImages || []),
      homeHeroTitle: homeHeroTitle !== undefined ? homeHeroTitle : currentData.homeHeroTitle,
      homeHeroSubtitle: homeHeroSubtitle !== undefined ? homeHeroSubtitle : currentData.homeHeroSubtitle,
      homeCommunityTitle: homeCommunityTitle !== undefined ? homeCommunityTitle : currentData.homeCommunityTitle,
      homeCommunityDescription: homeCommunityDescription !== undefined ? homeCommunityDescription : currentData.homeCommunityDescription,
      aboutHeroTitle: aboutHeroTitle !== undefined ? aboutHeroTitle : currentData.aboutHeroTitle,
      aboutHeroImage: aboutHeroImage !== undefined ? aboutHeroImage : currentData.aboutHeroImage,
      aboutPhilosophyTitle: aboutPhilosophyTitle !== undefined ? aboutPhilosophyTitle : currentData.aboutPhilosophyTitle,
      aboutPhilosophyText: aboutPhilosophyText !== undefined ? aboutPhilosophyText : currentData.aboutPhilosophyText,
      aboutMainImage: aboutMainImage !== undefined ? aboutMainImage : currentData.aboutMainImage,
      termsTitle: termsTitle !== undefined ? termsTitle : currentData.termsTitle,
      termsContent: termsContent !== undefined ? termsContent : currentData.termsContent
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
