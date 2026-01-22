import SwiftUI

struct CareerHistoryView: View {
    @EnvironmentObject var careerManager: CareerManager
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.1, green: 0.15, blue: 0.2)
                    .ignoresSafeArea()

                if careerManager.careerHistory.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "clock.badge.questionmark")
                            .font(.system(size: 60))
                            .foregroundColor(.white.opacity(0.3))

                        Text("No Career History Yet")
                            .font(.title2)
                            .foregroundColor(.white.opacity(0.6))

                        Text("Complete a career year to see your results here.")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.4))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                    }
                } else {
                    List {
                        // Summary section
                        Section {
                            summaryRow(title: "Total Years", value: "\(careerManager.careerHistory.count)")
                            summaryRow(title: "Lifetime Earnings", value: formatCurrency(totalEarnings))
                            summaryRow(title: "Best Year", value: formatCurrency(bestYear?.netProfit ?? 0))
                        } header: {
                            Text("Career Summary")
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .listRowBackground(Color.white.opacity(0.1))

                        // Individual years
                        Section {
                            ForEach(careerManager.careerHistory.reversed()) { year in
                                yearRow(year)
                            }
                        } header: {
                            Text("Year by Year")
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .listRowBackground(Color.white.opacity(0.1))
                    }
                    .scrollContentBackground(.hidden)
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Career History")
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

    private func summaryRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
                .foregroundColor(.white.opacity(0.8))
            Spacer()
            Text(value)
                .fontWeight(.semibold)
                .foregroundColor(.white)
        }
    }

    private func yearRow(_ year: CareerYear) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Year \(year.year)")
                    .font(.headline)
                    .foregroundColor(.white)

                Spacer()

                Text(year.netProfit >= 0 ? "+\(formatCurrency(year.netProfit))" : formatCurrency(year.netProfit))
                    .font(.headline)
                    .foregroundColor(year.netProfit >= 0 ? .green : .red)
            }

            HStack(spacing: 30) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Earnings")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                    Text(formatCurrency(year.totalEarnings))
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("Final Balance")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                    Text(formatCurrency(year.finalCoins))
                        .font(.subheadline)
                        .foregroundColor(.yellow)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private var totalEarnings: Int {
        careerManager.careerHistory.reduce(0) { $0 + $1.netProfit }
    }

    private var bestYear: CareerYear? {
        careerManager.careerHistory.max(by: { $0.netProfit < $1.netProfit })
    }

    private func formatCurrency(_ value: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}

#Preview {
    CareerHistoryView()
        .environmentObject(CareerManager())
}
