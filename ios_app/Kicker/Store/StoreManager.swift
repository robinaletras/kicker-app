import Foundation
import StoreKit

@MainActor
class StoreManager: ObservableObject {
    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    // Product identifiers
    static let careerRestart = "com.kicker.career.restart"      // Unlock career restart ability

    static let allProductIDs: Set<String> = [
        careerRestart
    ]

    private var updateListenerTask: Task<Void, Error>?

    init() {
        updateListenerTask = listenForTransactions()
        Task {
            await loadProducts()
            await checkPurchasedProducts()
        }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    func loadProducts() async {
        isLoading = true
        errorMessage = nil

        do {
            products = try await Product.products(for: StoreManager.allProductIDs)
        } catch {
            errorMessage = "Failed to load products: \(error.localizedDescription)"
        }

        isLoading = false
    }

    func purchase(_ product: Product) async throws -> Bool {
        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            
            // Grant the career restart ability
            await transaction.finish()
            await checkPurchasedProducts()
            return true

        case .userCancelled:
            return false

        case .pending:
            return false

        @unknown default:
            return false
        }
    }

    nonisolated private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }

    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await self.checkPurchasedProducts()
                    await transaction.finish()
                } catch {
                    print("Transaction failed verification: \(error)")
                }
            }
        }
    }

    func checkPurchasedProducts() async {
        var purchased: Set<String> = []
        
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                if transaction.productID == StoreManager.careerRestart {
                    purchased.insert(transaction.productID)
                }
            } catch {
                print("Failed to verify transaction: \(error)")
            }
        }
        
        purchasedProductIDs = purchased
    }

    var hasRestartCareerPurchase: Bool {
        purchasedProductIDs.contains(StoreManager.careerRestart)
    }

    func restorePurchases() async {
        do {
            try await AppStore.sync()
            await checkPurchasedProducts()
        } catch {
            errorMessage = "Failed to restore: \(error.localizedDescription)"
        }
    }
}

enum StoreError: Error {
    case failedVerification
    case purchaseFailed
}

