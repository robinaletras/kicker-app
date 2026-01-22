import Foundation

enum Suit: String, CaseIterable, Codable {
    case spades = "♠"
    case hearts = "♥"
    case diamonds = "♦"
    case clubs = "♣"

    var isRed: Bool {
        self == .hearts || self == .diamonds
    }
}

enum Rank: String, CaseIterable, Codable {
    case two = "2"
    case three = "3"
    case four = "4"
    case five = "5"
    case six = "6"
    case seven = "7"
    case eight = "8"
    case nine = "9"
    case ten = "10"
    case jack = "J"
    case queen = "Q"
    case king = "K"
    case ace = "A"

    var value: Int {
        switch self {
        case .two: return 2
        case .three: return 3
        case .four: return 4
        case .five: return 5
        case .six: return 6
        case .seven: return 7
        case .eight: return 8
        case .nine: return 9
        case .ten: return 10
        case .jack: return 11
        case .queen: return 12
        case .king: return 13
        case .ace: return 14
        }
    }
}

struct Card: Identifiable, Equatable, Codable {
    let id = UUID()
    let suit: Suit
    let rank: Rank

    var value: Int {
        rank.value
    }

    var isRed: Bool {
        suit.isRed
    }

    var displayName: String {
        "\(rank.rawValue)\(suit.rawValue)"
    }

    static func createDeck() -> [Card] {
        var deck: [Card] = []
        for suit in Suit.allCases {
            for rank in Rank.allCases {
                deck.append(Card(suit: suit, rank: rank))
            }
        }
        return deck.shuffled()
    }
}
