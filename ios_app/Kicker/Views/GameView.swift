import SwiftUI

struct GameView: View {
    @ObservedObject var viewModel: GameViewModel
    let mode: GameMode

    @EnvironmentObject var careerManager: CareerManager
    @Environment(\.dismiss) var dismiss

    @State private var showRaiseSheet = false
    @State private var raiseAmount: Int = 0
    @State private var showEndRoundSheet = false
    @State private var isLoading = true

    var body: some View {
        ZStack {
            // Felt background
            Color(red: 0.1, green: 0.35, blue: 0.15)
                .ignoresSafeArea()

            // Loading overlay
            if isLoading {
                VStack(spacing: 20) {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.white)
                    
                    Text("Setting up game...")
                        .font(.headline)
                        .foregroundColor(.white)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black.opacity(0.3))
            }

            // Debug info
            if viewModel.players.isEmpty && !isLoading {
                VStack {
                    Text("No players - game not started")
                        .foregroundColor(.white)
                        .font(.title)
                    Text("Phase: \(String(describing: viewModel.phase))")
                        .foregroundColor(.white)
                }
            } else if !isLoading {
                gameContent
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                if viewModel.phase == .winner && !viewModel.isReplayMode {
                    Button("Leave") {
                        handleLeaveGame()
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .sheet(isPresented: $showRaiseSheet) {
            raiseSheet
        }
        .onAppear {
            viewModel.localPlayerIndex = 0
            
            // Hide loading after a short delay or when players are ready
            Task {
                try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds minimum
                await MainActor.run {
                    if !viewModel.players.isEmpty {
                        isLoading = false
                    }
                }
            }
        }
        .onChange(of: viewModel.players.count) { _, count in
            if count > 0 {
                // Small delay to ensure everything is rendered
                Task {
                    try? await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds
                    await MainActor.run {
                        isLoading = false
                    }
                }
            }
        }
    }

    private var gameContent: some View {
        VStack(spacing: 0) {
            // Top player (seat 2)
            playerView(index: 2)
                .padding(.top, 10)

            HStack {
                // Left player (seat 1)
                playerView(index: 1)
                    .rotationEffect(.degrees(90))
                    .frame(width: 120)

                Spacer()

                // Center - pot and communal card
                centerView

                Spacer()

                // Right player (seat 3)
                playerView(index: 3)
                    .rotationEffect(.degrees(-90))
                    .frame(width: 120)
            }
            .frame(height: 200)

            // Bottom player (seat 0 - local)
            localPlayerView
                .padding(.bottom, 10)

            // Passing phase - ready button
            if case .passing = viewModel.phase, !viewModel.isReplayMode {
                Button("I'm Ready") {
                    viewModel.playerReady()
                }
                .buttonStyle(ActionButtonStyle(color: .green))
                .padding()
            }

            // Action buttons
            if viewModel.phase == .playing && viewModel.isLocalPlayerTurn && !viewModel.isReplayMode {
                actionButtons
            }

            // Round end / replay controls
            if viewModel.phase == .winner || viewModel.isReplayMode {
                roundEndView
            }
        }
        .padding()
    }

    // MARK: - Player Views

    private func playerView(index: Int) -> some View {
        let player = viewModel.players[safe: index]

        return VStack(spacing: 8) {
            // Card
            if let player = player {
                cardView(for: player, index: index)
            }

            // Name and chips
            if let player = player {
                VStack(spacing: 2) {
                    Text(player.name)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(viewModel.currentPlayerIndex == index ? .yellow : .white)
                        .lineLimit(1)

                    Text("\(player.chips)")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.7))

                    if player.hasFolded {
                        Text("FOLDED")
                            .font(.caption2)
                            .foregroundColor(.red)
                    } else if player.isAllIn {
                        Text("ALL IN")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                }
            }
        }
        .frame(width: 80)
    }

    private func cardView(for player: Player, index: Int) -> some View {
        let isRevealed = viewModel.revealedCards.contains(index)
        let isCurrentPlayer = viewModel.currentPlayerIndex == index

        return ZStack {
            if isRevealed, let card = player.card {
                // Revealed card - show actual card
                CardView(card: card)
                    .frame(width: 50, height: 70)
                    .opacity(player.hasFolded ? 0.4 : 1.0)
            } else {
                // Face down card (not revealed yet)
                RoundedRectangle(cornerRadius: 8)
                    .fill(
                        LinearGradient(
                            colors: [Color.blue.opacity(0.8), Color.blue.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 50, height: 70)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .strokeBorder(Color.white.opacity(0.3), lineWidth: 2)
                    )
                
                // Show X on face-down card if folded
                if player.hasFolded {
                    Text("✕")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.red.opacity(0.6))
                }
            }
            
            // Turn timer outline for current player
            if isCurrentPlayer && viewModel.turnTimerActive && !player.hasFolded && !player.isAllIn {
                RoundedRectangle(cornerRadius: 8)
                    .trim(from: 0, to: CGFloat(viewModel.turnTimeRemaining / viewModel.turnTimeLimit))
                    .stroke(
                        viewModel.turnTimeRemaining < 5 ? Color.red : Color.yellow,
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )
                    .frame(width: 54, height: 74)
                    .rotationEffect(.degrees(-90))
            }
        }
    }

    private var localPlayerView: some View {
        let player = viewModel.players[safe: 0]

        return VStack(spacing: 12) {
            // Local player's card (always visible to them)
            if let player = player, let card = player.card {
                ZStack {
                    CardView(card: card)
                        .frame(width: 70, height: 100)
                        .shadow(radius: 5)
                    
                    // Turn timer ring - rectangular outline
                    if viewModel.turnTimerActive && viewModel.isLocalPlayerTurn {
                        RoundedRectangle(cornerRadius: 8)
                            .trim(from: 0, to: CGFloat(viewModel.turnTimeRemaining / viewModel.turnTimeLimit))
                            .stroke(
                                viewModel.turnTimeRemaining < 5 ? Color.red : Color.yellow,
                                style: StrokeStyle(lineWidth: 4, lineCap: .round)
                            )
                            .frame(width: 74, height: 104)
                            .rotationEffect(.degrees(-90))
                    }
                }
            }

            // Name and chips
            if let player = player {
                HStack {
                    Text(player.name)
                        .font(.headline)
                        .foregroundColor(viewModel.currentPlayerIndex == 0 ? .yellow : .white)

                    Text("•")
                        .foregroundColor(.white.opacity(0.5))

                    Text("\(player.chips) chips")
                        .foregroundColor(.white.opacity(0.8))

                    if player.currentBet > 0 {
                        Text("• Bet: \(player.currentBet)")
                            .foregroundColor(.orange)
                    }
                }
                .font(.subheadline)

                if player.hasFolded {
                    Text("FOLDED")
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color.red.opacity(0.2))
                        .cornerRadius(4)
                }
            }
        }
        .padding()
        .background(Color.black.opacity(0.2))
        .cornerRadius(12)
    }

    // MARK: - Center View

    private var centerView: some View {
        VStack(spacing: 15) {
            // Pot display
            if viewModel.sidePots.count > 1 {
                // Multiple pots (side pots exist)
                VStack(spacing: 8) {
                    ForEach(Array(viewModel.sidePots.enumerated()), id: \.offset) { index, sidePot in
                        HStack(spacing: 8) {
                            Text(index == 0 ? "Main:" : "Side \(index):")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                            Text("$\(sidePot.amount)")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(index == 0 ? .yellow : .orange)
                        }
                    }
                }
            } else {
                // Single pot
                VStack(spacing: 4) {
                    Text("POT")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                    Text("\(viewModel.pot)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.yellow)
                }
            }

            // Communal card
            if let card = viewModel.communalCard {
                VStack(spacing: 4) {
                    Text("KICKER")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.7))
                    CardView(card: card)
                        .frame(width: 60, height: 84)
                        .shadow(radius: 3)
                }
            }

            // Current bet to match
            if viewModel.currentBet > 0 {
                Text("To call: \(viewModel.currentBet)")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding()
        .background(Color.black.opacity(0.2))
        .cornerRadius(15)
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        let player = viewModel.players[safe: 0]
        let canCheck = (player?.currentBet ?? 0) >= viewModel.currentBet
        let wantToCall = viewModel.currentBet - (player?.currentBet ?? 0)
        let actualCallAmount = min(wantToCall, player?.chips ?? 0)
        let isAllInCall = actualCallAmount >= (player?.chips ?? 0) && actualCallAmount > 0

        return HStack(spacing: 12) {
            // Fold
            Button("Fold") {
                viewModel.handleAction(.fold, from: 0)
            }
            .buttonStyle(ActionButtonStyle(color: .red))

            // Check or Call
            if canCheck {
                Button("Check") {
                    viewModel.handleAction(.check, from: 0)
                }
                .buttonStyle(ActionButtonStyle(color: .blue))
            } else {
                Button(isAllInCall ? "All-In \(actualCallAmount)" : "Call \(actualCallAmount)") {
                    viewModel.handleAction(.call, from: 0)
                }
                .buttonStyle(ActionButtonStyle(color: isAllInCall ? .orange : .blue))
            }

            // Raise
            if viewModel.canRaise(playerIndex: 0) {
                Button("Raise") {
                    raiseAmount = viewModel.minRaise
                    showRaiseSheet = true
                }
                .buttonStyle(ActionButtonStyle(color: .green))
            }

            // All-in (only show if not already going all-in via call)
            if let player = player, player.chips > 0, !isAllInCall {
                Button("All In") {
                    viewModel.handleAction(.allIn, from: 0)
                }
                .buttonStyle(ActionButtonStyle(color: .orange))
            }
        }
        .padding()
        .background(Color.black.opacity(0.3))
        .cornerRadius(12)
    }

    // MARK: - Raise Sheet

    private var raiseSheet: some View {
        NavigationStack {
            VStack(spacing: 30) {
                Text("Raise Amount")
                    .font(.title2)

                Text("\(raiseAmount)")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.green)

                Slider(
                    value: Binding(
                        get: { Double(raiseAmount) },
                        set: { raiseAmount = Int($0) }
                    ),
                    in: Double(viewModel.minRaise)...Double(viewModel.maxRaise(for: 0)),
                    step: Double(viewModel.ante)
                )
                .tint(.green)
                .padding(.horizontal)

                HStack {
                    Text("Min: \(viewModel.minRaise)")
                    Spacer()
                    Text("Max: \(viewModel.maxRaise(for: 0))")
                }
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.horizontal)

                Button("Raise to \(raiseAmount)") {
                    viewModel.handleAction(.raise(raiseAmount), from: 0)
                    showRaiseSheet = false
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
            }
            .padding()
            .navigationTitle("Raise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showRaiseSheet = false
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }

    // MARK: - Round End View

    private var roundEndView: some View {
        VStack(spacing: 15) {
            if let winner = viewModel.winner {
                VStack(spacing: 8) {
                    Text(winner.isSplit ? "Split Pot!" : "\(winner.name) Wins!")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.yellow)

                    Text(winner.reason)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                }
            }

            if viewModel.isReplayMode {
                // Replay controls
                HStack(spacing: 20) {
                    Button("Stop Replay") {
                        viewModel.stopReplay()
                    }
                    .buttonStyle(ActionButtonStyle(color: .red))
                }
            } else {
                // Normal end-of-round buttons
                HStack(spacing: 20) {
                    Button("Next Round") {
                        handleNextRound()
                    }
                    .buttonStyle(ActionButtonStyle(color: .green))

                    if viewModel.hasRecordedRound {
                        Button("Replay Round") {
                            viewModel.startReplay()
                        }
                        .buttonStyle(ActionButtonStyle(color: .blue))
                    }
                }
            }
        }
        .padding()
        .background(Color.black.opacity(0.4))
        .cornerRadius(12)
    }

    // MARK: - Message Overlay

    private func messageOverlay(_ message: String) -> some View {
        VStack {
            Spacer()

            Text(message)
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .background(Color.black.opacity(0.7))
                .cornerRadius(10)
                .padding(.bottom, 20)
        }
    }

    // MARK: - Helpers

    private func handleNextRound() {
        if mode == .career {
            // Record result
            let startingChips = careerManager.coins
            let endingChips = viewModel.players[0].chips
            careerManager.recordRoundResult(startingChips: startingChips, endingChips: endingChips)

            // Update coins
            careerManager.coins = endingChips

            // Check if career year complete
            if careerManager.isCareerComplete {
                dismiss()
                return
            }
        }

        viewModel.startNewRound()
    }

    private func handleLeaveGame() {
        if mode == .career {
            // Save current chips
            careerManager.coins = viewModel.players[0].chips
        }
        dismiss()
    }
}

// MARK: - Card View

struct CardView: View {
    let card: Card

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.white)

            VStack(spacing: 2) {
                Text(card.rank.symbol)
                    .font(.system(size: 18, weight: .bold))
                Text(card.suit.symbol)
                    .font(.system(size: 20))
            }
            .foregroundColor(card.suit.color)
        }
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .strokeBorder(Color.gray.opacity(0.3), lineWidth: 1)
        )
    }
}

extension Suit {
    var symbol: String {
        switch self {
        case .hearts: return "♥"
        case .diamonds: return "♦"
        case .clubs: return "♣"
        case .spades: return "♠"
        }
    }

    var color: Color {
        switch self {
        case .hearts, .diamonds: return .red
        case .clubs, .spades: return .black
        }
    }
}

extension Rank {
    var symbol: String {
        switch self {
        case .two: return "2"
        case .three: return "3"
        case .four: return "4"
        case .five: return "5"
        case .six: return "6"
        case .seven: return "7"
        case .eight: return "8"
        case .nine: return "9"
        case .ten: return "10"
        case .jack: return "J"
        case .queen: return "Q"
        case .king: return "K"
        case .ace: return "A"
        }
    }
}

// MARK: - Action Button Style

struct ActionButtonStyle: ButtonStyle {
    let color: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .foregroundColor(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(color.opacity(configuration.isPressed ? 0.6 : 0.8))
            .cornerRadius(8)
    }
}

// MARK: - Array Safe Subscript

extension Array {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

#Preview {
    NavigationStack {
        GameView(viewModel: GameViewModel(), mode: .quickPlay)
            .environmentObject(CareerManager())
    }
}
