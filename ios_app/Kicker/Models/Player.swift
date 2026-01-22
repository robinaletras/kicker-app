import Foundation

enum AISkillLevel: String, CaseIterable, Codable {
    case cautious
    case random
    case aggressive

    var displayName: String {
        rawValue.capitalized
    }

    static func random() -> AISkillLevel {
        allCases.randomElement() ?? .random
    }
}

struct Player: Identifiable, Equatable {
    let id = UUID()
    var name: String
    var chips: Int
    var card: Card?
    var revealed: Bool = false
    var folded: Bool = false
    var eliminated: Bool = false
    var peekedCards: [Card] = []
    var currentBet: Int = 0
    var totalRoundBet: Int = 0
    var allIn: Bool = false
    var aiLevel: AISkillLevel?

    var isAI: Bool {
        aiLevel != nil
    }

    var canAct: Bool {
        !folded && !eliminated && !allIn
    }

    var isActive: Bool {
        !folded && !eliminated
    }

    // Aliases for view compatibility
    var hasFolded: Bool { folded }
    var isAllIn: Bool { allIn }

    mutating func resetForNewRound() {
        card = nil
        revealed = false
        folded = false
        peekedCards = []
        currentBet = 0
        totalRoundBet = 0
        allIn = false
        if chips <= 0 {
            eliminated = true
        }
    }

    mutating func placeBet(_ amount: Int) {
        let actualAmount = min(amount, chips)
        chips -= actualAmount
        currentBet += actualAmount
        totalRoundBet += actualAmount
        if chips <= 0 {
            allIn = true
        }
    }

    static let aiNames = [
        "Alex", "Sam", "Jordan", "Taylor", "Casey",
        "Morgan", "Riley", "Quinn", "Avery", "Blake",
        "Charlie", "Drew", "Frankie", "Jamie", "Jesse",
        "Kelly", "Logan", "Max", "Peyton", "Reese"
    ]

    static func randomAIName(excluding: [String]) -> String {
        let available = aiNames.filter { !excluding.contains($0) }
        return available.randomElement() ?? aiNames.randomElement()!
    }
}

enum PlayerAction: Equatable {
    case bet(Int)
    case call
    case raise(Int)
    case check
    case fold
    case peek
    case allIn
}
