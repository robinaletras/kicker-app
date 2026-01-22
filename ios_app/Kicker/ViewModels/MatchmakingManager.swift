import Foundation
import GameKit
import SwiftUI

@MainActor
class MatchmakingManager: NSObject, ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var isSearching: Bool = false
    @Published var searchTimeRemaining: Int = 60
    @Published var seatedPlayers: [SeatedPlayer] = []
    @Published var errorMessage: String?
    @Published var isGameReady: Bool = false

    private var match: GKMatch?
    private var searchTimer: Timer?
    private var aiJoinTimer: Timer?

    let maxPlayers = 4
    let searchDuration = 60

    override init() {
        super.init()
        authenticatePlayer()
    }

    // MARK: - Game Center Authentication
    func authenticatePlayer() {
        GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, error in
            Task { @MainActor in
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    self?.isAuthenticated = false
                    return
                }

                if viewController != nil {
                    // Present the Game Center login view
                    // This would be handled by the view layer
                    self?.isAuthenticated = false
                } else if GKLocalPlayer.local.isAuthenticated {
                    self?.isAuthenticated = true
                } else {
                    self?.isAuthenticated = false
                }
            }
        }
    }

    // MARK: - Matchmaking
    func startMatchmaking(playerName: String) {
        // Reset state
        seatedPlayers = []
        searchTimeRemaining = searchDuration
        isSearching = true
        isGameReady = false

        // Add local player to seat 0
        let localPlayer = SeatedPlayer(
            id: UUID(),
            name: playerName,
            seatIndex: 0,
            isLocal: true,
            isReady: true,
            isAI: false
        )
        seatedPlayers.append(localPlayer)

        // Start search timer
        startSearchTimer()

        // Try Game Center matchmaking if authenticated
        if isAuthenticated {
            startGameCenterMatch()
        } else {
            // No Game Center, just use AI after delay
            scheduleAIJoins()
        }
    }

    private func startGameCenterMatch() {
        let request = GKMatchRequest()
        request.minPlayers = 2
        request.maxPlayers = maxPlayers

        GKMatchmaker.shared().findMatch(for: request) { [weak self] match, error in
            Task { @MainActor in
                if let error = error {
                    print("Matchmaking error: \(error.localizedDescription)")
                    // Fall back to AI
                    self?.scheduleAIJoins()
                    return
                }

                if let match = match {
                    self?.match = match
                    match.delegate = self
                    self?.handleMatchedPlayers(match.players)
                }
            }
        }
    }

    private func handleMatchedPlayers(_ players: [GKPlayer]) {
        for (index, player) in players.enumerated() {
            let seatIndex = seatedPlayers.count
            if seatIndex < maxPlayers {
                let seated = SeatedPlayer(
                    id: UUID(),
                    name: player.displayName,
                    seatIndex: seatIndex,
                    isLocal: false,
                    isReady: false,
                    isAI: false,
                    gameKitPlayer: player
                )
                seatedPlayers.append(seated)
            }
        }

        // Fill remaining with AI if needed
        if seatedPlayers.count < maxPlayers {
            scheduleAIJoins()
        }
    }

    private func startSearchTimer() {
        searchTimer?.invalidate()
        searchTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self else { return }
                self.searchTimeRemaining -= 1

                if self.searchTimeRemaining <= 0 {
                    self.finishSearch()
                }
            }
        }
    }

    private func scheduleAIJoins() {
        // Schedule AI players to join at random intervals
        let usedNames = seatedPlayers.map { $0.name }
        var delay: Double = Double.random(in: 3...8)

        for seatIndex in seatedPlayers.count..<maxPlayers {
            let aiDelay = delay

            DispatchQueue.main.asyncAfter(deadline: .now() + aiDelay) { [weak self] in
                guard let self = self, self.isSearching else { return }

                let name = Player.randomAIName(excluding: usedNames + self.seatedPlayers.map { $0.name })
                let aiPlayer = SeatedPlayer(
                    id: UUID(),
                    name: name,
                    seatIndex: seatIndex,
                    isLocal: false,
                    isReady: true,
                    isAI: true  // Hidden from UI, but tracked internally
                )
                self.seatedPlayers.append(aiPlayer)

                // Check if table is full
                if self.seatedPlayers.count >= self.maxPlayers {
                    self.finishSearch()
                }
            }

            delay += Double.random(in: 5...15)
        }
    }

    private func finishSearch() {
        searchTimer?.invalidate()
        isSearching = false

        // Fill any remaining seats with AI
        while seatedPlayers.count < maxPlayers {
            let usedNames = seatedPlayers.map { $0.name }
            let name = Player.randomAIName(excluding: usedNames)
            let aiPlayer = SeatedPlayer(
                id: UUID(),
                name: name,
                seatIndex: seatedPlayers.count,
                isLocal: false,
                isReady: true,
                isAI: true
            )
            seatedPlayers.append(aiPlayer)
        }

        // Small delay then start game
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.isGameReady = true
        }
    }

    func cancelMatchmaking() {
        searchTimer?.invalidate()
        isSearching = false
        seatedPlayers = []

        GKMatchmaker.shared().cancel()
        match?.disconnect()
        match = nil
    }

    func getPlayerSetup() -> (names: [String], isAI: [Bool]) {
        // Sort by seat index
        let sorted = seatedPlayers.sorted { $0.seatIndex < $1.seatIndex }

        let names = sorted.map { $0.name }
        let isAI = sorted.map { $0.isAI }

        return (names, isAI)
    }
}

// MARK: - GKMatchDelegate
extension MatchmakingManager: GKMatchDelegate {
    nonisolated func match(_ match: GKMatch, player: GKPlayer, didChange state: GKPlayerConnectionState) {
        Task { @MainActor in
            switch state {
            case .connected:
                print("Player connected: \(player.displayName)")
            case .disconnected:
                print("Player disconnected: \(player.displayName)")
                // Handle disconnection - could replace with AI
            default:
                break
            }
        }
    }

    nonisolated func match(_ match: GKMatch, didReceive data: Data, fromRemotePlayer player: GKPlayer) {
        // Handle received game data
        // For Kicker, this would be player actions
    }

    nonisolated func match(_ match: GKMatch, didFailWithError error: Error?) {
        Task { @MainActor in
            if let error = error {
                self.errorMessage = error.localizedDescription
            }
            // Fall back to AI
            self.scheduleAIJoins()
        }
    }
}

struct SeatedPlayer: Identifiable {
    let id: UUID
    let name: String
    let seatIndex: Int
    let isLocal: Bool
    var isReady: Bool
    let isAI: Bool  // Not shown to user
    var gameKitPlayer: GKPlayer?
}
