import SwiftUI

struct LobbyView: View {
    let mode: GameMode
    let playerName: String

    @EnvironmentObject var careerManager: CareerManager
    @EnvironmentObject var matchmakingManager: MatchmakingManager
    @StateObject private var gameViewModel = GameViewModel()

    @Environment(\.dismiss) var dismiss
    @State private var showGame = false

    var body: some View {
        ZStack {
            // Felt green background
            Color(red: 0.1, green: 0.35, blue: 0.15)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                // Header
                headerView

                Spacer()

                // Table with seats
                tableView

                Spacer()

                // Status / Timer
                if matchmakingManager.isSearching {
                    searchingView
                } else if matchmakingManager.isGameReady {
                    readyView
                }

                // Cancel button
                if matchmakingManager.isSearching {
                    Button("Cancel") {
                        matchmakingManager.cancelMatchmaking()
                        dismiss()
                    }
                    .foregroundColor(.red)
                    .padding()
                }
            }
            .padding()
        }
        .navigationTitle(mode == .career ? "Career Mode" : "Quick Play")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(matchmakingManager.isSearching)
        .onAppear {
            matchmakingManager.startMatchmaking(playerName: playerName)
        }
        .onDisappear {
            if !showGame {
                matchmakingManager.cancelMatchmaking()
            }
        }
        .onChange(of: matchmakingManager.isGameReady) { _, ready in
            if ready {
                startGame()
            }
        }
        .navigationDestination(isPresented: $showGame) {
            GameView(viewModel: gameViewModel, mode: mode)
        }
    }

    private var headerView: some View {
        VStack(spacing: 8) {
            if mode == .career {
                HStack {
                    VStack(alignment: .leading) {
                        Text(careerManager.monthName)
                            .font(.headline)
                        Text("Round \(careerManager.roundInMonth) of \(CareerManager.roundsPerMonth)")
                            .font(.caption)
                    }
                    Spacer()
                    VStack(alignment: .trailing) {
                        Text("\(careerManager.coins) coins")
                            .font(.headline)
                        Text("Year \(careerManager.careerHistory.count + 1)")
                            .font(.caption)
                    }
                }
                .foregroundColor(.white)
                .padding()
                .background(Color.black.opacity(0.3))
                .cornerRadius(10)
            }
        }
    }

    private var tableView: some View {
        ZStack {
            // Table shape
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color(red: 0.15, green: 0.5, blue: 0.2), Color(red: 0.1, green: 0.35, blue: 0.15)],
                        center: .center,
                        startRadius: 0,
                        endRadius: 150
                    )
                )
                .frame(width: 300, height: 200)
                .overlay(
                    Ellipse()
                        .strokeBorder(Color.brown.opacity(0.8), lineWidth: 15)
                )

            // Center pot area
            VStack {
                Text("Finding Players...")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.7))
            }

            // Seats around the table
            ForEach(0..<4, id: \.self) { index in
                seatView(at: index)
                    .offset(seatOffset(for: index))
            }
        }
        .frame(height: 320)
    }

    private func seatView(at index: Int) -> some View {
        let player = matchmakingManager.seatedPlayers.first { $0.seatIndex == index }

        return VStack(spacing: 4) {
            ZStack {
                Circle()
                    .fill(player != nil ? Color.blue.opacity(0.8) : Color.gray.opacity(0.3))
                    .frame(width: 60, height: 60)

                if let player = player {
                    if player.isLocal {
                        Image(systemName: "person.fill")
                            .font(.title)
                            .foregroundColor(.white)
                    } else {
                        Image(systemName: "person.fill")
                            .font(.title)
                            .foregroundColor(.white.opacity(0.9))
                    }
                } else {
                    Image(systemName: "person.badge.plus")
                        .font(.title2)
                        .foregroundColor(.white.opacity(0.4))
                }
            }

            Text(player?.name ?? "Waiting...")
                .font(.caption)
                .fontWeight(player?.isLocal == true ? .bold : .regular)
                .foregroundColor(player != nil ? .white : .white.opacity(0.5))
                .lineLimit(1)
                .frame(width: 80)
        }
    }

    private func seatOffset(for index: Int) -> CGSize {
        switch index {
        case 0: return CGSize(width: 0, height: 130)    // Bottom (local player)
        case 1: return CGSize(width: -140, height: 0)   // Left
        case 2: return CGSize(width: 0, height: -130)   // Top
        case 3: return CGSize(width: 140, height: 0)    // Right
        default: return .zero
        }
    }

    private var searchingView: some View {
        VStack(spacing: 10) {
            ProgressView()
                .tint(.white)

            Text("Searching for players...")
                .foregroundColor(.white)

            Text("\(matchmakingManager.searchTimeRemaining)s remaining")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))

            Text("\(matchmakingManager.seatedPlayers.count)/4 players")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
        }
        .padding()
        .background(Color.black.opacity(0.3))
        .cornerRadius(10)
    }

    private var readyView: some View {
        VStack(spacing: 10) {
            Text("Table Full!")
                .font(.headline)
                .foregroundColor(.green)

            Text("Starting game...")
                .foregroundColor(.white)
        }
        .padding()
        .background(Color.black.opacity(0.3))
        .cornerRadius(10)
    }

    private func startGame() {
        let setup = matchmakingManager.getPlayerSetup()

        // Get starting chips based on mode
        let startingChips: Int
        if mode == .career {
            startingChips = careerManager.coins
        } else {
            startingChips = CareerManager.quickPlayStartingCoins
        }

        gameViewModel.setupGame(
            playerNames: setup.names,
            isAI: setup.isAI,
            startingChips: startingChips
        )

        showGame = true
    }
}

#Preview {
    NavigationStack {
        LobbyView(mode: .quickPlay, playerName: "Player")
            .environmentObject(CareerManager())
            .environmentObject(MatchmakingManager())
    }
}
