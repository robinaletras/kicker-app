import Foundation
import SwiftUI

@MainActor
class CareerManager: ObservableObject {
    @Published var coins: Int {
        didSet {
            UserDefaults.standard.set(coins, forKey: "kickerCoins")
        }
    }

    @Published var careerRound: Int {
        didSet {
            UserDefaults.standard.set(careerRound, forKey: "careerRound")
        }
    }

    @Published var careerEarnings: Int {
        didSet {
            UserDefaults.standard.set(careerEarnings, forKey: "careerEarnings")
        }
    }

    @Published var careerHistory: [CareerYear] {
        didSet {
            if let encoded = try? JSONEncoder().encode(careerHistory) {
                UserDefaults.standard.set(encoded, forKey: "careerHistory")
            }
        }
    }

    @Published var hasActiveCareer: Bool {
        didSet {
            UserDefaults.standard.set(hasActiveCareer, forKey: "hasActiveCareer")
        }
    }

    @Published var canRestartCareer: Bool {
        didSet {
            UserDefaults.standard.set(canRestartCareer, forKey: "canRestartCareer")
        }
    }

    @Published var isCareerComplete: Bool = false
    
    @Published var totalBorrowed: Int {
        didSet {
            UserDefaults.standard.set(totalBorrowed, forKey: "totalBorrowed")
        }
    }

    static let roundsPerYear = 52
    static let roundsPerMonth = 4
    static let careerStartingCoins = 10000
    static let quickPlayStartingCoins = 1000
    static let borrowAmount = 50

    var currentMonth: Int {
        (careerRound / CareerManager.roundsPerMonth) + 1
    }

    var roundInMonth: Int {
        (careerRound % CareerManager.roundsPerMonth) + 1
    }

    var monthName: String {
        let months = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"]
        return months[min(currentMonth - 1, 11)]
    }

    var yearProgress: Double {
        Double(careerRound) / Double(CareerManager.roundsPerYear)
    }
    
    var maxRepayAmount: Int {
        min(coins, totalBorrowed)
    }

    init() {
        self.coins = UserDefaults.standard.integer(forKey: "kickerCoins")
        self.careerRound = UserDefaults.standard.integer(forKey: "careerRound")
        self.careerEarnings = UserDefaults.standard.integer(forKey: "careerEarnings")
        self.hasActiveCareer = UserDefaults.standard.bool(forKey: "hasActiveCareer")
        self.canRestartCareer = UserDefaults.standard.bool(forKey: "canRestartCareer")
        self.totalBorrowed = UserDefaults.standard.integer(forKey: "totalBorrowed")

        if let data = UserDefaults.standard.data(forKey: "careerHistory"),
           let history = try? JSONDecoder().decode([CareerYear].self, from: data) {
            self.careerHistory = history
        } else {
            self.careerHistory = []
        }

        // First time player - give them free career
        if !hasActiveCareer && careerHistory.isEmpty {
            // They can start their first career for free
        }
    }

    func startNewCareer() {
        coins = CareerManager.careerStartingCoins
        careerRound = 0
        careerEarnings = 0
        isCareerComplete = false
        hasActiveCareer = true
    }

    func restartCareerWithPurchase() {
        // Called after IAP purchase
        coins = CareerManager.careerStartingCoins
        careerRound = 0
        careerEarnings = 0
        isCareerComplete = false
        hasActiveCareer = true
        canRestartCareer = true
    }

    func completeCareerYear() {
        let year = CareerYear(
            year: careerHistory.count + 1,
            totalEarnings: careerEarnings,
            finalCoins: coins
        )
        careerHistory.append(year)
        isCareerComplete = true
        hasActiveCareer = false // Career ended, need to restart
    }

    func canStartFreeCareer() -> Bool {
        // Can start free career if no active career and no history (first time)
        return !hasActiveCareer && careerHistory.isEmpty
    }

    func needsPurchaseToRestart() -> Bool {
        // Need to purchase if they've had a career before and haven't purchased restart ability
        return !canRestartCareer && (!careerHistory.isEmpty || !canStartFreeCareer())
    }

    func recordRoundResult(startingChips: Int, endingChips: Int) {
        let profit = endingChips - startingChips
        careerEarnings += profit
        careerRound += 1

        // Check if career year is complete
        if careerRound >= CareerManager.roundsPerYear {
            completeCareerYear()
        }
    }

    func addCoins(_ amount: Int) {
        coins += amount
    }
    
    func borrowCoins() {
        coins += CareerManager.borrowAmount
        totalBorrowed += CareerManager.borrowAmount
    }
    
    func repayCoins(_ amount: Int) {
        let actualRepay = min(amount, min(coins, totalBorrowed))
        coins -= actualRepay
        totalBorrowed -= actualRepay
    }

    func useCoinsForQuickPlay() -> Bool {
        // Quick play is free, just uses whatever coins you have
        return true
    }

    func resetCareer() {
        coins = CareerManager.careerStartingCoins
        careerRound = 0
        careerEarnings = 0
        careerHistory = []
        isCareerComplete = false
        hasActiveCareer = false
        canRestartCareer = false
        totalBorrowed = 0
    }
}

struct CareerYear: Codable, Identifiable {
    let id = UUID()
    let year: Int
    let totalEarnings: Int
    let finalCoins: Int

    var netProfit: Int {
        totalEarnings
    }

    enum CodingKeys: String, CodingKey {
        case year, totalEarnings, finalCoins
    }
}
