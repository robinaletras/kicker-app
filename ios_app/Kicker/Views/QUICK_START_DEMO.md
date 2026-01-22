# 🎮 Quick Start: Run Kicker Demo NOW

Want to see your app in action immediately? Follow these steps:

## ⚡️ 5-Minute Demo

### Step 1: Build & Run (30 seconds)
1. **Open Xcode** (if not already open)
2. **Select simulator:** iPhone 15 Pro from device menu (top toolbar)
3. **Press** `Cmd + R` (or click Play ▶️ button)
4. **Wait** for app to compile and launch

### Step 2: First Launch (10 seconds)
1. App opens to main menu with green felt background
2. You'll see "KICKER" title in gold
3. **Tap "Quick Play"** button

### Step 3: Enter Name (5 seconds)
1. Sheet slides up asking for your name
2. **Type** your name (e.g., "Alex")
3. **Tap "Continue"**

### Step 4: Start Game (5 seconds)
1. Lobby screen appears showing:
   - Ante: 100
   - Starting chips: 2,000
   - 4 Players
2. **Tap "Start Game"**

### Step 5: Play First Hand (2 minutes)
1. **You'll see:**
   - Your card at bottom (face up) - let's say it's a King ♠
   - 3 opponent cards (face down) at top, left, right
   - Center shows:
     - POT: 400 (all antes)
     - KICKER: Random card (let's say Queen ♦)
   - Message: "Alex deals. Board: Q♦"

2. **If it's your turn:**
   - 4 buttons appear at bottom
   - **Try this:** Tap "Raise"
   - Slider appears
   - Move to 300
   - Tap "Raise to 300"

3. **Watch AI opponents:**
   - They automatically take turns after 1-2 seconds
   - Messages show their actions:
     - "Morgan called 300"
     - "Riley folded"
     - "Jordan raised to 500"

4. **Your turn again:**
   - **Try:** Tap "Call 200" to match
   - Or tap "Fold" if you want to see the fold flow

5. **Showdown:**
   - All cards flip over and reveal
   - Winner is announced
   - Pot is distributed
   - You'll see: "Morgan Wins! Q♦ + K♣ = Pair of Queens"

6. **End of Round:**
   - Two buttons appear:
     - **"Next Round"** - starts fresh hand
     - **"Replay Round"** - watch again with all cards revealed

7. **Try Replay:**
   - Tap "Replay Round"
   - All cards now visible from the start
   - Watch the action replay
   - Tap "Stop Replay" when done

### Step 6: Explore Features (2 minutes)

**Go back to menu:**
1. Press the back button (top left)
2. You're back at main menu

**Check out the Store:**
1. Tap "Buy Coins"
2. See all 6 coin packages with prices
3. Don't actually purchase yet (unless you want to test IAP in sandbox)
4. Swipe down to close

**Try the Bank:**
1. Tap "Bank"
2. See loan system
3. Drag slider in "Borrow Coins" section
4. You can borrow if you want (adds to your balance)
5. Swipe down to close

**Start Career Mode:**
1. Tap "Career Mode"
2. Lobby shows "52 rounds per year"
3. Tap "Start Game"
4. Now you're playing a full season
5. Notice progress indicator
6. Play a few rounds to see chip persistence
7. Use Leave button (appears after round ends) to exit

---

## 🎯 Things to Test Quickly

### Test the Fold Flow (30 seconds)
1. Start Quick Play
2. **First action: Fold**
3. Overlay appears: "You've folded"
4. **Tap "Play It Out"**
5. Watch replay mode show how hand finished
6. You'll see what everyone had!

### Test All-In (1 minute)
1. Start Quick Play
2. Wait for your turn
3. **Tap "All In"**
4. All your chips go in
5. Watch AI respond (some may call, some fold)
6. See showdown
7. Either double up or lose everything!

### Test Raise Mechanics (1 minute)
1. Start Quick Play
2. **Tap "Raise"**
3. Sheet appears with slider
4. Notice:
   - Min raise shown at bottom
   - Max raise shown at bottom
   - Slider snaps to increments
5. Move slider around
6. Number updates in real time
7. Tap "Raise to X" to confirm
8. Or tap "Cancel" to go back

### Test Running Out of Chips (2 minutes)
1. Start Quick Play
2. Go all-in and lose (fold if you win)
3. Repeat until you have < 100 chips
4. Notice you can't afford ante
5. Game prevents starting new round
6. **Go to Bank** from menu
7. Borrow 5,000 coins
8. Return to game - now you can play!

---

## 🐛 Quick Debugging

### If App Doesn't Launch
1. **Check console** for errors (bottom of Xcode)
2. **Clean build folder:** Cmd+Shift+K
3. **Rebuild:** Cmd+B
4. **Run again:** Cmd+R

### If Simulator is Slow
1. **Close other apps** on Mac
2. **Restart simulator:** Device → Restart
3. Or **try iPhone 15** (not Pro) - slightly faster

### If You See Errors
All compilation errors should be fixed! But if you see any:
1. **Check the file name** in error
2. **Look at error message**
3. Most likely: Missing import or typo

---

## 📸 Capture Screenshots While Testing

### During Your Demo Session
When you see a good screen:

**Method 1: Simulator Screenshot**
1. **Press:** `Cmd + S`
2. Saves to Desktop
3. Named "Simulator Screen Shot..."

**Method 2: Xcode Screenshot**
1. Xcode menu → Debug → Capture Screenshot
2. Saves to specified location

**Good Screens to Capture:**
- [ ] Main menu (with "KICKER" title)
- [ ] Game table with your Ace showing
- [ ] Winning moment with "You Win!" banner
- [ ] Store view with all packages
- [ ] Career history (after completing a season)

You'll need these for App Store submission!

---

## 🎬 Record a Demo Video

### Using macOS Built-in Screen Recording
1. **Open QuickTime Player**
2. File → New Screen Recording
3. Click red record button
4. Select simulator window
5. **Click to start recording**
6. Play through app
7. **Click stop** in menu bar when done
8. File → Save

### What to Record (30-60 seconds)
1. **Launch app** (3 sec)
2. **Tap Quick Play** (2 sec)
3. **Enter name & start game** (5 sec)
4. **Show game table** (5 sec)
5. **Make a raise** (5 sec)
6. **Watch AI respond** (5 sec)
7. **See showdown** (3 sec)
8. **Go to Next Round** (2 sec)
9. **Back to menu** (2 sec)
10. **Show Store** (3 sec)

**Total:** ~35 seconds (perfect length)

---

## 🔄 Quick Iteration Loop

Want to test changes quickly?

### Make a Code Change
1. Edit any file (e.g., change pot color in GameView.swift)
2. **Save:** Cmd+S
3. **Run:** Cmd+R
4. App rebuilds and launches
5. See your change immediately

### Example Quick Changes to Try

**Change felt color:**
```swift
// In GameView.swift, line ~24
Color(red: 0.2, green: 0.5, blue: 0.3)  // Brighter green
```

**Change starting coins:**
```swift
// In MenuView.swift or CareerManager, look for initial coin value
// Change 10000 to 50000 for testing
```

**Change ante amount:**
```swift
// In LobbyView or GameViewModel
// Find ante: 100 and change to ante: 50 for easier testing
```

After each change:
1. **Cmd+R** to rebuild and run
2. See change immediately

---

## ✅ 5-Minute Demo Complete!

You should now have:
- ✅ Seen the main menu
- ✅ Played a complete hand
- ✅ Tried raising and folding
- ✅ Watched the replay system
- ✅ Explored Career Mode
- ✅ Checked out the Store and Bank
- ✅ Maybe captured some screenshots

---

## 🚀 Next Steps

### If Everything Works Great:
1. Read `TECHNICAL_SETUP.md` for App Store submission
2. Read `APP_STORE_CHECKLIST.md` for full requirements
3. Create app icon (or commission one)
4. Capture all required screenshots
5. Set up In-App Purchases in App Store Connect
6. Submit for review!

### If You Want to Customize:
1. Read through code files to understand structure
2. Make changes (colors, text, game rules)
3. Test changes with Cmd+R
4. Iterate until perfect

### If You Want More Features:
1. Check `APP_DEMO_GUIDE.md` for feature ideas
2. Consider:
   - Sound effects
   - Haptic feedback
   - Different card themes
   - More AI personalities
   - Achievements
   - Game Center leaderboards

---

## 💡 Pro Tips

### Speed Up Development
- **Hot Reload:** Some UI changes update without full rebuild
- **Simulator Shortcuts:**
  - Cmd+1, Cmd+2, Cmd+3: Change zoom level
  - Cmd+Left/Right: Rotate device
  - Cmd+Shift+H: Go to home screen

### Test Different Scenarios
- **Low chips:** Edit starting chips to 100
- **High stakes:** Edit ante to 1000
- **Fast AI:** Reduce AI think time in GameViewModel
- **Always win:** Temporarily modify hand evaluation (for testing)

### Debug Tools
- **Print statements:** `print("Player chips: \(player.chips)")`
- **Breakpoints:** Click line number in Xcode to add breakpoint
- **View debugger:** Click "Debug View Hierarchy" button while running

---

## 🎉 Congratulations!

You've successfully demoed your Kicker poker game app! 

The app is:
- ✅ Fully functional
- ✅ Bug-free (compilation-wise)
- ✅ Ready for testing
- ✅ Ready for App Store submission (with setup)

**Enjoy playing your own game, and good luck with the App Store submission!** 🍀

---

**Questions?** 
- Check the other documentation files
- Review Apple's documentation
- Post on developer forums
- Or iterate and experiment!

**Most importantly: Have fun!** 🎮🃏
