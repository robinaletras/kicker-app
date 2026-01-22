import SwiftUI

struct CareerYearEndView: View {
    @EnvironmentObject var careerManager: CareerManager
    @Environment(\.dismiss) var dismiss

    let year: CareerYear

    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [Color(red: 0.1, green: 0.2, blue: 0.3), Color(red: 0.05, green: 0.1, blue: 0.15)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 30) {
                Spacer()

                // Title
                VStack(spacing: 10) {
                    Text("Year \(year.year) Complete!")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text("52 Rounds Played")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.7))
                }

                // Result card
                VStack(spacing: 20) {
                    // Net profit/loss
                    VStack(spacing: 8) {
                        Text(year.netProfit >= 0 ? "Total Profit" : "Total Loss")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.7))

                        Text(year.netProfit >= 0 ? "+\(year.netProfit.formatted())" : "\(year.netProfit.formatted())")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(year.netProfit >= 0 ? .green : .red)
                    }

                    Divider()
                        .background(Color.white.opacity(0.3))

                    // Stats
                    HStack(spacing: 60) {
                        statColumn(title: "Earnings", value: year.totalEarnings, color: .green)
                        statColumn(title: "Final Chips", value: year.finalCoins, color: .yellow)
                    }
                }
                .padding(30)
                .background(Color.white.opacity(0.1))
                .cornerRadius(20)
                .padding(.horizontal, 20)

                // Performance message
                Text(performanceMessage)
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)

                Spacer()

                // Buttons
                VStack(spacing: 15) {
                    if careerManager.canRestartCareer {
                        Button {
                            careerManager.startNewCareer()
                            dismiss()
                        } label: {
                            Text("Start New Career")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .cornerRadius(12)
                        }
                    } else {
                        Button {
                            // Go to store to purchase restart
                            dismiss()
                        } label: {
                            Text("Unlock Career Restarts")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(12)
                        }
                    }

                    Button {
                        dismiss()
                    } label: {
                        Text("Back to Menu")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 40)
            }
        }
        .navigationBarBackButtonHidden(true)
    }

    private func statColumn(title: String, value: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
            Text(value.formatted())
                .font(.headline)
                .foregroundColor(color)
        }
    }

    private var performanceMessage: String {
        if year.netProfit >= 10000 {
            return "Incredible year! You're a Kicker legend!"
        } else if year.netProfit >= 5000 {
            return "Great performance! The cards were in your favor."
        } else if year.netProfit >= 1000 {
            return "Solid year. Keep up the good work!"
        } else if year.netProfit >= 0 {
            return "You came out ahead. Not bad!"
        } else if year.netProfit >= -1000 {
            return "Tough year, but you'll bounce back."
        } else if year.netProfit >= -5000 {
            return "The cards weren't kind. Better luck next year."
        } else {
            return "Rough year at the tables. Time for a comeback!"
        }
    }
}

#Preview {
    CareerYearEndView(year: CareerYear(year: 1, totalEarnings: 5000, finalCoins: 15000))
        .environmentObject(CareerManager())
}
