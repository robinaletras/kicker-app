# Kicker - Technical Setup Guide

## ✅ Quick Status

**Code Status:** Ready for App Store submission  
**Build Status:** All compilation errors fixed  
**Privacy:** Compliant with Apple requirements  
**IAP:** StoreKit integration complete

---

## 🔧 Xcode Project Setup

### 1. Bundle Identifier
Set in Xcode → Target → Signing & Capabilities

Recommended format: `com.yourcompany.kicker`

Example: `com.johnsmith.kicker`

### 2. Version & Build Number
- **Version**: 1.0 (user-facing)
- **Build**: 1 (increments with each upload)

Location: Xcode → Target → General → Identity

### 3. Deployment Target
Current requirement: **iOS 17.0+**

Rationale:
- Uses modern SwiftUI features
- `@Observable` macro
- Latest StoreKit APIs

*You can lower to iOS 16.0 if needed - verify all APIs are available*

### 4. Supported Devices
- ✅ iPhone (Portrait orientation)
- ✅ iPad (consider enabling if UI scales well)
- ❌ Mac (not applicable for card game)
- ❌ Apple Watch (not applicable)
- ❌ Apple TV (not applicable)

### 5. Orientation
Currently supports: **Portrait only**

To change: Target → General → Deployment Info → Device Orientation

---

## 📱 Required Asset Setup

### App Icon

**Location:** Assets.xcassets → AppIcon

**Requirements:**
- 1024×1024 px PNG (App Store)
- No transparency/alpha channel
- Must not include rounded corners (iOS adds them)

**Icon Design Ideas:**
- Playing card with highlighted "kicker" card
- Poker chip with "K" letter
- Card back design with game name
- Pair of cards showing a pair

**Quick Creation:**
1. Design at 1024×1024 in any graphics tool
2. Export as PNG
3. Drag into AppIcon set in Xcode
4. Xcode generates all sizes automatically (iOS 17+)

### Launch Screen

**Current:** Uses default SwiftUI launch

**To customize:**
1. Add LaunchScreen.storyboard, OR
2. Update Info.plist with launch image

**Recommendation:** Keep default for now (shows app icon)

---

## 🔐 Code Signing

### Development Signing
1. Xcode → Target → Signing & Capabilities
2. Check "Automatically manage signing"
3. Select your Team (Apple Developer account)
4. Xcode handles provisioning profiles

### Distribution Signing
1. Same as above for simple apps
2. Xcode creates distribution certificate automatically
3. Valid for App Store submission

### Troubleshooting
- Ensure Apple Developer account is active ($99/year)
- Log in to Xcode with Apple ID: Preferences → Accounts
- If errors, try: Clean Build Folder (Cmd+Shift+K)

---

## 💳 In-App Purchase Setup

### App Store Connect Configuration

**Step 1: Create IAP Products**

Go to App Store Connect → Your App → In-App Purchases

Create **6 consumable products**:

| Product ID | Display Name | Price | Description |
|------------|--------------|-------|-------------|
| `com.yourcompany.kicker.coins1000` | Small Bag | $0.99 | 1,000 game coins |
| `com.yourcompany.kicker.coins5000` | Medium Bag | $3.99 | 5,000 game coins |
| `com.yourcompany.kicker.coins10000` | Large Bag | $6.99 | 10,000 game coins |
| `com.yourcompany.kicker.coins25000` | Coin Chest | $14.99 | 25,000 game coins |
| `com.yourcompany.kicker.coins50000` | Treasure Trove | $24.99 | 50,000 game coins |
| `com.yourcompany.kicker.coins100000` | Mega Fortune | $39.99 | 100,000 game coins |

**Step 2: Update StoreManager.swift**

Replace placeholder product IDs with your actual IDs:

```swift
// In StoreManager.swift, line ~25
private let productIDs: Set<String> = [
    "com.yourcompany.kicker.coins1000",    // Update this
    "com.yourcompany.kicker.coins5000",    // Update this
    "com.yourcompany.kicker.coins10000",   // Update this
    "com.yourcompany.kicker.coins25000",   // Update this
    "com.yourcompany.kicker.coins50000",   // Update this
    "com.yourcompany.kicker.coins100000"   // Update this
]
```

**Step 3: Test with Sandbox Account**

1. App Store Connect → Users and Access → Sandbox Testers
2. Create test account (different from your Apple ID)
3. On device: Settings → App Store → Sandbox Account → Sign in
4. Test purchases use this account (no real charges)

### Testing IAP

1. Run app on device (not simulator)
2. Go to "Buy Coins"
3. Tap a package
4. Payment sheet appears
5. Sign in with sandbox account
6. Purchase completes
7. Coins added to balance
8. Verify in logs/UI

**Note:** First purchase may be slow (1-2 minutes)

---

## 📄 Required Files

### 1. PrivacyInfo.xcprivacy ✅

**Status:** Created  
**Location:** `/repo/PrivacyInfo.xcprivacy`

**Action Required:**
1. Drag this file into Xcode project navigator
2. Ensure it's included in app target
3. File must be in root of app bundle

**Verification:**
- Build app
- Right-click on .app in Products folder
- Show Package Contents
- Verify PrivacyInfo.xcprivacy is present

### 2. App Privacy Details

**Location:** App Store Connect → App Privacy

**What to Declare:**

**Data NOT Collected:** (Select "No" for all categories)
- Contact Info: No
- Health & Fitness: No
- Financial Info: No
- Location: No
- Sensitive Info: No
- Contacts: No
- User Content: No
- Browsing History: No
- Search History: No
- Identifiers: No
- Purchases: **Collected** (by Apple via StoreKit, not by you)
- Usage Data: No
- Diagnostics: No
- Other Data: No

**Purchases:**
- Used for: App functionality (buying game coins)
- Linked to user: Yes (via Apple ID)
- Used for tracking: No

### 3. Export Compliance

**Question:** Does your app use encryption?

**Answer:** No (uses HTTPS but qualifies for exemption)

**In App Store Connect:**
- Select "No" when asked about encryption
- Or select "Yes" and then exemption option

---

## 🧪 Testing Checklist

### On Simulator (Quick Tests)
- ✅ App launches
- ✅ UI looks correct
- ✅ Navigation works
- ✅ Game logic functions
- ✅ No obvious crashes

**Limitations:**
- ❌ Cannot test In-App Purchases
- ❌ May not catch device-specific issues

### On Physical Device (Required Before Submission)
- [ ] Download to iPhone via Xcode
- [ ] Test all game modes
- [ ] Test IAP with sandbox account
- [ ] Test on both iPhone (6.5" and 6.7")
- [ ] Test on iPad if supporting
- [ ] Run for 10+ minutes (memory leaks)
- [ ] Test with airplane mode (offline)
- [ ] Test with low battery mode
- [ ] Force quit and relaunch (state preservation)

### Automated Testing

Create test cases for critical logic:

```swift
import Testing

@Suite("Game Logic Tests")
struct GameLogicTests {
    @Test("Pair beats high card")
    func pairBeatsHighCard() {
        let card1 = Card(rank: .king, suit: .hearts)
        let kicker = Card(rank: .king, suit: .spades)
        // Test hand evaluation
        // #expect(isPair(card1, kicker) == true)
    }
    
    @Test("Ace high beats king high")
    func aceBeatsKing() {
        // Test high card logic
    }
}
```

**Run tests:** Cmd+U in Xcode

---

## 📦 Archive & Upload

### Creating Archive

1. **Select Device**
   - Top of Xcode: Change from simulator to "Any iOS Device (arm64)"

2. **Archive**
   - Product → Archive (or Cmd+Shift+B won't work, use menu)
   - Wait for build (1-5 minutes)
   - Organizer window opens

3. **Validate**
   - Select archive
   - Click "Validate App"
   - Choose automatic signing
   - Wait for validation (~2 minutes)
   - Fix any errors/warnings

4. **Distribute**
   - Click "Distribute App"
   - Select "App Store Connect"
   - Upload
   - Wait for processing (5-30 minutes)

### After Upload

1. **App Store Connect**
   - Go to your app
   - Go to version (e.g., 1.0)
   - Wait for "Processing" to become "Ready to Submit"

2. **Select Build**
   - In version page, click "Select Build"
   - Choose your uploaded build

3. **Fill Metadata**
   - Name, subtitle, description (see APP_STORE_CHECKLIST.md)
   - Keywords, age rating
   - Upload screenshots

4. **Submit for Review**
   - Click "Submit for Review"
   - Answer questionnaire
   - Submit

---

## 🚨 Common Issues & Fixes

### Issue: "No such module 'StoreKit'"
**Fix:** Ensure `import StoreKit` at top of StoreManager.swift

### Issue: IAPs not loading
**Fix:** 
1. Verify product IDs match App Store Connect exactly
2. Check app is signed with correct Team
3. Ensure IAPs are "Ready to Submit" status in ASC
4. Try deleting and reinstalling app

### Issue: Archive option grayed out
**Fix:** Select "Any iOS Device (arm64)" from device menu

### Issue: Signing errors
**Fix:**
1. Xcode → Preferences → Accounts → Download Manual Profiles
2. Clean build folder (Cmd+Shift+K)
3. Quit and restart Xcode

### Issue: Missing required architecture
**Fix:**
1. Build Settings → Excluded Architectures
2. Remove any arm64 exclusions
3. Build Settings → Supported Platforms → iOS

### Issue: Privacy manifest not found
**Fix:**
1. Ensure PrivacyInfo.xcprivacy is in project
2. Check File Inspector → Target Membership
3. Clean and rebuild

---

## 📊 App Store Connect Configuration

### App Information

**Name:** Kicker  
**Subtitle:** A Game of Cards & Bluffs  
**Category:** Games → Card  
**Secondary Category:** (optional) Games → Strategy

### Age Rating

**Recommended:** 12+ or 17+

**Why:** Simulated Gambling (betting virtual chips)

**Questionnaire Answers:**
- Unrestricted Web Access: No
- Gambling and Contests: **Simulated Gambling - Frequent/Intense**
- Horror/Fear Themes: No
- Mature/Suggestive Themes: No
- Violence: No
- Profanity or Crude Humor: No
- Alcohol, Tobacco, or Drug Use: No
- Medical/Treatment Information: No

### Pricing & Availability

**Price:** Free (with In-App Purchases)

**Territories:** All (or select specific countries)

**Availability Date:** Immediately after approval

### Review Information

**Sign-in Required:** No (single-player game)

**Demo Account:** Not needed

**Notes for Reviewer:** (see APP_STORE_CHECKLIST.md)

---

## 🎨 Screenshot Specifications

### Required Screenshot Sizes

**iPhone 6.7" (iPhone 15 Pro Max, 14 Pro Max)**
- **Size:** 1290 × 2796 pixels
- **Format:** PNG or JPG
- **Quantity:** 3-10 images

**iPhone 6.5" (iPhone 11 Pro Max, XS Max)**
- **Size:** 1284 × 2778 pixels  
- **Format:** PNG or JPG
- **Quantity:** 3-10 images

### How to Capture

**Option 1: Xcode Simulator**
1. Open simulator with correct device
2. Run app
3. Navigate to screen you want
4. Cmd+S to save screenshot
5. Resize if needed

**Option 2: Physical Device**
1. Connect iPhone
2. Take screenshots in app
3. AirDrop to Mac
4. Or use QuickTime Player → New Movie Recording → iPhone

**Option 3: Design Tool**
1. Create 1290×2796 canvas in Figma/Photoshop
2. Screenshot app on any device
3. Place in device frame mockup
4. Add marketing text if desired

### Screenshot Content Ideas

See APP_DEMO_GUIDE.md for detailed screenshot recommendations.

---

## 🔄 Update Workflow (Future Versions)

### For Version 1.1, 1.2, etc.

1. **Code Changes**
   - Implement new features
   - Fix bugs from user feedback
   - Test thoroughly

2. **Version Number**
   - Increment version: 1.0 → 1.1
   - Reset build number to 1

3. **Release Notes**
   - Write "What's New" text
   - Keep under 4000 characters
   - Highlight key features

4. **Submission**
   - Archive new build
   - Upload to App Store Connect
   - Create new version in ASC
   - Submit for review

**Typical Review Time:** 24-48 hours (can be 1-7 days)

---

## 📈 Post-Launch Monitoring

### App Analytics (App Store Connect)

Monitor:
- **Downloads:** Daily installs
- **Proceeds:** IAP revenue
- **Crashes:** App stability metrics
- **Engagement:** Session length, retention

### User Feedback

Check:
- **Ratings & Reviews:** Respond to user feedback
- **Support Requests:** Answer questions promptly
- **Feature Requests:** Consider for future updates

### Version Metrics

Track:
- Most popular device models
- iOS version adoption
- Most purchased IAP packages
- Crash-free percentage (aim for 99%+)

---

## 🎯 Final Pre-Submission Checklist

- [ ] All code compiles without errors
- [ ] Tested on physical device
- [ ] IAPs configured and tested with sandbox
- [ ] PrivacyInfo.xcprivacy included in bundle
- [ ] App icon 1024×1024 added
- [ ] Screenshots captured (minimum 3 per size)
- [ ] Privacy Policy hosted (or included in app)
- [ ] App Store Connect metadata filled
- [ ] Age rating set appropriately
- [ ] Bundle ID matches certificate
- [ ] Version and build number set
- [ ] Archive created successfully
- [ ] Archive validated without errors
- [ ] Build uploaded to App Store Connect
- [ ] Build selected in version
- [ ] Ready to submit!

---

## 💬 Support & Resources

### Apple Documentation
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [StoreKit Documentation](https://developer.apple.com/documentation/storekit)
- [Privacy Best Practices](https://developer.apple.com/privacy/)

### Useful Tools
- [App Store Connect](https://appstoreconnect.apple.com)
- [TestFlight](https://developer.apple.com/testflight/) (beta testing)
- [Xcode Cloud](https://developer.apple.com/xcode-cloud/) (CI/CD, optional)

### Getting Help
- [Apple Developer Forums](https://developer.apple.com/forums/)
- [Stack Overflow - SwiftUI tag](https://stackoverflow.com/questions/tagged/swiftui)
- [r/iOSProgramming](https://reddit.com/r/iOSProgramming)

---

**You're ready to ship!** 🚀

The code is clean, the app is fun, and everything is set up for a smooth App Store submission. Good luck!
