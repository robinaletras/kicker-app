import SwiftUI
import SwiftUI
import StoreKit

struct StoreView: View {
    @EnvironmentObject var storeManager: StoreManager
    @EnvironmentObject var careerManager: CareerManager
    @Environment(\.dismiss) var dismiss

    @State private var isPurchasing = false
    @State private var purchaseError: String?
    @State private var showPurchaseSuccess = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.1, green: 0.15, blue: 0.2)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 30) {
                        // Header
                        VStack(spacing: 8) {
                            Image(systemName: "arrow.clockwise.circle.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.green)

                            Text("Restart Career")
                                .font(.title.bold())
                                .foregroundColor(.white)

                            Text("Get unlimited career restarts")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .padding(.top, 30)

                        // What you get
                        VStack(alignment: .leading, spacing: 16) {
                            FeatureRow(icon: "star.fill", text: "Restart career anytime", color: .yellow)
                            FeatureRow(icon: "dollarsign.circle.fill", text: "Get 10,000 coins each restart", color: .yellow)
                            FeatureRow(icon: "infinity", text: "Unlimited restarts forever", color: .green)
                            FeatureRow(icon: "chart.line.uptrend.xyaxis", text: "Try different strategies", color: .blue)
                        }
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(15)
                        .padding(.horizontal)

                        // Purchase status
                        if storeManager.hasRestartCareerPurchase {
                            VStack(spacing: 12) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 50))
                                    .foregroundColor(.green)

                                Text("Already Purchased!")
                                    .font(.title3.bold())
                                    .foregroundColor(.white)

                                Text("You can restart your career anytime from the menu")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.7))
                                    .multilineTextAlignment(.center)
                            }
                            .padding()
                            .background(Color.green.opacity(0.2))
                            .cornerRadius(15)
                            .padding(.horizontal)
                        } else {
                            // Purchase button
                            if storeManager.isLoading {
                                ProgressView()
                                    .tint(.white)
                                    .padding(50)
                            } else if let error = storeManager.errorMessage {
                                VStack(spacing: 10) {
                                    Image(systemName: "exclamationmark.triangle")
                                        .font(.largeTitle)
                                        .foregroundColor(.orange)
                                    Text(error)
                                        .foregroundColor(.white.opacity(0.8))
                                        .multilineTextAlignment(.center)

                                    Button("Retry") {
                                        Task {
                                            await storeManager.loadProducts()
                                        }
                                    }
                                    .buttonStyle(.borderedProminent)
                                }
                                .padding()
                            } else if let product = storeManager.products.first {
                                Button {
                                    Task {
                                        await purchase(product)
                                    }
                                } label: {
                                    VStack(spacing: 8) {
                                        Text("Unlock Unlimited Restarts")
                                            .font(.headline)
                                        Text(product.displayPrice)
                                            .font(.title2.bold())
                                    }
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.green)
                                    .cornerRadius(12)
                                }
                                .padding(.horizontal)
                            }

                            // Restore purchases
                            Button("Restore Purchases") {
                                Task {
                                    await storeManager.restorePurchases()
                                }
                            }
                            .font(.footnote)
                            .foregroundColor(.white.opacity(0.6))
                            .padding(.top, 10)
                        }

                        // Error message
                        if let error = purchaseError {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding()
                                .background(Color.red.opacity(0.2))
                                .cornerRadius(8)
                                .padding(.horizontal)
                        }

                        Spacer()
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Career Restart")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
            .disabled(isPurchasing)
            .overlay {
                if isPurchasing {
                    Color.black.opacity(0.5)
                        .ignoresSafeArea()
                    ProgressView("Processing...")
                        .tint(.white)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.black.opacity(0.8))
                        .cornerRadius(10)
                }
            }
        }
        .alert("Purchase Successful!", isPresented: $showPurchaseSuccess) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text("You can now restart your career anytime!")
        }
    }

    private func purchase(_ product: Product) async {
        isPurchasing = true
        purchaseError = nil

        do {
            let success = try await storeManager.purchase(product)
            if success {
                careerManager.canRestartCareer = true
                showPurchaseSuccess = true
            }
        } catch {
            purchaseError = error.localizedDescription
        }

        isPurchasing = false
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
                .frame(width: 30)

            Text(text)
                .foregroundColor(.white)
                .font(.subheadline)

            Spacer()
        }
    }
}

#Preview {
    StoreView()
        .environmentObject(StoreManager())
        .environmentObject(CareerManager())
}
