import Foundation

enum GamePhase: Equatable {
    case setup
    case passing(playerIndex: Int)
    case playing
    case winner
}

struct Winner: Equatable {
    let name: String
    let isSplit: Bool
    let reason: String
    let rollover: Bool
    var winningPlayers: [Player]?
}

struct RecordedAction: Equatable {
    let action: PlayerAction
    let playerIndex: Int
    let message: String
    let playersAfter: [Player]
    let potAfter: Int
    let revealedCardIndex: Int?
}

struct RoundStartState {
    let players: [Player]
    let pot: Int
    let currentPlayer: Int
    let communalCard: Card
    let revealOrder: [Int]
}

/// Represents a pot (main or side) with eligible players
struct SidePot: Equatable {
    var amount: Int
    var eligiblePlayerIndices: Set<Int>  // Players who can win this pot
    var cappedAt: Int  // The bet level this pot is capped at (for display)
}
