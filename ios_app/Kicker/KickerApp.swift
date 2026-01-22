import SwiftUI

@main
struct KickerApp: App {
    var body: some Scene {
        WindowGroup {
            LaunchScreenView()
                .preferredColorScheme(.dark)
        }
    }
}

struct LaunchScreenView: View {
    @State private var showMainApp = false
    
    var body: some View {
        ZStack {
            // Simple splash - renders immediately
            Color(red: 0.1, green: 0.4, blue: 0.2)
                .ignoresSafeArea()
            
            VStack(spacing: 30) {
                Text("KICKER")
                    .font(.system(size: 72, weight: .black))
                    .foregroundColor(.yellow)
                
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)
            }
            
            // Load main app after showing splash
            if showMainApp {
                SplashView()
                    .transition(.opacity)
            }
        }
        .task {
            // Wait just a moment to ensure splash renders
            try? await Task.sleep(nanoseconds: 1_000_000) // 0.001 seconds (1 millisecond)
            showMainApp = true
        }
    }
}

struct SplashView: View {
    @StateObject private var careerManager = CareerManager()
    @StateObject private var storeManager = StoreManager()
    @StateObject private var matchmakingManager = MatchmakingManager()
    @State private var isLoading = true
    
    var body: some View {
        ZStack {
            if isLoading {
                // Splash/Loading screen
                LinearGradient(
                    colors: [Color(red: 0.1, green: 0.4, blue: 0.2), Color(red: 0.05, green: 0.2, blue: 0.1)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                VStack(spacing: 30) {
                    Spacer()
                    
                    // App title
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
                    
                    // Loading indicator
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.white)
                    
                    Text("Loading...")
                        .font(.headline)
                        .foregroundColor(.white.opacity(0.8))
                    
                    Spacer()
                }
            } else {
                // Main menu
                MenuView()
                    .environmentObject(careerManager)
                    .environmentObject(storeManager)
                    .environmentObject(matchmakingManager)
            }
        }
        .task {
            // Give managers time to initialize
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
            
            withAnimation {
                isLoading = false
            }
        }
    }
}

