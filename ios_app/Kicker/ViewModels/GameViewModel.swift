import Foundation
import SwiftUI
import Combine

@MainActor
class GameViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var players: [Player] = []
    @Published var deck: [Card] = []
    @Published var communalCard: Card?
    @Published var pot: Int = 0
    @Published var rolloverPot: Int = 0
    @Published var currentPlayerIndex: Int = 0
    @Published var currentBetAmount: Int = 0
    @Published var dealer: Int = 0
    @Published var revealOrder: [Int] = []
    @Published var revealPhase: Int = 0
    @Published var message: String = ""
    @Published var gamePhase: GamePhase = .setup
    @Published var winner: Winner?
    @Published var isRollover: Bool = false
    @Published var lastRaiser: Int = -1
    @Published var bettingRoundStarter: Int = 0
    @Published var revealedCards: Set<Int> = []
    @Published var showPlayItOut: Bool = false
    @Published var sidePots: [SidePot] = []  // Side pots for all-in situations

    // Replay system
    @Published var roundHistory: [RecordedAction] = []
    @Published var roundStartState: RoundStartState?
    @Published var isReplaying: Bool = false
    @Published var replayIndex: Int = 0

    // AI settings
    @Published var aiSpeed: Double = 1.5 // Realistic delays for AI appearing human

    // Turn timer
    @Published var turnTimeRemaining: Double = 15.0
    @Published var turnTimerActive: Bool = false
    private var turnTimerTask: Task<Void, Never>?
    let turnTimeLimit: Double = 15.0

    // Local player index (the human playing on this device)
    var localPlayerIndex: Int = 0

    // Constants
    let ante: Int = 1
    let minRaiseAmount: Int = 1

    private var aiActionTask: Task<Void, Never>?
    private var replayTask: Task<Void, Never>?

    deinit {
        turnTimerTask?.cancel()
        aiActionTask?.cancel()
        replayTask?.cancel()
    }

    // MARK: - Computed Properties
    var currentPlayer: Player? {
        guard currentPlayerIndex >= 0 && currentPlayerIndex < players.count else { return nil }
        return players[currentPlayerIndex]
    }

    var activePlayers: [Player] {
        players.filter { $0.isActive }
    }

    var playersWhoCanAct: [Player] {
        players.filter { $0.canAct }
    }

    var toCall: Int {
        guard let player = currentPlayer else { return 0 }
        return min(currentBetAmount - player.currentBet, player.chips)
    }

    // Aliases for GameView compatibility
    var currentBet: Int { currentBetAmount }
    var phase: GamePhase { gamePhase }
    var isReplayMode: Bool { isReplaying }
    var currentMessage: String? { message.isEmpty ? nil : message }
    var hasRecordedRound: Bool { !roundHistory.isEmpty }

    var isLocalPlayerTurn: Bool {
        guard let player = players[safe: localPlayerIndex] else { return false }
        return currentPlayerIndex == localPlayerIndex &&
            !player.hasFolded &&
            !player.isAllIn &&
            player.chips > 0  // Player with 0 chips is auto-handled
    }

    var minRaise: Int {
        max(minRaiseAmount, currentBetAmount > 0 ? currentBetAmount : ante)
    }

    func maxRaise(for playerIndex: Int) -> Int {
        guard let player = players[safe: playerIndex] else { return 0 }
        let toCallAmount = currentBetAmount - player.currentBet
        return max(0, player.chips - toCallAmount)
    }

    func canRaise(playerIndex: Int) -> Bool {
        guard let player = players[safe: playerIndex] else { return false }
        let toCallAmount = currentBetAmount - player.currentBet
        return player.chips > toCallAmount
    }

    var canCheckVar: Bool {
        currentBetAmount == 0
    }

    var canBet: Bool {
        currentBetAmount == 0
    }

    var canCallVar: Bool {
        toCall > 0
    }

    var canRaiseVar: Bool {
        currentBetAmount > 0
    }

    // MARK: - Setup
    func setupGame(playerNames: [String], isAI: [Bool], startingChips: Int = 50) {
        var usedNames: [String] = []
        players = (0..<4).map { i in
            let name: String
            let aiLevel: AISkillLevel?

            if isAI[i] {
                name = Player.randomAIName(excluding: usedNames)
                usedNames.append(name)
                aiLevel = .random()
            } else {
                name = playerNames[i]
                aiLevel = nil
            }

            return Player(
                name: name,
                chips: startingChips,
                aiLevel: aiLevel
            )
        }

        localPlayerIndex = isAI.firstIndex(of: false) ?? 0
        dealer = 0
        rolloverPot = 0
        gamePhase = .setup
        revealedCards = []
        showPlayItOut = false

        // Auto-start the first round
        dealCards()
    }

    func dismissPlayItOut() {
        showPlayItOut = false
    }

    func startNewRound() {
        nextRound()
        dealCards()
    }

    // MARK: - Deal Cards
    func dealCards() {
        deck = Card.createDeck()
        guard let communal = deck.popLast() else { return }
        communalCard = communal

        // Set reveal order (clockwise from dealer)
        revealOrder = (1...4).map { (dealer + $0) % 4 }

        // Deal cards and collect antes
        var playingCount = 0
        for i in 0..<players.count {
            if !players[i].eliminated && players[i].chips >= 1 {
                players[i].card = deck.popLast()
                players[i].chips -= 1
                players[i].totalRoundBet = 1
                players[i].folded = false
                players[i].revealed = false
                players[i].currentBet = 0
                players[i].allIn = false
                players[i].peekedCards = []
                playingCount += 1
            } else {
                players[i].folded = true
            }
        }

        pot = playingCount + rolloverPot

        // Find first player to act
        var firstToAct = (dealer + 1) % 4
        var attempts = 0
        while (players[firstToAct].eliminated || players[firstToAct].folded) && attempts < 4 {
            firstToAct = (firstToAct + 1) % 4
            attempts += 1
        }

        currentPlayerIndex = firstToAct
        currentBetAmount = 0
        revealPhase = 0
        lastRaiser = -1
        bettingRoundStarter = firstToAct
        winner = nil
        isRollover = false
        isReplaying = false
        replayIndex = 0
        roundHistory = []
        sidePots = []
        revealedCards = []  // Clear revealed cards for new round

        // Save round start state
        roundStartState = RoundStartState(
            players: players,
            pot: pot,
            currentPlayer: firstToAct,
            communalCard: communal,
            revealOrder: revealOrder
        )

        let rolloverText = rolloverPot > 0 ? " (+$\(rolloverPot) rollover!)" : ""
        message = "\(players[dealer].name) deals. Board: \(communal.displayName)\(rolloverText)"

        gamePhase = .passing(playerIndex: firstToAct)
    }

    // MARK: - Player Actions
    func handleAction(_ action: PlayerAction, from playerIndex: Int) {
        // Set current player to the specified index if it's their turn
        if playerIndex == currentPlayerIndex {
            handleAction(action)
        }
    }

    func handleAction(_ action: PlayerAction) {
        guard currentPlayerIndex >= 0 && currentPlayerIndex < players.count else { return }
        let player = players[currentPlayerIndex]
        var actionMessage = ""

        // Stop timer when action is taken
        stopTurnTimer()

        switch action {
        case .bet(let amount):
            let actualBet = min(amount, player.chips)
            guard actualBet > 0 else { return }
            let isAllIn = actualBet >= player.chips
            players[currentPlayerIndex].placeBet(actualBet)
            pot += actualBet
            currentBetAmount = actualBet
            lastRaiser = currentPlayerIndex
            actionMessage = "\(player.name) \(isAllIn ? "went all-in with" : "bet") $\(actualBet)"
            message = actionMessage

            if !isReplaying {
                recordAction(action, message: actionMessage)
            }
            advanceToNextPlayer()
            return

        case .call:
            let wantToCall = currentBetAmount - player.currentBet
            let actualCall = min(wantToCall, player.chips)
            let isAllIn = actualCall >= player.chips
            let isPartialCall = isAllIn && actualCall < wantToCall

            players[currentPlayerIndex].placeBet(actualCall)
            pot += actualCall

            if isPartialCall {
                // Player couldn't match full bet - they're all-in for less
                // Side pots will be calculated at showdown based on contributions
                actionMessage = "\(player.name) is all-in for $\(actualCall) (can't match full bet)"
            } else if isAllIn {
                actionMessage = "\(player.name) went all-in with $\(actualCall)"
            } else {
                actionMessage = "\(player.name) called $\(actualCall)"
            }
            message = actionMessage

        case .raise(let amount):
            let maxRaise = player.chips - toCall
            let actualRaise = min(amount, maxRaise)
            if actualRaise <= 0 {
                // Can't raise, just call all-in
                let actualCall = min(toCall, player.chips)
                players[currentPlayerIndex].placeBet(actualCall)
                pot += actualCall
                actionMessage = "\(player.name) went all-in with $\(actualCall)"
                message = actionMessage

                if !isReplaying {
                    recordAction(.call, message: actionMessage)
                }
                advanceToNextPlayer()
                return
            }
            let totalCost = toCall + actualRaise
            let newBetAmount = currentBetAmount + actualRaise
            let isAllIn = totalCost >= player.chips
            players[currentPlayerIndex].placeBet(totalCost)
            pot += totalCost
            currentBetAmount = newBetAmount
            lastRaiser = currentPlayerIndex
            actionMessage = "\(player.name) \(isAllIn ? "went all-in, raising to" : "raised to") $\(newBetAmount)"
            message = actionMessage

            if !isReplaying {
                recordAction(action, message: actionMessage)
            }
            advanceToNextPlayer()
            return

        case .check:
            actionMessage = "\(player.name) checked"
            message = actionMessage

        case .fold:
            players[currentPlayerIndex].folded = true
            actionMessage = "\(player.name) folded"
            message = actionMessage

        case .peek:
            guard let peeked = deck.popLast() else { return }
            players[currentPlayerIndex].peekedCards.append(peeked)
            players[currentPlayerIndex].chips -= 1
            pot += 1
            message = "\(player.name) peeked at a card"
            return

        case .allIn:
            // Go all-in with all remaining chips
            let allInAmount = player.chips
            guard allInAmount > 0 else { return }

            players[currentPlayerIndex].placeBet(allInAmount)
            pot += allInAmount

            // Determine if this is a bet, call, or raise
            let newTotal = player.currentBet + allInAmount
            if currentBetAmount == 0 {
                // It's a bet
                currentBetAmount = newTotal
                lastRaiser = currentPlayerIndex
            } else if newTotal > currentBetAmount {
                // It's a raise
                currentBetAmount = newTotal
                lastRaiser = currentPlayerIndex
            }
            // Otherwise it's a call (possibly partial)

            actionMessage = "\(player.name) is ALL IN with $\(allInAmount)!"
            message = actionMessage

            if !isReplaying {
                recordAction(action, message: actionMessage)
            }
            advanceToNextPlayer()
            return
        }

        if !isReplaying && !actionMessage.isEmpty {
            recordAction(action, message: actionMessage)
        }

        advanceToNextPlayer()
    }

    private func recordAction(_ action: PlayerAction, message: String, revealedIndex: Int? = nil) {
        let entry = RecordedAction(
            action: action,
            playerIndex: currentPlayerIndex,
            message: message,
            playersAfter: players,
            potAfter: pot,
            revealedCardIndex: revealedIndex
        )
        roundHistory.append(entry)
    }

    // MARK: - Advance Game
    private func advanceToNextPlayer() {
        // Check for single winner
        if activePlayers.count == 1 {
            endRound()
            return
        }

        // Check if no one can act
        if playersWhoCanAct.isEmpty {
            endRound()
            return
        }

        // Check if all humans folded (only AI left)
        if checkAllHumansFolded() && !isReplaying {
            simulateAndEndRound()
            return
        }

        // Check if only one player can act
        if playersWhoCanAct.count == 1 {
            revealNextCard()
            return
        }

        // Find next active player
        let nextPlayer = findNextActivePlayer(from: currentPlayerIndex)
        guard nextPlayer != -1 else {
            endRound()
            return
        }

        // Determine check player
        var checkPlayer = lastRaiser >= 0 ? lastRaiser : bettingRoundStarter
        if players[checkPlayer].folded || players[checkPlayer].eliminated {
            checkPlayer = findNextActivePlayer(from: checkPlayer - 1)
            if checkPlayer == -1 { checkPlayer = bettingRoundStarter }
        }

        let allMatched = activePlayers.allSatisfy { $0.currentBet == currentBetAmount || $0.folded }

        // Check if betting round is complete
        if (nextPlayer == checkPlayer && allMatched && currentBetAmount > 0) ||
           (nextPlayer == checkPlayer && currentBetAmount == 0) {
            revealNextCard()
            return
        }

        currentPlayerIndex = nextPlayer
        gamePhase = .playing

        // Handle the new player's turn (auto-act if AI or broke)
        handleCurrentPlayerTurn()
    }

    private func findNextActivePlayer(from index: Int) -> Int {
        var next = (index + 1) % 4
        var attempts = 0
        while (players[next].folded || players[next].eliminated || players[next].allIn) && attempts < 4 {
            next = (next + 1) % 4
            attempts += 1
        }
        return attempts >= 4 ? -1 : next
    }

    private func checkAllHumansFolded() -> Bool {
        let activeHumans = activePlayers.filter { !$0.isAI }
        let activeAIs = activePlayers.filter { $0.isAI }
        return activeHumans.isEmpty && activeAIs.count >= 2
    }

    private func revealNextCard() {
        var revealerIndex = -1
        for idx in revealOrder {
            if !players[idx].revealed && !players[idx].eliminated {
                revealerIndex = idx
                break
            }
        }

        if revealerIndex == -1 {
            endRound()
            return
        }

        players[revealerIndex].revealed = true
        revealedCards.insert(revealerIndex)
        let revealer = players[revealerIndex]
        let foldedNote = revealer.folded ? " (folded)" : ""
        let revealMsg = "\(revealer.name) reveals: \(revealer.card?.displayName ?? "?")\(foldedNote)"
        message = revealMsg

        if !isReplaying {
            recordAction(.check, message: revealMsg, revealedIndex: revealerIndex)
        }

        revealPhase += 1
        startNextBettingRound()
    }

    private func startNextBettingRound() {
        // Reset current bets
        for i in 0..<players.count {
            players[i].currentBet = 0
        }
        currentBetAmount = 0
        lastRaiser = -1

        // Find first non-folded player
        var starter = 0
        while starter < 4 && players[starter].folded {
            starter += 1
        }

        if starter >= 4 {
            endRound()
            return
        }

        bettingRoundStarter = starter
        currentPlayerIndex = starter
        gamePhase = .playing

        // Handle the starter's turn
        handleCurrentPlayerTurn()
    }

    // MARK: - End Round
    func endRound() {
        // Reveal all cards
        for i in 0..<players.count {
            players[i].revealed = true
            revealedCards.insert(i)
        }

        // Calculate and distribute pots (handles side pots)
        let pots = calculatePots()
        sidePots = pots

        // Check for rollover first (no clear winner)
        let result = determineWinner()

        if result.rollover {
            // Rollover - add entire pot to next round
            rolloverPot += pot
            isRollover = true
            winner = result
        } else {
            // Distribute each pot to appropriate winner(s)
            distributePots(pots)
            rolloverPot = 0
            winner = result
        }

        gamePhase = .winner
    }

    /// Calculate pots based on player contributions (handles side pots)
    private func calculatePots() -> [SidePot] {
        // Get contributions from players who haven't folded
        var contributions: [(index: Int, amount: Int)] = []
        for i in 0..<players.count {
            if !players[i].folded && players[i].totalRoundBet > 0 {
                contributions.append((i, players[i].totalRoundBet))
            }
        }

        // Also include folded players' contributions (they forfeit but it goes to pot)
        for i in 0..<players.count {
            if players[i].folded && players[i].totalRoundBet > 0 {
                contributions.append((i, players[i].totalRoundBet))
            }
        }

        if contributions.isEmpty {
            return [SidePot(amount: pot + rolloverPot, eligiblePlayerIndices: Set(0..<4), cappedAt: 0)]
        }

        // Get unique contribution levels (sorted)
        let levels = Array(Set(contributions.map { $0.amount })).sorted()

        var pots: [SidePot] = []
        var previousLevel = 0

        for level in levels {
            // Players eligible for this pot level (contributed at least this much AND not folded)
            let eligible = Set(contributions.filter { $0.amount >= level && !players[$0.index].folded }.map { $0.index })

            if eligible.isEmpty { continue }

            // Amount for this pot tier
            let contributorsAtThisLevel = contributions.filter { $0.amount >= level }.count
            let amountPerPlayer = level - previousLevel
            let potAmount = amountPerPlayer * contributorsAtThisLevel

            if potAmount > 0 {
                pots.append(SidePot(amount: potAmount, eligiblePlayerIndices: eligible, cappedAt: level))
            }

            previousLevel = level
        }

        // Add rollover to main pot
        if !pots.isEmpty && rolloverPot > 0 {
            pots[0].amount += rolloverPot
        }

        return pots
    }

    /// Distribute pots to winners
    private func distributePots(_ pots: [SidePot]) {
        guard let board = communalCard else { return }

        for pot in pots {
            // Find winner among eligible players
            let eligiblePlayers = pot.eligiblePlayerIndices.compactMap { idx -> Player? in
                let p = players[idx]
                return p.isActive ? p : nil
            }

            if eligiblePlayers.isEmpty { continue }
            if eligiblePlayers.count == 1 {
                // Only one eligible player - they get it
                if let idx = players.firstIndex(where: { $0.id == eligiblePlayers[0].id }) {
                    players[idx].chips += pot.amount
                }
                continue
            }

            // Find best hand among eligible
            let potWinner = findWinnerAmong(eligiblePlayers, board: board)

            if potWinner.isSplit, let winners = potWinner.winningPlayers {
                let share = pot.amount / winners.count
                for w in winners {
                    if let idx = players.firstIndex(where: { $0.id == w.id }) {
                        players[idx].chips += share
                    }
                }
            } else if let winnerPlayer = eligiblePlayers.first(where: { $0.name == potWinner.name }) {
                if let idx = players.firstIndex(where: { $0.id == winnerPlayer.id }) {
                    players[idx].chips += pot.amount
                }
            }
        }
    }

    /// Find winner among a subset of players
    private func findWinnerAmong(_ candidates: [Player], board: Card) -> Winner {
        // Check for pairs with board
        let pairsWithBoard = candidates.filter { $0.card?.value == board.value }

        if pairsWithBoard.count == 1 {
            let w = pairsWithBoard[0]
            return Winner(name: w.name, isSplit: false, reason: "Pairs with board", rollover: false)
        }

        if pairsWithBoard.count > 1 {
            let names = pairsWithBoard.map { $0.name }.joined(separator: " & ")
            return Winner(name: names, isSplit: true, reason: "Both pair with board", rollover: false, winningPlayers: pairsWithBoard)
        }

        // Check for pairs between players
        var cardCounts: [Int: [Player]] = [:]
        for player in candidates {
            if let value = player.card?.value {
                cardCounts[value, default: []].append(player)
            }
        }

        let playerPairs = cardCounts.filter { $0.value.count >= 2 }
        if !playerPairs.isEmpty {
            // Pairs between players - this pot rolls over
            return Winner(name: "Tie", isSplit: false, reason: "Pair between players - Rollover", rollover: true)
        }

        // Highest card wins
        let sorted = candidates.sorted { ($0.card?.value ?? 0) > ($1.card?.value ?? 0) }
        guard let highest = sorted.first, let highCard = highest.card else {
            return Winner(name: "Tie", isSplit: false, reason: "No winner found", rollover: true)
        }

        // Check if board beats everyone
        if board.value >= highCard.value {
            return Winner(name: "Board", isSplit: false, reason: "Board has best kicker", rollover: true)
        }

        // Check for ties
        let withHighest = candidates.filter { $0.card?.value == highCard.value }
        if withHighest.count > 1 {
            let names = withHighest.map { $0.name }.joined(separator: " & ")
            return Winner(name: names, isSplit: true, reason: "Tied for highest", rollover: false, winningPlayers: withHighest)
        }

        return Winner(name: highest.name, isSplit: false, reason: "Highest kicker (\(highCard.rank.rawValue))", rollover: false)
    }

    private func simulateAndEndRound() {
        // Simulate remaining AI actions instantly
        var simPlayers = players
        var simPot = pot
        var simCurrentPlayer = currentPlayerIndex
        var simCurrentBet = currentBetAmount
        var simLastRaiser = lastRaiser

        let maxIterations = 200
        var iterations = 0

        while iterations < maxIterations {
            iterations += 1

            let active = simPlayers.filter { $0.isActive }
            let canAct = simPlayers.filter { $0.canAct }

            if active.count <= 1 || canAct.isEmpty { break }

            // Find next player
            var next = (simCurrentPlayer + 1) % 4
            var attempts = 0
            while (simPlayers[next].folded || simPlayers[next].eliminated || simPlayers[next].allIn) && attempts < 4 {
                next = (next + 1) % 4
                attempts += 1
            }
            if attempts >= 4 { break }

            // Check if round complete
            let checkPlayer = simLastRaiser >= 0 ? simLastRaiser : bettingRoundStarter
            let allMatched = active.allSatisfy { $0.currentBet == simCurrentBet || $0.folded }

            if (next == checkPlayer && allMatched && simCurrentBet > 0) ||
               (next == checkPlayer && simCurrentBet == 0 && simCurrentPlayer != -1) ||
               (canAct.count == 1 && allMatched) {
                // Reveal next card
                var revealerIdx = -1
                for idx in revealOrder {
                    if !simPlayers[idx].revealed && !simPlayers[idx].eliminated {
                        revealerIdx = idx
                        break
                    }
                }

                if revealerIdx == -1 { break }

                simPlayers[revealerIdx].revealed = true
                simCurrentBet = 0
                simLastRaiser = -1
                for i in 0..<simPlayers.count {
                    simPlayers[i].currentBet = 0
                }
                simCurrentPlayer = -1
                continue
            }

            simCurrentPlayer = next
            let player = simPlayers[simCurrentPlayer]

            // Make AI decision
            let decision = makeAIDecision(for: player, at: simCurrentPlayer, currentBet: simCurrentBet, players: simPlayers)

            // Apply decision
            switch decision {
            case .fold:
                simPlayers[simCurrentPlayer].folded = true
            case .check:
                break
            case .call:
                let toCall = simCurrentBet - player.currentBet
                let actualCall = min(toCall, player.chips)
                simPlayers[simCurrentPlayer].chips -= actualCall
                simPlayers[simCurrentPlayer].currentBet += actualCall
                simPlayers[simCurrentPlayer].totalRoundBet += actualCall
                simPot += actualCall
            case .bet(let amount), .raise(let amount):
                let toCall = simCurrentBet - player.currentBet
                let totalCost = toCall + amount
                let actualCost = min(totalCost, player.chips)
                simPlayers[simCurrentPlayer].chips -= actualCost
                simPlayers[simCurrentPlayer].currentBet = simCurrentBet + amount
                simPlayers[simCurrentPlayer].totalRoundBet += actualCost
                simPot += actualCost
                simCurrentBet = simCurrentBet + amount
                simLastRaiser = simCurrentPlayer
            case .peek:
                break
            case .allIn:
                let allInAmount = player.chips
                simPlayers[simCurrentPlayer].chips = 0
                simPlayers[simCurrentPlayer].currentBet += allInAmount
                simPlayers[simCurrentPlayer].totalRoundBet += allInAmount
                simPlayers[simCurrentPlayer].allIn = true
                simPot += allInAmount
                let newTotal = simPlayers[simCurrentPlayer].currentBet
                if newTotal > simCurrentBet {
                    simCurrentBet = newTotal
                    simLastRaiser = simCurrentPlayer
                }
            }
        }

        // Reveal all and end
        for i in 0..<simPlayers.count {
            simPlayers[i].revealed = true
            revealedCards.insert(i)
        }

        players = simPlayers
        pot = simPot

        // Show play it out option instead of immediately ending
        showPlayItOut = true
        endRound()
    }

    // MARK: - AI Decision
    func makeAIDecision(for player: Player, at index: Int, currentBet: Int, players: [Player]) -> PlayerAction {
        guard let aiLevel = player.aiLevel, let card = player.card, let board = communalCard else {
            return currentBet == 0 ? .check : .call
        }

        let toCall = currentBet - player.currentBet
        let canCheck = currentBet == 0
        let pairsWithBoard = card.value == board.value
        let boardHigher = board.value > card.value
        let revealedHigher = players.filter { $0.revealed && !$0.folded && $0.isActive && ($0.card?.value ?? 0) > card.value }

        switch aiLevel {
        case .cautious:
            if !revealedHigher.isEmpty || boardHigher {
                return canCheck ? .check : .fold
            }
            if canCheck { return .check }
            return .call

        case .random:
            if !pairsWithBoard && toCall > 0 && Double.random(in: 0...1) < 0.3 {
                return .fold
            }
            if Double.random(in: 0...1) < 0.2 {
                let amount = Int.random(in: 1...3)
                return canCheck ? .bet(amount) : .raise(amount)
            }
            return canCheck ? .check : .call

        case .aggressive:
            if pairsWithBoard {
                return canCheck ? .bet(3) : .raise(3)
            }
            if Double.random(in: 0...1) < 0.5 {
                let amount = Int.random(in: 1...2)
                return canCheck ? .bet(amount) : .raise(amount)
            }
            return canCheck ? .check : .call
        }
    }

    // MARK: - Winner Determination
    private func determineWinner() -> Winner {
        guard let board = communalCard else {
            return Winner(name: "Error", isSplit: false, reason: "No board card", rollover: true)
        }

        let active = activePlayers

        if active.count == 1 {
            let winner = active[0]
            return Winner(name: winner.name, isSplit: false, reason: "Last player standing", rollover: false)
        }

        // Check for pairs with board
        let pairsWithBoard = active.filter { $0.card?.value == board.value }

        if pairsWithBoard.count == 1 {
            let winner = pairsWithBoard[0]
            return Winner(name: winner.name, isSplit: false, reason: "Pairs with board (\(board.rank.rawValue)s)", rollover: false)
        }

        if pairsWithBoard.count > 1 {
            // Multiple pairs - they split
            let names = pairsWithBoard.map { $0.name }.joined(separator: " & ")
            return Winner(name: names, isSplit: true, reason: "Both pair with board", rollover: false, winningPlayers: pairsWithBoard)
        }

        // Check for pairs between players
        var cardCounts: [Int: [Player]] = [:]
        for player in active {
            if let value = player.card?.value {
                cardCounts[value, default: []].append(player)
            }
        }

        let playerPairs = cardCounts.filter { $0.value.count >= 2 }
        if !playerPairs.isEmpty {
            // Pairs between players - rollover (no single maker)
            return Winner(name: "Tie", isSplit: false, reason: "Pair between players - Rollover", rollover: true)
        }

        // Highest card wins (kicker)
        let sorted = active.sorted { ($0.card?.value ?? 0) > ($1.card?.value ?? 0) }
        guard let highest = sorted.first, let highCard = highest.card else {
            return Winner(name: "Tie", isSplit: false, reason: "No winner found", rollover: true)
        }

        // Check if board has highest
        if board.value >= highCard.value {
            return Winner(name: "Board", isSplit: false, reason: "Board has best kicker (\(board.rank.rawValue))", rollover: true)
        }

        // Check for ties
        let withHighest = active.filter { $0.card?.value == highCard.value }
        if withHighest.count > 1 {
            let names = withHighest.map { $0.name }.joined(separator: " & ")
            return Winner(name: names, isSplit: true, reason: "Tied for highest (\(highCard.rank.rawValue))", rollover: false, winningPlayers: withHighest)
        }

        return Winner(name: highest.name, isSplit: false, reason: "Highest kicker (\(highCard.rank.rawValue))", rollover: false)
    }

    // MARK: - Next Round
    func nextRound() {
        for i in 0..<players.count {
            players[i].resetForNewRound()
        }

        // Advance dealer
        var nextDealer = (dealer + 1) % 4
        var attempts = 0
        while players[nextDealer].eliminated && attempts < 4 {
            nextDealer = (nextDealer + 1) % 4
            attempts += 1
        }
        dealer = nextDealer

        gamePhase = .setup
        winner = nil
        pot = 0
        currentBetAmount = 0
        isRollover = false
        isReplaying = false
    }

    // MARK: - Replay
    func startReplay() {
        guard let startState = roundStartState, !roundHistory.isEmpty else { return }

        players = startState.players
        pot = startState.pot
        currentPlayerIndex = startState.currentPlayer
        communalCard = startState.communalCard
        revealOrder = startState.revealOrder
        message = "Replaying round..."

        winner = nil
        isReplaying = true
        replayIndex = 0
        gamePhase = .playing

        startReplayTimer()
    }

    private func startReplayTimer() {
        replayTask?.cancel()
        replayTask = Task {
            while isReplaying && replayIndex < roundHistory.count {
                try? await Task.sleep(nanoseconds: UInt64(aiSpeed * 1_000_000_000))

                if Task.isCancelled { break }

                advanceReplay()
            }
        }
    }

    func advanceReplay() {
        guard replayIndex < roundHistory.count else {
            // Replay finished
            isReplaying = false
            if let lastEntry = roundHistory.last {
                players = lastEntry.playersAfter
                pot = lastEntry.potAfter
            }
            endRound()
            return
        }

        let entry = roundHistory[replayIndex]
        players = entry.playersAfter
        pot = entry.potAfter
        currentPlayerIndex = entry.playerIndex
        message = entry.message
        replayIndex += 1
    }

    func stopReplay() {
        replayTask?.cancel()
        isReplaying = false
        if let lastEntry = roundHistory.last {
            players = lastEntry.playersAfter
            pot = lastEntry.potAfter
        }
        endRound()
    }

    // MARK: - AI Turn Handling
    func handleAITurn() {
        guard let player = currentPlayer, player.isAI else { return }

        aiActionTask?.cancel()
        aiActionTask = Task {
            // Random thinking delay (1-3 seconds based on speed)
            let thinkTime = Double.random(in: 0.5...1.5) * aiSpeed
            try? await Task.sleep(nanoseconds: UInt64(thinkTime * 1_000_000_000))

            if Task.isCancelled { return }

            let decision = makeAIDecision(for: player, at: currentPlayerIndex, currentBet: currentBetAmount, players: players)

            await MainActor.run {
                handleAction(decision)
            }
        }
    }

    func playerReady() {
        gamePhase = .playing

        // Handle turn for current player
        handleCurrentPlayerTurn()
    }

    /// Starts the turn timer for the current player
    private func startTurnTimer() {
        turnTimerTask?.cancel()
        turnTimeRemaining = turnTimeLimit
        turnTimerActive = true

        turnTimerTask = Task {
            let startTime = Date()
            while turnTimerActive && turnTimeRemaining > 0 {
                try? await Task.sleep(nanoseconds: 100_000_000) // Update every 0.1 seconds
                
                if Task.isCancelled { break }
                
                await MainActor.run {
                    let elapsed = Date().timeIntervalSince(startTime)
                    turnTimeRemaining = max(0, turnTimeLimit - elapsed)
                    
                    // Time's up - auto-fold
                    if turnTimeRemaining <= 0 {
                        handleTurnTimeout()
                    }
                }
            }
        }
    }

    /// Stops the turn timer
    private func stopTurnTimer() {
        turnTimerTask?.cancel()
        turnTimerActive = false
        turnTimeRemaining = turnTimeLimit
    }

    /// Handles when a player's turn times out
    private func handleTurnTimeout() {
        guard let player = currentPlayer, !player.isAI else { return }
        
        stopTurnTimer()
        
        // Auto-fold the player
        message = "\(player.name) timed out - folded"
        handleAction(.fold)
    }

    /// Handles the current player's turn, auto-acting for AI or broke players
    private func handleCurrentPlayerTurn() {
        guard let player = currentPlayer else { return }

        // If player has 0 chips, auto-check (they're effectively all-in from ante)
        if player.chips == 0 && !player.hasFolded && !player.isAllIn {
            autoHandleBrokePlayer(player)
            return
        }

        // Normal turn handling
        if player.isAI {
            stopTurnTimer() // Stop timer for AI turns
            handleAITurn()
        } else {
            // Start timer for human player
            startTurnTimer()
        }
        // For human players with chips, they get to choose their action via UI
    }

    /// Auto-handles a player with 0 chips
    private func autoHandleBrokePlayer(_ player: Player) {
        // Mark them as all-in since they have nothing left
        players[currentPlayerIndex].allIn = true

        // Set the appropriate message
        if currentBetAmount == 0 || player.currentBet >= currentBetAmount {
            message = "\(player.name) checks (no chips)"
        } else {
            message = "\(player.name) is all-in"
        }

        if !isReplaying {
            recordAction(.check, message: message)
        }

        // Brief delay so message is visible, then advance
        Task {
            try? await Task.sleep(nanoseconds: 800_000_000) // 0.8 seconds
            await MainActor.run {
                advanceToNextPlayer()
            }
        }
    }
}
