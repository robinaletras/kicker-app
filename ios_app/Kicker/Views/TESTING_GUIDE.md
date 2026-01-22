# 🧪 Testing Your New Free Model

## Quick Test Script (5 Minutes)

### Test 1: First Career (Free)
1. **Launch app** (Cmd+R)
2. **Enter your name** if prompted
3. **Tap "Career Mode"** 
   - ✅ Should see subtitle: "Start free career"
4. **Tap again** to start
5. **Verify lobby shows 10,000 chips**
6. **Tap "Start Game"**
7. **You should start with 10,000 chips** ✅

### Test 2: Play Through Career
1. **Play a few rounds**
2. **Check chips update** between rounds
3. **Either:**
   - Play all 52 rounds, OR
   - Intentionally lose all chips (go all-in and fold)

### Test 3: Career End Screen
1. **See "Year X Complete!" screen**
2. **Verify stats show:**
   - ✅ Total Profit/Loss
   - ✅ Earnings
   - ✅ Final Chips
   - ❌ NO "Borrowed" stat (removed)
3. **Check button at bottom:**
   - Should say "Unlock Career Restarts" (since you haven't purchased)
4. **Tap button** → Opens Store view

### Test 4: Store/IAP Screen
1. **See "Restart Career" screen** with:
   - ✅ Green icon
   - ✅ "Unlock unlimited career restarts" title
   - ✅ Feature list (4 items with icons)
   - ✅ Price button (will show as $0.00 or product name if not configured yet)
2. **Don't purchase yet** (unless testing sandbox)
3. **Tap "Done"** to dismiss

### Test 5: Menu After First Career
1. **Back at main menu**
2. **Career Mode button** should now say:
   - "Purchase to restart" (if not purchased)
3. **Verify "Unlock Restarts" button** appears in menu
4. **Career History button** should appear (1 year completed)

### Test 6: Quick Play (Always Free)
1. **Tap "Quick Play"**
2. **Verify starts with 1,000 chips** (lower than career)
3. **Play a round**
4. **Verify works normally** ✅
5. **Quick Play is unlimited and free** ✅

---

## Advanced Testing (Sandbox IAP)

### Setup Sandbox Account
1. **App Store Connect** → Users and Access → Sandbox Testers
2. **Create Test User:**
   - Email: test+kicker@example.com (use + trick)
   - Password: Something secure
   - Country: Your country
3. **Save credentials**

### Configure Product in App Store Connect
1. **Go to:** Your App → In-App Purchases
2. **Add New:**
   - Type: Non-Consumable
   - Product ID: `com.yourcompany.kicker.career.restart`
   - Reference Name: Career Restart Unlock
   - Price Tier: $2.99 (or your choice)
3. **Fill out:**
   - Display Name: "Unlimited Career Restarts"
   - Description: "Restart your career anytime with 10,000 fresh coins. Unlimited restarts forever!"
4. **Save** and mark as "Ready to Submit"

### Update Product ID in Code
1. **Open:** `StoreManager.swift`
2. **Line 11:** Change to your actual product ID
   ```swift
   static let careerRestart = "com.yourcompany.kicker.career.restart"
   ```
3. **Replace** `com.yourcompany.kicker` with YOUR bundle ID
4. **Save and rebuild** (Cmd+R)

### Test Purchase Flow on Device
1. **Build to physical device** (IAP doesn't work in simulator)
2. **On device:** Settings → App Store → Sandbox Account
3. **Sign in** with your sandbox test account
4. **Launch Kicker app**
5. **Play through a career**
6. **At year end:** Tap "Unlock Career Restarts"
7. **Tap purchase button**
8. **iOS payment sheet** should appear
9. **Authenticate** (Face ID/Touch ID will prompt)
10. **Purchase completes** (no real charge - sandbox)
11. **Verify:** "Already Purchased!" message appears

### Test After Purchase
1. **Complete another career year**
2. **At year end screen:**
   - ✅ Button should now say "Start New Career"
   - ❌ NOT "Unlock Career Restarts"
3. **Tap "Start New Career"**
4. **Confirmation alert** appears
5. **Tap "Restart"**
6. **Verify:**
   - New career starts
   - 10,000 coins given
   - Career round resets to 0/52
7. **Repeat** → Should work unlimited times ✅

---

## Edge Case Testing

### What if App is Closed During Career?
1. **Start a career**
2. **Play a few rounds** (e.g., 5/52)
3. **Force quit app** (swipe up)
4. **Relaunch**
5. **Tap Career Mode**
6. **Should see:** "Continue: 5/52" ✅
7. **Continue game** from where you left off

### What if User Deletes and Reinstalls?
1. **With sandbox purchase made:**
2. **Delete app** from device
3. **Reinstall** from Xcode
4. **Launch app**
5. **Go to Unlock Restarts screen**
6. **Tap "Restore Purchases"**
7. **Verify:** Purchase restored, "Already Purchased!" shows ✅

### What if Two Careers Completed?
1. **Complete first career** (free)
2. **See purchase prompt**
3. **DON'T purchase**
4. **Manually edit:** Can't restart without purchase
5. **Verify:** Career Mode button says "Purchase to restart"
6. **Verify:** Can't start new career without unlocking

---

## Visual Verification Checklist

### Main Menu
- [ ] ❌ NO coin balance display at top
- [ ] ❌ NO "Bank" button
- [ ] ❌ NO "Buy Coins" button
- [ ] ✅ Career Mode button (dynamic subtitle)
- [ ] ✅ Quick Play button
- [ ] ✅ "Unlock Restarts" button (after first career)
- [ ] ✅ Career History button (after completing year)

### Career Year End Screen
- [ ] ✅ Year number and "Complete!" title
- [ ] ✅ Profit/Loss in big text (green or red)
- [ ] ✅ "Earnings" stat
- [ ] ✅ "Final Chips" stat
- [ ] ❌ NO "Borrowed" stat
- [ ] ✅ Button text correct:
  - "Unlock Career Restarts" (not purchased)
  - "Start New Career" (purchased)

### Store/IAP Screen
- [ ] ✅ Green circular icon at top
- [ ] ✅ "Restart Career" title
- [ ] ✅ Four feature rows with icons
- [ ] ✅ Purchase button with price
- [ ] ✅ "Restore Purchases" link
- [ ] ✅ "Already Purchased!" message (if purchased)
- [ ] ❌ NO coin packages
- [ ] ❌ NO coin balance display

### Career History
- [ ] ✅ Summary section at top
- [ ] ✅ Individual years below
- [ ] ✅ Each year shows: Year #, Net Profit, Earnings, Final Balance
- [ ] ❌ NO "Borrowed" column

---

## Common Issues & Fixes

### Issue: Product Won't Load
**Symptoms:** Store shows "Loading..." forever or error

**Fixes:**
1. Verify product is "Ready to Submit" in App Store Connect
2. Check product ID matches exactly (case-sensitive)
3. Wait 5-10 minutes after creating product
4. Delete app and reinstall
5. Check bundle ID matches App Store Connect app

### Issue: Purchase Doesn't Complete
**Symptoms:** Payment sheet doesn't appear

**Fixes:**
1. Test on **physical device** (not simulator)
2. Sign in to sandbox account in device Settings
3. Check product type is "Non-Consumable"
4. Restart device
5. Check device has payment method (even for sandbox)

### Issue: Purchase Not Persisting
**Symptoms:** Shows purchased, then resets

**Fixes:**
1. Check `checkPurchasedProducts()` is called in StoreManager init
2. Verify `careerManager.canRestartCareer = true` is set after purchase
3. Check UserDefaults is saving properly
4. Look for crashes in console

### Issue: Can't Start First Career
**Symptoms:** Button doesn't work or shows wrong text

**Fixes:**
1. Check `canStartFreeCareer()` logic in CareerManager
2. Verify `hasActiveCareer` is false initially
3. Check `careerHistory.isEmpty` is true for new user
4. Reset app: Delete and reinstall

### Issue: Restart Confirmation Not Showing
**Symptoms:** Restarts immediately without prompt

**Fixes:**
1. Check `showRestartPrompt` state variable in MenuView
2. Verify `.alert()` modifier is attached
3. Test the logic in `handleCareerTap()`

---

## Performance Testing

### Memory Leaks
1. **Open Instruments** (Cmd+I)
2. **Choose "Leaks"** template
3. **Run app**
4. **Play through career**
5. **Restart several times**
6. **Check for leaks** → Should be none ✅

### App Size
1. **Archive app** (Product → Archive)
2. **Check size** in Organizer
3. **Should be:** < 50 MB
4. **If larger:** Check for unused assets

### Launch Time
1. **Force quit app**
2. **Launch from cold start**
3. **Time to main menu:** < 2 seconds ✅

---

## User Experience Testing

### Does It Feel Free?
- [ ] No paywalls blocking core gameplay
- [ ] Can complete full career without paying
- [ ] Quick Play unlimited and free
- [ ] Purchase is optional enhancement

### Is IAP Clear and Fair?
- [ ] Clear what you're buying
- [ ] Benefits obvious (unlimited restarts)
- [ ] Price feels reasonable
- [ ] No dark patterns or tricks

### Is Career Restart Worth It?
- [ ] Saves time (no grinding back to 10K)
- [ ] Enables experimentation (try strategies)
- [ ] Convenient (restart anytime)
- [ ] Fair value for price

---

## Before Submitting to App Store

### Final Checks
- [ ] All features work on device
- [ ] IAP configured in App Store Connect
- [ ] Product ID matches in code
- [ ] Sandbox purchase tested successfully
- [ ] No console errors or warnings
- [ ] No crashes during normal use
- [ ] Privacy manifest included
- [ ] Age rating appropriate (12+ for simulated gambling)

### App Store Screenshots
Capture these on simulator (Cmd+S):
1. Main menu (shows free game)
2. Career game in action
3. Year-end results screen
4. IAP unlock screen (show value)
5. Career history (show progression)

### App Store Description
Update to emphasize:
- "Completely Free" in title or early
- "Optional one-time unlock for restarts"
- "No ads, no grinding, fair pricing"

---

## 🎉 Testing Complete Checklist

When you can check all these, you're ready:

- [ ] First career starts free with 10,000 coins
- [ ] Career completion shows year-end screen
- [ ] IAP screen appears at year end
- [ ] Quick Play always accessible
- [ ] Menu shows correct button states
- [ ] Purchased unlock persists
- [ ] Restart works unlimited times after purchase
- [ ] No bank or coin purchase options visible
- [ ] Career history displays correctly
- [ ] No crashes or major bugs

---

**Once all tests pass, you're ready to submit to the App Store!** 🚀

Your new free model is:
- ✅ More user-friendly
- ✅ Fairer pricing
- ✅ Easier to market
- ✅ Apple-compliant
- ✅ Better for conversions

**Great job on the redesign!** 🎉
