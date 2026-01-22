import SwiftUI

struct BankView: View {
    @EnvironmentObject var careerManager: CareerManager
    @Environment(\.dismiss) var dismiss

    @State private var repayAmount: Int = 0
    @State private var showRepaySlider = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.1, green: 0.15, blue: 0.2)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 25) {
                        // Bank header
                        VStack(spacing: 8) {
                            Image(systemName: "building.columns.fill")
                                .font(.system(size: 50))
                                .foregroundColor(.yellow)

                            Text("THE BANK")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        .padding(.top, 20)

                        // Current status
                        VStack(spacing: 15) {
                            statusRow(title: "Your Coins", value: careerManager.coins, color: .yellow)
                            statusRow(title: "Amount Borrowed", value: careerManager.totalBorrowed, color: .orange)

                            Divider()
                                .background(Color.white.opacity(0.3))

                            let netPosition = careerManager.coins - careerManager.totalBorrowed
                            statusRow(
                                title: "Net Position",
                                value: netPosition,
                                color: netPosition >= 0 ? .green : .red,
                                showSign: true
                            )
                        }
                        .padding(20)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(15)
                        .padding(.horizontal)

                        // Borrow section
                        VStack(spacing: 15) {
                            Text("Borrow Coins")
                                .font(.headline)
                                .foregroundColor(.white)

                            Text("Borrow \(CareerManager.borrowAmount) coins at a time. No interest charged.")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                                .multilineTextAlignment(.center)

                            Button {
                                careerManager.borrowCoins()
                            } label: {
                                HStack {
                                    Image(systemName: "plus.circle.fill")
                                    Text("Borrow \(CareerManager.borrowAmount) Coins")
                                }
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(12)
                            }
                        }
                        .padding(20)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(15)
                        .padding(.horizontal)

                        // Repay section
                        if careerManager.totalBorrowed > 0 {
                            VStack(spacing: 15) {
                                Text("Repay Debt")
                                    .font(.headline)
                                    .foregroundColor(.white)

                                Text("Pay back what you've borrowed to improve your net position.")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.7))
                                    .multilineTextAlignment(.center)

                                if showRepaySlider {
                                    VStack(spacing: 10) {
                                        Text("Repay: \(repayAmount)")
                                            .font(.title3)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.green)

                                        Slider(
                                            value: Binding(
                                                get: { Double(repayAmount) },
                                                set: { repayAmount = Int($0) }
                                            ),
                                            in: 1...Double(careerManager.maxRepayAmount),
                                            step: 1
                                        )
                                        .tint(.green)

                                        HStack {
                                            Button("Cancel") {
                                                showRepaySlider = false
                                            }
                                            .foregroundColor(.white.opacity(0.7))

                                            Spacer()

                                            Button {
                                                careerManager.repayCoins(repayAmount)
                                                showRepaySlider = false
                                            } label: {
                                                Text("Confirm Repay")
                                                    .fontWeight(.semibold)
                                                    .foregroundColor(.white)
                                                    .padding(.horizontal, 20)
                                                    .padding(.vertical, 10)
                                                    .background(Color.green)
                                                    .cornerRadius(8)
                                            }
                                        }
                                    }
                                } else {
                                    HStack(spacing: 12) {
                                        // Quick repay buttons
                                        if careerManager.maxRepayAmount >= 50 {
                                            repayButton(amount: 50)
                                        }
                                        if careerManager.maxRepayAmount >= 100 {
                                            repayButton(amount: 100)
                                        }

                                        Button {
                                            repayAmount = min(careerManager.maxRepayAmount, 100)
                                            showRepaySlider = true
                                        } label: {
                                            Text("Custom")
                                                .font(.subheadline)
                                                .foregroundColor(.white)
                                                .padding(.horizontal, 16)
                                                .padding(.vertical, 10)
                                                .background(Color.gray.opacity(0.5))
                                                .cornerRadius(8)
                                        }
                                    }

                                    // Repay all button
                                    if careerManager.coins >= careerManager.totalBorrowed {
                                        Button {
                                            careerManager.repayCoins(careerManager.totalBorrowed)
                                        } label: {
                                            HStack {
                                                Image(systemName: "checkmark.circle.fill")
                                                Text("Repay All (\(careerManager.totalBorrowed))")
                                            }
                                            .font(.headline)
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding()
                                            .background(Color.green)
                                            .cornerRadius(12)
                                        }
                                    }
                                }
                            }
                            .padding(20)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(15)
                            .padding(.horizontal)
                        }

                        Spacer(minLength: 40)
                    }
                }
            }
            .navigationTitle("Bank")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }

    private func statusRow(title: String, value: Int, color: Color, showSign: Bool = false) -> some View {
        HStack {
            Text(title)
                .foregroundColor(.white.opacity(0.8))
            Spacer()
            Text(showSign && value >= 0 ? "+\(value)" : "\(value)")
                .fontWeight(.semibold)
                .foregroundColor(color)
        }
    }

    private func repayButton(amount: Int) -> some View {
        Button {
            careerManager.repayCoins(amount)
        } label: {
            Text("\(amount)")
                .font(.subheadline)
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.green.opacity(0.8))
                .cornerRadius(8)
        }
    }
}

#Preview {
    BankView()
        .environmentObject(CareerManager())
}
