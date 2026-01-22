# Kicker - App Store Submission Checklist

## ✅ Code Issues Fixed
- [x] Fixed `.allIn` action error in GameView.swift - now properly uses `.bet()` or `.raise()` with all chips

## 📱 App Store Requirements

### 1. App Information
- **App Name**: Kicker
- **Subtitle**: A Game of Cards & Bluffs
- **Category**: Games > Card
- **Version**: 1.0
- **Age Rating**: 4+ (or 12+ if simulated gambling)

### 2. Required Assets

#### App Icon
- [ ] 1024x1024px App Store icon (PNG, no alpha channel)
- [ ] App icon set for all device sizes in Assets.xcassets
- Recommendation: Use a playing card themed icon with a kicker card highlighted

#### Screenshots Required
**iPhone (6.7" display - iPhone 15 Pro Max)**
- [ ] 3-10 screenshots (1290 x 2796 px)

**iPhone (6.5" display - iPhone 11 Pro Max, XS Max)**
- [ ] 3-10 screenshots (1284 x 2778 px)

**iPad Pro (12.9" 6th gen)**
- [ ] 3-10 screenshots (2048 x 2732 px)

#### Recommended Screenshots to Capture:
1. Menu screen showing "KICKER" title
2. Game in progress with cards revealed
3. Career mode selection/lobby
4. Store view with coin packages
5. Career history or end-of-year results

### 3. App Privacy

#### Privacy Manifest (PrivacyInfo.xcprivacy)
- [ ] Create PrivacyInfo.xcprivacy file
- [ ] Declare any required reason APIs used
- [ ] List any third-party SDKs

#### Privacy Policy
- [ ] Create privacy policy (required for App Store Connect)
- [ ] Host on accessible URL
- Since the app appears to be offline-only with UserDefaults, minimal policy needed

### 4. App Store Connect Metadata

#### Description (4000 character max)
```
Master the art of bluffing in KICKER - a strategic card game where one communal card changes everything!

GAME FEATURES:
• Career Mode: Play through an entire year (52 rounds) and build your fortune
• Quick Play: Jump into a game instantly
• Smart AI Opponents: Face off against AI with different skill levels
• Replay System: Watch hands play out after you fold
• Banking System: Borrow coins when you're running low
• Detailed Career History: Track your performance over time

HOW TO PLAY:
Each player receives one card. A communal "kicker" card is revealed in the center. Your final hand is your card PLUS the kicker. The highest hand wins the pot!

Use strategy, psychology, and calculated risks to outplay your opponents. Know when to bet big, when to fold, and when to call their bluff.

PERFECT FOR:
• Poker fans looking for a quick, strategic game
• Anyone who loves bluffing games
• Players who want offline card game fun

No ads. No subscriptions. Just pure card game strategy!
```

#### Keywords (100 character max)
```
poker,cards,bluff,strategy,career,casino,kicker,betting,chips,card game
```

#### Promotional Text (170 character max)
```
The communal kicker card changes everything! Master the bluff, read your opponents, and build your fortune in this strategic card game.
```

### 5. Technical Requirements

#### Build Settings
- [ ] Set appropriate deployment target (iOS 17.0+ recommended based on code)
- [ ] Configure bundle identifier (com.yourcompany.kicker)
- [ ] Set version number (1.0)
- [ ] Set build number (1)
- [ ] Enable "Supports iPad" if targeting iPad
- [ ] Configure proper code signing

#### Capabilities to Check
- [ ] In-App Purchases configured in App Store Connect (for coin packages)
- [ ] Proper entitlements file

#### Testing
- [ ] Test on physical device
- [ ] Test all game modes (Career, Quick Play)
- [ ] Test in-app purchases in sandbox environment
- [ ] Test with airplane mode (offline functionality)
- [ ] Test with different screen sizes
- [ ] Test dark mode (app forces dark mode currently)
- [ ] Verify no crashes or memory leaks

### 6. Legal & Compliance

#### Copyright Notice
- [ ] Add copyright notice to app
- [ ] © 2026 [Your Company Name]

#### Age Rating Considerations
- **Simulated Gambling**: The game involves betting chips/coins
- Recommended: **12+** or **17+** age rating due to simulated gambling
- Answer App Store Connect questionnaire appropriately

#### Terms of Service (Optional but recommended)
- [ ] Create if using in-app purchases
- [ ] Host on accessible URL

### 7. App Store Review Preparation

#### Demo Account
Not needed for this single-player game

#### Review Notes
```
This is a single-player card game with AI opponents. 

HOW TO TEST:
1. Enter your name on first launch
2. Tap "Quick Play" to start immediately
3. The game is "Kicker" - each player has one card plus a shared communal card
4. Bet, call, raise, or fold to win the pot
5. Try "Career Mode" for a 52-round season

IN-APP PURCHASES:
- Coins can be purchased in the "Buy Coins" section
- Test purchases work in sandbox environment
- Coins can also be earned through gameplay

OFFLINE FUNCTIONALITY:
- Game works completely offline
- All data stored locally using UserDefaults
```

### 8. Pre-Submission Code Review

#### Code Quality Checks
- [x] No `.allIn` enum case errors
- [ ] All force unwraps reviewed and handled
- [ ] Memory leaks checked with Instruments
- [ ] No hardcoded test data in production build
- [ ] No console logs in production (or wrapped in #if DEBUG)

#### Localization (Phase 2)
- [ ] English base localization
- [ ] Consider adding Spanish, Chinese, etc.

### 9. Post-Launch Checklist
- [ ] Monitor crash reports in App Store Connect
- [ ] Respond to user reviews
- [ ] Plan version 1.1 features based on feedback

## 🎮 Testing Scenarios

### Critical User Flows
1. **First Time User**
   - Launch app → Enter name → Play quick game → Win/lose round
   
2. **Career Mode**
   - Start career → Play multiple rounds → Check career history → Complete year
   
3. **Banking System**
   - Run low on coins → Visit bank → Borrow coins → Repay later
   
4. **Store**
   - Open store → View packages → Purchase coins (test with sandbox account)

5. **Replay System**
   - Fold early → Choose "Play It Out" → Watch replay → Continue

### Edge Cases to Test
- [ ] What happens when player has 0 coins?
- [ ] Bank loan limits and repayment
- [ ] Career year completion with negative coins
- [ ] All players go all-in
- [ ] Replay with complex betting sequences

## 📋 Final Pre-Upload Checklist

1. [ ] Archive build with "Any iOS Device (arm64)"
2. [ ] Upload to App Store Connect via Xcode
3. [ ] Wait for processing (usually 5-30 minutes)
4. [ ] Select build in App Store Connect
5. [ ] Fill out all metadata
6. [ ] Upload all screenshots
7. [ ] Set pricing (Free + IAP)
8. [ ] Submit for review
9. [ ] Estimated review time: 24-48 hours

## 🚀 Version 1.1 Ideas
- Multiplayer via Game Center
- More AI personalities
- Tournament mode
- Achievement system
- Additional card themes
- Sound effects and music
- Landscape orientation support
- Apple Watch companion app (chip counter)

---

**Questions Before Submission:**
1. Have you set up your Apple Developer account? ($99/year)
2. Have you configured App Store Connect with your app record?
3. Have you set up in-app purchase products for coins?
4. Do you have test devices for final verification?
5. Do you need help with screenshots or app preview videos?
