# Kicker App Demo & Walkthrough

## 🎮 What is Kicker?

Kicker is a strategic poker-style card game where each player receives ONE card, plus a shared "kicker" card in the center. Your hand is your card + the kicker card. The goal is to have the highest poker hand and win the pot through smart betting and strategic bluffing.

## 📱 App Flow Demo

### 1. First Launch

**What You See:**
- Beautiful gradient green felt background (poker table aesthetic)
- Large "KICKER" title in gold gradient
- Tagline: "A Game of Cards & Bluffs"
- Coin display showing starting balance (10,000 coins)

**First Action:**
- Tap any game mode → Name entry sheet appears
- Enter your name (e.g., "Alex")
- Name is saved and used throughout the app

### 2. Main Menu

**Buttons Available:**

1. **Career Mode** 
   - "52 rounds per year"
   - Play a full season with progress tracking
   - Results saved to career history

2. **Quick Play**
   - "Jump right in"
   - Single game, no long-term tracking
   - Perfect for casual play

3. **Bank**
   - "Borrow or repay"
   - Borrow coins when low (with interest)
   - Repay loans to avoid accumulating debt

4. **Buy Coins**
   - "Get more coins"
   - In-app purchase store
   - Multiple coin packages available

5. **Career History** (if you've completed any seasons)
   - "X year(s)"
   - View past career performance
   - See profit/loss statistics

---

## 🎯 Quick Play Demo (Fastest Way to See Gameplay)

### Step 1: Lobby Screen

**What You See:**
- Title: "Quick Play"
- Game settings displayed:
  - Ante: 100 chips (minimum bet each round)
  - Starting chips: 2,000
  - Players: 4
- "Start Game" button

**Tap:** Start Game

### Step 2: Game Setup

**Screen Changes to Game Table:**
- **Top**: Opponent's card (face down) - Seat 2
- **Left**: Opponent's card (rotated 90°) - Seat 1  
- **Right**: Opponent's card (rotated -90°) - Seat 3
- **Bottom**: YOUR card (face up - only you can see it)
- **Center**: 
  - POT: Shows current pot amount
  - KICKER: The communal card (face up)
  - "To call:" Shows amount needed to stay in

### Step 3: Gameplay

**A Message Appears:**
- "[Player] deals. Board: [Kicker Card]"
- Example: "Alex deals. Board: K♠"

**Your Turn (if you're first to act):**

Four action buttons appear at the bottom:

1. **Fold** (Red)
   - Give up this round
   - Lose your ante
   - Can watch replay afterwards

2. **Check** (Blue) - if no bet to match
   - Stay in without betting more
   - Pass action to next player

   **OR Call** (Blue) - if there's a bet
   - Match the current bet
   - Stay in the hand
   - Shows amount: "Call 200"

3. **Raise** (Green)
   - Open a sheet with slider
   - Choose raise amount
   - Min/max displayed
   - Increases pressure on opponents

4. **All In** (Orange)
   - Bet all your chips
   - Can't be raised further
   - Maximum pressure play

**AI Opponents:**
- Take turns automatically after 1-3 second delay
- Show messages: 
  - "Morgan bet $300"
  - "Riley called $300"
  - "Jordan folded"
  - "Casey went all-in with $1,500"

### Step 4: Betting Round Continues

**Visual Indicators:**
- Current player's name is **YELLOW**
- Folded players show "FOLDED" in red
- All-in players show "ALL IN" in orange
- Your current bet displays below your chips

**Betting Continues Until:**
- All active players have matched the highest bet
- Only one player remains (others folded)
- All but one player is all-in

### Step 5: Showdown

**When Betting Ends:**
- All remaining players' cards REVEAL
- Cards flip from blue backs to show rank/suit
- Winner is calculated automatically

**Winner Announcement:**
- Yellow banner appears:
  - "Alex Wins!" OR "Split Pot!" (if tie)
  - Reason: "K♠ + A♦ = Pair of Aces"
- Pot is distributed
- Chips update immediately

### Step 6: Round End Options

**Two Buttons Appear:**

1. **Next Round** (Green)
   - Start a fresh hand
   - Dealer rotates clockwise
   - Antes deducted automatically
   - New cards dealt

2. **Replay Round** (Blue)
   - Watch the hand play out again
   - See all cards revealed from the start
   - Understand what opponents had
   - "Stop Replay" button to exit

**Special Case: If You Folded Early**
- Overlay appears: "You've folded"
- Options:
  - **Next Round**: Skip to next hand
  - **Play It Out**: See how it would have ended (replay mode)

---

## 🏆 Career Mode Demo

### Differences from Quick Play:

1. **Season Structure**
   - 52 rounds per "year"
   - Progress bar shows rounds completed
   - "Round X of 52" displayed

2. **Higher Stakes**
   - Antes increase periodically
   - More pressure as season progresses

3. **Career Tracking**
   - Your chip count carries between rounds
   - Net profit/loss calculated
   - End-of-year summary

4. **Year End Screen**
   - Statistics displayed:
     - Total rounds: 52
     - Rounds won: X
     - Win rate: Y%
     - Net profit: +/- Z chips
   - Saved to career history
   - Option to start new year

5. **Leave Button**
   - Available after round ends
   - Saves your progress
   - Returns to main menu

---

## 🏦 Bank Demo

**Why You'd Use It:**
- Run out of chips
- Can't afford ante for next game
- Want to keep playing

**Bank Screen:**

**Current Status:**
- "Loan Balance: $X"
- "Available Credit: $Y"

**Two Sections:**

1. **Borrow Coins**
   - Slider to choose amount
   - Interest rate displayed (10%)
   - "Borrow X coins" button
   - Coins added immediately to your balance

2. **Repay Loan**
   - Enter repayment amount
   - Can pay partial or full
   - Interest calculated on remaining balance
   - "Repay X coins" button

**Limitations:**
- Maximum loan amount: 50,000 coins
- Interest accrues (10% on outstanding balance)
- Can't borrow more if at limit

---

## 🛒 Store Demo (In-App Purchases)

**Store Screen:**

**Six Coin Packages:**

1. **Small Bag** - 1,000 coins
   - $0.99

2. **Medium Bag** - 5,000 coins  
   - $3.99

3. **Large Bag** - 10,000 coins
   - $6.99

4. **Coin Chest** - 25,000 coins
   - $14.99

5. **Treasure Trove** - 50,000 coins
   - $24.99

6. **Mega Fortune** - 100,000 coins
   - $39.99
   - "BEST VALUE" badge

**Each Package Shows:**
- Icon (coin bag/chest)
- Coin amount
- Price
- "Buy Now" button

**Purchase Flow:**
1. Tap "Buy Now"
2. iOS payment sheet appears
3. Authenticate (Face ID/Touch ID/Password)
4. Purchase processes through StoreKit
5. Coins added immediately to balance
6. Confirmation message

**Restore Purchases:**
- Button at bottom
- Restores non-consumable purchases if needed

---

## 📊 Career History Demo

**Shows Past Seasons:**

**Each Year Entry Displays:**
- Year number (#1, #2, etc.)
- Date played
- Total rounds (52)
- Rounds won
- Win rate percentage
- Net profit (in green) or loss (in red)

**Navigation:**
- Scrollable list
- Most recent at top
- Tap to see details (future feature)

---

## 🎴 Game Rules Quick Reference

### Hand Rankings (Highest to Lowest)

With your card + kicker card (2 cards total):

1. **Pair** - Two cards of same rank
   - Example: You have K♠, kicker is K♦ = Pair of Kings

2. **High Card** - No pair
   - Highest card wins
   - Example: You have A♠, kicker is 5♦ = Ace high
   - If tied, kicker doesn't help (it's same for everyone!)

### Betting Terms

- **Ante**: Mandatory bet to start each round
- **Check**: Stay in without betting (when no bet to match)
- **Call**: Match the current bet
- **Raise**: Increase the bet
- **Fold**: Give up this round
- **All-In**: Bet all remaining chips
- **Pot**: Total money bet this round

### Strategy Tips

1. **Pairs are Powerful**
   - If your card matches the kicker, you have a pair
   - Very likely to win unless opponent also has a pair

2. **High Cards Matter**
   - Ace high beats King high (if no pairs)
   - Remember: Everyone has the same kicker!

3. **Bluffing Works**
   - Opponents can't see your card
   - Big bets can make them fold better hands
   - But be careful - going broke ends your career!

4. **Position Matters**
   - Acting last = information advantage
   - See how others bet before deciding

5. **Stack Management**
   - Don't go all-in every hand
   - Preserve chips for future rounds
   - Know when to fold

---

## 🐛 Testing the Demo

### Quick Testing Checklist

1. **Launch & Setup**
   - [ ] Enter name on first launch
   - [ ] See 10,000 starting coins

2. **Quick Play**
   - [ ] Start game with 4 players
   - [ ] See all 4 player positions
   - [ ] Your card visible, others face-down
   - [ ] Kicker card visible in center

3. **Take Actions**
   - [ ] Fold button works
   - [ ] Check/Call button works
   - [ ] Raise sheet opens with slider
   - [ ] All-in button works

4. **Watch AI**
   - [ ] AI players take turns
   - [ ] Messages appear for each action
   - [ ] Pot updates correctly

5. **Showdown**
   - [ ] Cards reveal
   - [ ] Winner announced
   - [ ] Pot distributed

6. **Replay**
   - [ ] "Replay Round" button appears
   - [ ] Replay shows all cards revealed
   - [ ] "Stop Replay" exits

7. **Career Mode**
   - [ ] Progress through multiple rounds
   - [ ] Round counter updates (X/52)
   - [ ] Chips carry between rounds
   - [ ] Year end summary appears

8. **Bank**
   - [ ] Borrow coins
   - [ ] Balance updates
   - [ ] Repay loan
   - [ ] Interest calculated

9. **Store**
   - [ ] All packages displayed
   - [ ] Test purchase in sandbox mode
   - [ ] Coins added after purchase

10. **Edge Cases**
    - [ ] What happens at 0 chips?
    - [ ] Can you start game with 0 chips?
    - [ ] Multiple all-ins in one hand?
    - [ ] Everyone folds to you?

---

## 🎬 Demo Script for Recording

If making an app preview video:

**Scene 1: Launch (5 seconds)**
- Show app icon on home screen
- Tap to launch
- See title screen appear

**Scene 2: Quick Setup (5 seconds)**
- Tap "Quick Play"
- Show lobby screen briefly
- Tap "Start Game"

**Scene 3: Game Action (15 seconds)**
- See game table with your card (Ace)
- Kicker is revealed (King)
- Your turn: Tap "Raise"
- Move slider, tap confirm
- AI players respond
- One folds, one calls

**Scene 4: Showdown (5 seconds)**
- Cards reveal
- You win with pair of Aces!
- Pot comes to you
- Celebration moment

**Scene 5: Features (5 seconds)**
- Quick cut to Career History
- Show multiple completed years
- Cut to Store
- Show coin packages

**Total: 30 seconds (perfect for App Store preview)**

---

## 💡 App Store Screenshots Ideas

### Screenshot 1: Title Screen
- Main menu with "KICKER" title
- All menu buttons visible
- Coin balance showing

### Screenshot 2: Gameplay
- Active game with all 4 players
- Your card is an Ace
- Kicker showing
- Pot visible
- Action buttons at bottom

### Screenshot 3: Winning Moment
- Cards revealed
- "You Win!" banner
- Large pot number
- Visual excitement

### Screenshot 4: Career Mode
- Progress bar showing round 24/52
- Your position highlighted
- Professional tournament feel

### Screenshot 5: Store
- All coin packages in grid
- "Best Value" highlighted
- Professional, trustworthy design

---

## 🎯 Key Selling Points for Demo

1. **Quick to Learn**
   - One card + kicker = simple
   - No complex poker hands
   - New players welcome

2. **Strategic Depth**
   - Bluffing mechanics
   - Position awareness
   - Chip management

3. **Multiple Modes**
   - Quick play for casual
   - Career mode for depth
   - Replay system for learning

4. **Offline Play**
   - No internet required
   - Play anywhere, anytime
   - No waiting for opponents

5. **Fair Monetization**
   - Not pay-to-win
   - Earn coins playing
   - Bank system for safety net
   - Optional purchases only

---

**Ready to submit to the App Store!** 🚀

All the code is working, privacy is handled, and the game is polished. Just need screenshots and you're good to go!
