import SwiftUI

struct MenuView: View {
    @EnvironmentObject var careerManager: CareerManager
    @EnvironmentObject var storeManager: StoreManager
    @EnvironmentObject var matchmakingManager: MatchmakingManager

    @State private var showCareerMode = false
    @State private var showQuickPlay = false
    @State private var showStore = false
    @State private var showHistory = false
    @State private var showRestartPrompt = false
    @State private var playerName: String = UserDefaults.standard.string(forKey: "playerName") ?? ""
    @State private var showNameEntry = false

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: [Color(red: 0.1, green: 0.4, blue: 0.2), Color(red: 0.05, green: 0.2, blue: 0.1)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                VStack(spacing: 30) {
                    Spacer()

                    // Title
                    Text("KICKER")
                        .font(.system(size: 72, weight: .black, design: .serif))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.yellow, .orange],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .shadow(color: .black.opacity(0.5), radius: 4, x: 2, y: 2)

                    Text("A Game of Cards & Bluffs")
                        .font(.title3)
                        .foregroundColor(.white.opacity(0.8))

                    Spacer()

                    // Coin display (removed - not needed in free model)

                    // Menu buttons
                    VStack(spacing: 16) {
                        MenuButton(title: "Career Mode", subtitle: careerButtonSubtitle, icon: "trophy.fill") {
                            if playerName.isEmpty {
                                showNameEntry = true
                            } else {
                                handleCareerTap()
                            }
                        }

                        MenuButton(title: "Quick Play", subtitle: "Jump right in", icon: "play.fill") {
                            if playerName.isEmpty {
                                showNameEntry = true
                            } else {
                                showQuickPlay = true
                            }
                        }

                        if careerManager.hasActiveCareer || careerManager.canRestartCareer || !careerManager.careerHistory.isEmpty {
                            MenuButton(title: "Unlock Restarts", subtitle: "Restart career anytime", icon: "arrow.clockwise.circle.fill") {
                                showStore = true
                            }
                        }

                        if !careerManager.careerHistory.isEmpty {
                            MenuButton(title: "Career History", subtitle: "\(careerManager.careerHistory.count) year(s)", icon: "clock.fill") {
                                showHistory = true
                            }
                        }
                    }
                    .padding(.horizontal, 40)

                    Spacer()

                    // Version
                    Text("v1.0")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                        .padding(.bottom, 20)
                }
            }
            .navigationDestination(isPresented: $showCareerMode) {
                LobbyView(mode: .career, playerName: playerName)
            }
            .navigationDestination(isPresented: $showQuickPlay) {
                LobbyView(mode: .quickPlay, playerName: playerName)
            }
            .sheet(isPresented: $showStore) {
                StoreView()
            }
            .sheet(isPresented: $showHistory) {
                CareerHistoryView()
            }
            .sheet(isPresented: $showNameEntry) {
                NameEntryView(playerName: $playerName) {
                    UserDefaults.standard.set(playerName, forKey: "playerName")
                    showNameEntry = false
                }
            }
            .alert("Restart Career?", isPresented: $showRestartPrompt) {
                Button("Cancel", role: .cancel) { }
                Button("Restart") {
                    careerManager.startNewCareer()
                    showCareerMode = true
                }
            } message: {
                Text("You'll get 10,000 coins and start a new career year.")
            }
        }
    }

    var careerButtonSubtitle: String {
        if careerManager.hasActiveCareer {
            return "Continue: \(careerManager.careerRound)/52"
        } else if careerManager.canStartFreeCareer() {
            return "Start free career"
        } else if careerManager.canRestartCareer {
            return "Restart anytime"
        } else {
            return "Purchase to restart"
        }
    }

    func handleCareerTap() {
        // Check if they can start/continue
        if careerManager.hasActiveCareer {
            // Continue existing career
            showCareerMode = true
        } else if careerManager.canStartFreeCareer() {
            // First time - start free
            careerManager.startNewCareer()
            showCareerMode = true
        } else if careerManager.canRestartCareer {
            // They've purchased - allow restart
            showRestartPrompt = true
        } else {
            // Need to purchase
            showStore = true
        }
    }
}

struct MenuButton: View {
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .frame(width: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                    Text(subtitle)
                        .font(.caption)
                        .opacity(0.7)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .opacity(0.5)
            }
            .foregroundColor(.white)
            .padding()
            .background(Color.white.opacity(0.15))
            .cornerRadius(12)
        }
    }
}

struct NameEntryView: View {
    @Binding var playerName: String
    let onComplete: () -> Void
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.1, green: 0.3, blue: 0.15)
                    .ignoresSafeArea()

                VStack(spacing: 30) {
                    Text("Enter Your Name")
                        .font(.title)
                        .foregroundColor(.white)

                    TextField("Your name", text: $playerName)
                        .textFieldStyle(.roundedBorder)
                        .padding(.horizontal, 40)

                    Button("Continue") {
                        if !playerName.isEmpty {
                            onComplete()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                    .disabled(playerName.isEmpty)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
}

enum GameMode {
    case career
    case quickPlay
}

#Preview {
    MenuView()
        .environmentObject(CareerManager())
        .environmentObject(StoreManager())
        .environmentObject(MatchmakingManager())
}
