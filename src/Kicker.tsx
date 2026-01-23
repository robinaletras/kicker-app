import { useState, useEffect, useRef } from 'react';

const SUITS = ['♠', '♥', '♦', '♣'] as const;
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
const RANK_VALUES: Record<string, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

type Suit = typeof SUITS[number];
type Rank = typeof RANKS[number];

interface CardType {
  suit: Suit;
  rank: Rank;
  value: number;
}

// AI Skill Levels:
// 'cautious' - folds when a higher card is revealed
// 'random' - randomly folds sometimes
// 'aggressive' - never folds, bets/raises often
type AISkillLevel = 'cautious' | 'random' | 'aggressive';

interface Player {
  name: string;
  chips: number;
  card: CardType | null;
  revealed: boolean;
  folded: boolean;
  eliminated: boolean;
  peekedCards: CardType[];
  currentBet: number;
  totalRoundBet: number; // Total bet this round (for side pot calculation)
  allIn: boolean;
  aiLevel?: AISkillLevel;
}

interface SidePot {
  amount: number;
  eligiblePlayers: string[]; // Player names eligible to win this pot
}

interface Winner {
  name: string;
  isSplit: boolean;
  reason: string;
  rollover: boolean;
  players?: Player[];
}

const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

interface CardProps {
  card: CardType | null;
  faceDown?: boolean;
  small?: boolean;
  highlight?: boolean;
  dimmed?: boolean;
}

const PokerChip = ({ color = '#ef4444', size = 24 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow">
    <ellipse cx="12" cy="12" rx="11" ry="11" fill={color} />
    <ellipse cx="12" cy="12" rx="8" ry="8" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3 2" />
    <ellipse cx="12" cy="12" rx="4" ry="4" fill="white" fillOpacity="0.3" />
  </svg>
);

const ChipStack = ({ chips }: { chips: number }) => {
  // Show 1-5 chips based on amount (visual representation, not exact)
  const stackCount = chips <= 0 ? 0 : chips <= 5 ? 1 : chips <= 15 ? 2 : chips <= 30 ? 3 : chips <= 50 ? 4 : 5;
  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];

  if (stackCount === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-gray-500 text-xs italic">No chips</div>
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-end">
      {Array.from({ length: stackCount }).map((_, stackIdx) => (
        <div key={stackIdx} className="flex flex-col-reverse" style={{ marginBottom: stackIdx * 2 }}>
          {Array.from({ length: Math.min(3, Math.ceil((chips - stackIdx * 10) / 5)) }).map((_, chipIdx) => (
            <div key={chipIdx} style={{ marginTop: chipIdx > 0 ? -18 : 0 }}>
              <PokerChip color={colors[stackIdx % colors.length]} size={24} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Card = ({ card, faceDown = false, small = false, highlight = false }: CardProps) => {
  const isRed = card?.suit === '♥' || card?.suit === '♦';

  if (faceDown) {
    return (
      <div className={`${small ? 'w-11 h-16' : 'w-14 h-20'} rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-emerald-600 flex items-center justify-center shadow`}>
        <div className={`text-emerald-400 ${small ? 'text-lg' : 'text-xl'} font-bold`}>K</div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className={`${small ? 'w-11 h-16' : 'w-14 h-20'} rounded-lg bg-white border-2 ${highlight ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-gray-300'} flex flex-col items-center justify-center shadow transition-all duration-300`}>
      <span className={`${small ? 'text-sm' : 'text-lg'} font-bold leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.rank}
      </span>
      <span className={`${small ? 'text-lg' : 'text-xl'} leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.suit}
      </span>
    </div>
  );
};

interface PassScreenProps {
  playerName: string;
  onReady: () => void;
}

const PassScreen = ({ playerName, onReady }: PassScreenProps) => (
  <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
    <div className="text-center p-4">
      <h2 className="font-display text-2xl text-amber-400 mb-3">Pass to {playerName}</h2>
      <p className="text-gray-400 mb-4 text-sm">Hand the device to {playerName}</p>
      <button
        onClick={onReady}
        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold text-base shadow-lg hover:from-emerald-500 hover:to-emerald-400 transition-all"
      >
        I'm {playerName} - Show My Card
      </button>
    </div>
  </div>
);

interface WinnerScreenProps {
  winner: Winner;
  pot: number;
  players: Player[];
  boardCard: CardType | null;
  onNextRound: () => void;
  rollover: boolean;
  onReplay?: () => void;
  onNewGame?: () => void;
  playerBroke?: boolean;
  onReloadFunds?: () => void;
}

const WinnerScreen = ({ winner, pot, players, boardCard, onNextRound, rollover, onReplay, onNewGame, playerBroke, onReloadFunds }: WinnerScreenProps) => (
  <div className="fixed inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-50">
    <div className="text-center p-4 max-w-md">
      {rollover ? (
        <>
          <h2 className="font-display text-xl text-purple-400 mb-2">The Board was the best Kicker!</h2>
          <p className="text-xl text-amber-400 mb-4">${pot} rolls over to next round</p>
        </>
      ) : (
        <>
          <h2 className="font-display text-xl text-amber-400 mb-2">
            {winner.isSplit ? `${winner.name} were the best Kickers!` : `${winner.name} was the best Kicker!`}
          </h2>
          <p className="text-sm text-gray-400 mb-1">{winner.reason}</p>
          <p className="text-xl text-emerald-400 mb-3">${pot} pot</p>
        </>
      )}

      {/* All 5 cards: Board + 4 Players */}
      <div className="flex justify-center items-end gap-2 mb-4">
        {/* Board Card */}
        <div className="text-center">
          <div className="text-xs text-emerald-400 font-bold mb-1">Board</div>
          <Card card={boardCard} small highlight={rollover} />
        </div>

        {/* Player Cards */}
        {players.map((p, i) => {
          const isWinner = !rollover && (
            winner.isSplit
              ? winner.players?.some(wp => wp.name === p.name)
              : winner.name === p.name
          );
          const pairsBoard = p.card?.value === boardCard?.value;

          return (
            <div key={i} className={`text-center ${p.folded ? 'opacity-40' : ''}`}>
              <div className={`text-xs mb-1 truncate max-w-[70px] ${isWinner ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                {p.name}
              </div>
              <Card
                card={p.card}
                small
                highlight={isWinner && !p.folded}
              />
              <div className="mt-1">
                {p.folded ? (
                  <span className="text-red-400 text-xs">Folded</span>
                ) : pairsBoard ? (
                  <span className="text-yellow-400 text-xs">Pairs!</span>
                ) : (
                  <span className="text-emerald-400 text-xs">${p.chips}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {playerBroke ? (
          <>
            <p className="text-red-400 font-bold text-lg mb-2">You're out of money!</p>
            {onReloadFunds && (
              <button
                onClick={onReloadFunds}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold text-base shadow-lg hover:from-emerald-500 hover:to-emerald-400 transition-all"
              >
                Reload Funds
              </button>
            )}
            {onNewGame && (
              <button
                onClick={onNewGame}
                className="px-8 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                ← New Game
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={onNextRound}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 rounded-xl font-bold text-base shadow-lg hover:from-amber-400 hover:to-yellow-300 transition-all"
            >
              Next Round
            </button>
            {onReplay && (
              <button
                onClick={onReplay}
                className="px-8 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg hover:from-cyan-500 hover:to-cyan-400 transition-all"
              >
                Replay Last Round
              </button>
            )}
            {onNewGame && (
              <button
                onClick={onNewGame}
                className="px-8 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                ← New Game
              </button>
            )}
          </>
        )}
      </div>
    </div>
  </div>
);

type GameState = 'menu' | 'lobby' | 'setup' | 'passing' | 'playing' | 'winner';
type Action = 'bet' | 'call' | 'raise' | 'check' | 'fold' | 'allIn';

// Turn timer constants
const TURN_TIME_LIMIT = 15; // seconds

export default function Kicker() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [communalCard, setCommunalCard] = useState<CardType | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    { name: 'Player 1', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
    { name: 'Player 2', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
    { name: 'Player 3', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
    { name: 'Player 4', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
  ]);
  const [pot, setPot] = useState(0);
  const [_sidePots, setSidePots] = useState<SidePot[]>([]); // TODO: Implement full side pot logic
  const [rolloverPot, setRolloverPot] = useState(0);
  const [aiRaiseCount, setAiRaiseCount] = useState<Record<number, number>>({}); // Track raises per AI player per betting round
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [currentBetAmount, setCurrentBetAmount] = useState(0);
  const [revealPhase, setRevealPhase] = useState(0);
  const [message, setMessage] = useState('');
  const [showPassScreen, setShowPassScreen] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [isRollover, setIsRollover] = useState(false);
  const [reloadNotification, setReloadNotification] = useState(false); // Show funds reloaded notification
  const winnerRef = useRef<Winner | null>(null); // Track winner for closures
  const reloadedThisRoundRef = useRef(false); // Prevent multiple reloads per round
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [isPlayerAI, setIsPlayerAI] = useState([false, false, false, false]);
  const [setupNames, setSetupNames] = useState(['', '', '', '']); // Pass & Play setup names
  const [setupIsAI, setSetupIsAI] = useState([false, false, false, false]); // Track AI players in Pass & Play
  const [autoAI, _setAutoAI] = useState(true);
  const [aiSpeed, _setAiSpeed] = useState(1); // 0.5 = fast, 1 = normal, 2 = slow
  const [aiPendingAction, setAiPendingAction] = useState<{ action: Action; amount?: number } | null>(null);
  const [lastRaiser, setLastRaiser] = useState(-1);
  const [bettingRoundStarter, setBettingRoundStarter] = useState(0);
  const [dealer, setDealer] = useState(0);
  const [revealOrder, setRevealOrder] = useState<number[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [roundHistory, setRoundHistory] = useState<{
    action: Action;
    playerIndex: number;
    amount?: number;
    message: string;
    playersAfter: Player[];
    potAfter: number;
    revealedCard?: { playerIndex: number };
  }[]>([]);
  const [roundStartState, setRoundStartState] = useState<{
    players: Player[];
    pot: number;
    currentPlayer: number;
    communalCard: CardType;
    revealOrder: number[];
  } | null>(null);

  // Turn timer state
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(TURN_TIME_LIMIT);
  const [turnTimerActive, setTurnTimerActive] = useState(false);

  // Lobby state
  const [seatedPlayers, setSeatedPlayers] = useState<(string | null)[]>([null, null, null, null]);
  const [localPlayerSeat, setLocalPlayerSeat] = useState<number | null>(null);
  const [localPlayerName, setLocalPlayerName] = useState('');

  const AI_NAMES = [
    'Alex', 'Sam', 'Jordan', 'Taylor', 'Casey',
    'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake',
    'Charlie', 'Drew', 'Frankie', 'Jamie', 'Jesse',
    'Kelly', 'Logan', 'Max', 'Peyton', 'Reese'
  ];

  const handleReady = () => {
    setShowPassScreen(false);
    setGameState('playing');
  };

  const getActivePlayers = () => players.filter(p => !p.folded && !p.eliminated);

  // Check if all human players have folded (only AIs remain active)
  const checkAllHumansFolded = (playersToCheck?: Player[]): boolean => {
    const playerList = playersToCheck || players;
    const activePlayers = playerList.filter(p => !p.folded && !p.eliminated);
    const activeHumans = activePlayers.filter(p => !p.aiLevel);
    const activeAIs = activePlayers.filter(p => p.aiLevel);

    // All humans folded and at least 2 AIs remain to play
    return activeHumans.length === 0 && activeAIs.length >= 2;
  };

  const findNextActivePlayer = (fromIndex: number, playersToCheck?: Player[]) => {
    const playerList = playersToCheck || players;
    let next = (fromIndex + 1) % 4;
    let attempts = 0;
    // Skip folded, eliminated, and all-in players (they can't act)
    while ((playerList[next].folded || playerList[next].eliminated || playerList[next].allIn) && attempts < 4) {
      next = (next + 1) % 4;
      attempts++;
    }
    return attempts >= 4 ? -1 : next;
  };

  // AI Decision Making
  const makeAIDecision = (player: Player, playerIndex: number): { action: Action; amount?: number } => {
    const myCard = player.card!;
    const aiLevel = player.aiLevel!;
    const toCall = currentBetAmount - player.currentBet;
    const canCheck = currentBetAmount === 0;
    const availableChips = player.chips;
    const canAffordCall = availableChips >= toCall;
    const maxBet = availableChips;
    const maxRaise = availableChips - toCall;

    // AI can only raise twice per betting round to prevent endless loops
    const aiRaises = aiRaiseCount[playerIndex] || 0;
    const canRaise = aiRaises < 2;

    // Get revealed cards that are higher than mine
    const revealedHigherCards = players.filter(
      p => p.revealed && !p.folded && !p.eliminated && p.card && p.card.value > myCard.value
    );

    // Check if board is higher than my card
    const boardHigher = communalCard && communalCard.value > myCard.value;

    // Check if I pair with the board
    const pairsWithBoard = communalCard && communalCard.value === myCard.value;

    // If can't afford to call, must fold or go all-in
    if (!canAffordCall && toCall > 0) {
      // Go all-in if we have a good hand
      if (pairsWithBoard || aiLevel === 'aggressive') {
        return { action: 'call' }; // Will be limited to all-in by handleAction
      }
      return { action: 'fold' };
    }

    if (aiLevel === 'cautious') {
      // Folds when a higher card is revealed or board is higher
      if (revealedHigherCards.length > 0 || boardHigher) {
        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
      }
      // Otherwise just call or check
      if (canCheck) return { action: 'check' };
      if (toCall > 0) return { action: 'call' };
      const betAmount = Math.min(1, maxBet);
      if (betAmount > 0) return { action: 'bet', amount: betAmount };
      return { action: 'check' };
    }

    if (aiLevel === 'random') {
      // 30% chance to fold if there's a bet (unless pairs with board)
      if (!pairsWithBoard && toCall > 0 && Math.random() < 0.3) {
        return { action: 'fold' };
      }
      // 20% chance to bet/raise if we can afford it AND haven't raised too much
      if (canRaise && Math.random() < 0.2) {
        const amount = Math.min(Math.floor(Math.random() * 3) + 1, canCheck ? maxBet : maxRaise);
        if (amount > 0) {
          if (canCheck) return { action: 'bet', amount };
          return { action: 'raise', amount };
        }
      }
      // Otherwise call or check
      if (canCheck) return { action: 'check' };
      return { action: 'call' };
    }

    if (aiLevel === 'aggressive') {
      // Never folds, often bets/raises (but limited to 2 raises)
      if (canRaise && pairsWithBoard) {
        // Always raise big with board pair (limited by chips)
        const amount = Math.min(3, canCheck ? maxBet : maxRaise);
        if (amount > 0) {
          if (canCheck) return { action: 'bet', amount };
          return { action: 'raise', amount };
        }
      }
      // 50% chance to bet/raise if we can afford it AND haven't raised too much
      if (canRaise && Math.random() < 0.5) {
        const amount = Math.min(Math.floor(Math.random() * 2) + 1, canCheck ? maxBet : maxRaise);
        if (amount > 0) {
          if (canCheck) return { action: 'bet', amount };
          return { action: 'raise', amount };
        }
      }
      // Otherwise call or check
      if (canCheck) return { action: 'check' };
      return { action: 'call' };
    }

    // Default fallback
    if (canCheck) return { action: 'check' };
    return { action: 'call' };
  };

  // Simulate the rest of the round instantly (for when all humans fold)
  const simulateRestOfRound = (
    simPlayers: Player[],
    simPot: number,
    simCurrentPlayer: number,
    simCurrentBet: number,
    simRevealPhase: number,
    simLastRaiser: number,
    simBettingStarter: number,
    simRevealOrder: number[],
    simAiRaiseCount: Record<number, number>
  ): { finalPlayers: Player[]; finalPot: number } => {
    let sPlayers = simPlayers.map(p => ({ ...p }));
    let sPot = simPot;
    let sCurrentPlayer = simCurrentPlayer;
    let sCurrentBet = simCurrentBet;
    let sRevealPhase = simRevealPhase;
    let sLastRaiser = simLastRaiser;
    let sBettingStarter = simBettingStarter;
    let sAiRaiseCount = { ...simAiRaiseCount };

    const MAX_ITERATIONS = 200; // Safety limit
    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const activePlayers = sPlayers.filter(p => !p.folded && !p.eliminated);
      const playersWhoCanAct = sPlayers.filter(p => !p.folded && !p.eliminated && !p.allIn);

      // End conditions
      if (activePlayers.length <= 1) break;
      if (playersWhoCanAct.length === 0) break;

      // Find next player who can act
      let nextPlayer = (sCurrentPlayer + 1) % 4;
      let attempts = 0;
      while ((sPlayers[nextPlayer].folded || sPlayers[nextPlayer].eliminated || sPlayers[nextPlayer].allIn) && attempts < 4) {
        nextPlayer = (nextPlayer + 1) % 4;
        attempts++;
      }
      if (attempts >= 4) break;

      // Check if betting round is complete
      const checkPlayer = sLastRaiser >= 0 ? sLastRaiser : sBettingStarter;
      const allMatched = activePlayers.every(p => p.currentBet === sCurrentBet || p.folded);

      const roundComplete = (nextPlayer === checkPlayer && allMatched && sCurrentBet > 0) ||
                           (nextPlayer === checkPlayer && sCurrentBet === 0 && sCurrentPlayer !== -1);

      if (roundComplete || (playersWhoCanAct.length === 1 && allMatched)) {
        // Reveal next card - include eliminated players, their cards still count
        let revealerIndex = -1;
        for (let i = 0; i < simRevealOrder.length; i++) {
          const idx = simRevealOrder[i];
          if (!sPlayers[idx].revealed) {
            revealerIndex = idx;
            break;
          }
        }

        if (revealerIndex === -1) {
          // All revealed, done
          break;
        }

        sPlayers[revealerIndex].revealed = true;
        sRevealPhase++;
        sCurrentBet = 0;
        sLastRaiser = -1;
        sAiRaiseCount = {};
        sPlayers = sPlayers.map(p => ({ ...p, currentBet: 0 }));

        // Find new betting starter
        let starter = 0;
        while (starter < 4 && sPlayers[starter].folded) starter++;
        sBettingStarter = starter;
        sCurrentPlayer = starter - 1; // Will be incremented
        continue;
      }

      sCurrentPlayer = nextPlayer;
      const player = sPlayers[sCurrentPlayer];

      // Make AI decision
      const toCall = sCurrentBet - player.currentBet;
      const aiRaises = sAiRaiseCount[sCurrentPlayer] || 0;
      const canRaise = aiRaises < 2;
      const decision = makeAIDecisionPure(player, sCurrentPlayer, sCurrentBet, canRaise, communalCard!, sPlayers);

      // Apply decision
      if (decision.action === 'fold') {
        sPlayers[sCurrentPlayer] = { ...player, folded: true };
      } else if (decision.action === 'check') {
        // Nothing changes
      } else if (decision.action === 'call') {
        const actualCall = Math.min(toCall, player.chips);
        sPlayers[sCurrentPlayer] = {
          ...player,
          chips: player.chips - actualCall,
          currentBet: player.currentBet + actualCall,
          totalRoundBet: player.totalRoundBet + actualCall,
          allIn: player.chips - actualCall <= 0
        };
        sPot += actualCall;
      } else if (decision.action === 'bet' && decision.amount) {
        const actualBet = Math.min(decision.amount, player.chips);
        sPlayers[sCurrentPlayer] = {
          ...player,
          chips: player.chips - actualBet,
          currentBet: player.currentBet + actualBet,
          totalRoundBet: player.totalRoundBet + actualBet,
          allIn: player.chips - actualBet <= 0
        };
        sPot += actualBet;
        sCurrentBet = actualBet;
        sLastRaiser = sCurrentPlayer;
        sAiRaiseCount[sCurrentPlayer] = (sAiRaiseCount[sCurrentPlayer] || 0) + 1;
      } else if (decision.action === 'raise' && decision.amount) {
        const totalCost = toCall + decision.amount;
        const actualCost = Math.min(totalCost, player.chips);
        sPlayers[sCurrentPlayer] = {
          ...player,
          chips: player.chips - actualCost,
          currentBet: sCurrentBet + decision.amount,
          totalRoundBet: player.totalRoundBet + actualCost,
          allIn: player.chips - actualCost <= 0
        };
        sPot += actualCost;
        sCurrentBet = sCurrentBet + decision.amount;
        sLastRaiser = sCurrentPlayer;
        sAiRaiseCount[sCurrentPlayer] = (sAiRaiseCount[sCurrentPlayer] || 0) + 1;
      }
    }

    // Reveal all remaining cards
    sPlayers = sPlayers.map(p => ({ ...p, revealed: true }));

    return { finalPlayers: sPlayers, finalPot: sPot };
  };

  // Pure version of AI decision (doesn't use React state)
  const makeAIDecisionPure = (
    player: Player,
    _playerIndex: number,
    currentBet: number,
    canRaiseMore: boolean,
    boardCard: CardType,
    allPlayers: Player[]
  ): { action: Action; amount?: number } => {
    const myCard = player.card!;
    const aiLevel = player.aiLevel!;
    const toCall = currentBet - player.currentBet;
    const canCheck = currentBet === 0;
    const availableChips = player.chips;
    const canAffordCall = availableChips >= toCall;
    const maxBet = availableChips;
    const maxRaise = availableChips - toCall;

    const revealedHigherCards = allPlayers.filter(
      p => p.revealed && !p.folded && !p.eliminated && p.card && p.card.value > myCard.value
    );
    const boardHigher = boardCard.value > myCard.value;
    const pairsWithBoard = boardCard.value === myCard.value;

    if (!canAffordCall && toCall > 0) {
      if (pairsWithBoard || aiLevel === 'aggressive') return { action: 'call' };
      return { action: 'fold' };
    }

    if (aiLevel === 'cautious') {
      if (revealedHigherCards.length > 0 || boardHigher) {
        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
      }
      if (canCheck) return { action: 'check' };
      if (toCall > 0) return { action: 'call' };
      const betAmount = Math.min(1, maxBet);
      if (betAmount > 0) return { action: 'bet', amount: betAmount };
      return { action: 'check' };
    }

    if (aiLevel === 'random') {
      if (!pairsWithBoard && toCall > 0 && Math.random() < 0.3) return { action: 'fold' };
      if (canRaiseMore && Math.random() < 0.2) {
        const amount = Math.min(Math.floor(Math.random() * 3) + 1, canCheck ? maxBet : maxRaise);
        if (amount > 0) {
          if (canCheck) return { action: 'bet', amount };
          return { action: 'raise', amount };
        }
      }
      if (canCheck) return { action: 'check' };
      return { action: 'call' };
    }

    if (aiLevel === 'aggressive') {
      if (canRaiseMore && pairsWithBoard) {
        const amount = Math.min(3, canCheck ? maxBet : maxRaise);
        if (amount > 0) {
          if (canCheck) return { action: 'bet', amount };
          return { action: 'raise', amount };
        }
      }
      if (canRaiseMore && Math.random() < 0.5) {
        const amount = Math.min(Math.floor(Math.random() * 2) + 1, canCheck ? maxBet : maxRaise);
        if (amount > 0) {
          if (canCheck) return { action: 'bet', amount };
          return { action: 'raise', amount };
        }
      }
      if (canCheck) return { action: 'check' };
      return { action: 'call' };
    }

    if (canCheck) return { action: 'check' };
    return { action: 'call' };
  };

  const determineWinner = (playersToCheck?: Player[]): Winner => {
    const playerList = playersToCheck || players;
    // Players who can WIN the pot (not folded, not eliminated)
    const activePlayers = playerList.filter(p => !p.folded && !p.eliminated);
    // ALL players with cards (including eliminated) - their cards still count in the hand
    const playersWithCards = playerList.filter(p => p.card && !p.folded);
    const boardValue = communalCard!.value;
    const boardRank = communalCard!.rank;
    const boardSuit = communalCard!.suit;

    // Collect all cards with suits for hand evaluation - include eliminated players' cards
    const allCards = [
      { value: boardValue, rank: boardRank, suit: boardSuit, isBoard: true, player: null as Player | null, eliminated: false },
      ...playersWithCards.map(p => ({
        value: p.card!.value,
        rank: p.card!.rank,
        suit: p.card!.suit,
        isBoard: false,
        player: p,
        eliminated: p.eliminated
      }))
    ];

    // Check for flush (all 5 cards same suit)
    const suitCounts: Record<string, number> = {};
    for (const card of allCards) {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }
    const isFlush = Object.values(suitCounts).some(count => count === 5);
    const flushSuit = isFlush ? Object.entries(suitCounts).find(([_, count]) => count === 5)?.[0] : null;

    // Check for straight (5 UNIQUE consecutive values)
    const sortedValues = [...allCards].map(c => c.value).sort((a, b) => a - b);
    const uniqueSortedValues = [...new Set(sortedValues)].sort((a, b) => a - b);

    // Must have exactly 5 unique values for a straight
    let isStraight = uniqueSortedValues.length === 5;
    if (isStraight) {
      for (let i = 1; i < uniqueSortedValues.length; i++) {
        if (uniqueSortedValues[i] !== uniqueSortedValues[i - 1] + 1) {
          isStraight = false;
          break;
        }
      }
    }
    // Check for A-2-3-4-5 straight (wheel)
    const isWheel = uniqueSortedValues.join(',') === '2,3,4,5,14';
    if (isWheel) isStraight = true;

    // Count occurrences of each value to find pairs/trips/quads
    const valueCounts: Record<number, { count: number; players: Player[]; includesBoard: boolean }> = {};
    for (const card of allCards) {
      if (!valueCounts[card.value]) {
        valueCounts[card.value] = { count: 0, players: [], includesBoard: false };
      }
      valueCounts[card.value].count++;
      if (card.isBoard) {
        valueCounts[card.value].includesBoard = true;
      } else if (card.player) {
        valueCounts[card.value].players.push(card.player);
      }
    }

    // Find pairs, trips, quads
    const pairs: { value: number; players: Player[]; includesBoard: boolean }[] = [];
    let trips: { value: number; players: Player[]; includesBoard: boolean } | null = null;
    let quads: { value: number; players: Player[]; includesBoard: boolean } | null = null;

    for (const [valueStr, data] of Object.entries(valueCounts)) {
      const value = parseInt(valueStr);
      if (data.count >= 4) {
        quads = { value, players: data.players, includesBoard: data.includesBoard };
      } else if (data.count === 3) {
        trips = { value, players: data.players, includesBoard: data.includesBoard };
      } else if (data.count === 2) {
        pairs.push({ value, players: data.players, includesBoard: data.includesBoard });
      }
    }

    // Sort pairs by value descending
    pairs.sort((a, b) => b.value - a.value);

    // Check for full house (trips + pair)
    const isFullHouse = trips !== null && pairs.length >= 1;

    // Check for straight flush
    const isStraightFlush = isStraight && isFlush;

    // Helper to find kicker holder
    const findKickerHolder = (usedValues: Set<number>): { kickerRank: string; kickerIsBoard: boolean; kickerPlayer: Player | null } => {
      const kickerCandidates = allCards
        .filter(c => !usedValues.has(c.value))
        .sort((a, b) => b.value - a.value);

      if (kickerCandidates.length > 0) {
        const kicker = kickerCandidates[0];
        return { kickerRank: kicker.rank, kickerIsBoard: kicker.isBoard, kickerPlayer: kicker.player };
      }
      return { kickerRank: '', kickerIsBoard: false, kickerPlayer: null };
    };

    // Helper to get kicker description
    const getKickerDescription = (usedValues: Set<number>): string => {
      const { kickerRank } = findKickerHolder(usedValues);
      return kickerRank ? `, ${kickerRank} kicker` : '';
    };

    // Helper to determine winner - the player who MADE the hand wins
    // If multiple players made the hand, they SPLIT (shared kicker)
    // If no kicker exists (all cards used), then ROLLOVER
    // NOTE: Eliminated players' cards count for making the hand but they can't WIN
    const resolveByHandMaker = (handDescription: string, usedValues: Set<number>, handMakers: Player[]): Winner => {
      const kickerDesc = getKickerDescription(usedValues);
      const hasKicker = kickerDesc !== '';
      // Filter out eliminated players - they can't win
      const eligibleWinners = handMakers.filter(p => !p.eliminated);
      console.log('resolveByHandMaker:', handDescription, 'handMakers:', handMakers.map(p => p.name), 'eligibleWinners:', eligibleWinners.map(p => p.name), 'hasKicker:', hasKicker);

      if (eligibleWinners.length === 1) {
        // One eligible player made the hand - they win
        console.log('Winner:', eligibleWinners[0].name);
        return {
          name: eligibleWinners[0].name,
          isSplit: false,
          reason: `${handDescription}${kickerDesc}`,
          rollover: false
        };
      } else if (eligibleWinners.length > 1) {
        // Multiple eligible players made the hand - they SPLIT the pot
        console.log('Split between:', eligibleWinners.map(p => p.name));
        return {
          name: eligibleWinners.map(p => p.name).join(' & '),
          isSplit: true,
          players: eligibleWinners,
          reason: `${handDescription}${kickerDesc}`,
          rollover: false
        };
      }
      // No eligible players made the hand (all were eliminated or board only) - rollover
      console.log('No eligible handMakers - Board rollover');
      return { name: 'Board', isSplit: false, reason: handDescription, rollover: true };
    };

    // DEBUG: Log hand evaluation
    console.log('=== HAND EVALUATION ===');
    console.log('All cards:', allCards.map(c => `${c.rank}${c.suit}${c.isBoard ? '(B)' : `(${c.player?.name})`}`));
    console.log('Pairs:', pairs.map(p => `${p.value} by [${p.players.map(pl => pl.name).join(', ')}]`));
    console.log('Trips:', trips ? `${trips.value} by [${trips.players.map(pl => pl.name).join(', ')}]` : 'none');
    console.log('isFlush:', isFlush, 'isStraight:', isStraight);

    // Evaluate hand type from highest to lowest
    // 1. Straight Flush
    if (isStraightFlush) {
      const highCard = isWheel ? allCards.find(c => c.value === 5) : allCards.reduce((a, b) => a.value > b.value ? a : b);
      const handDescription = `Straight Flush (${flushSuit})`;

      if (highCard?.isBoard) {
        return { name: 'Board', isSplit: false, reason: `${handDescription} - Board high`, rollover: true };
      }
      // Skip eliminated players
      if (highCard?.player && !highCard.eliminated) {
        return { name: highCard.player.name, isSplit: false, reason: handDescription, rollover: false };
      }
      // Find eligible player with highest card in the straight
      const sortedByValue = [...allCards].sort((a, b) => b.value - a.value);
      for (const card of sortedByValue) {
        if (!card.isBoard && card.player && !card.eliminated) {
          return { name: card.player.name, isSplit: false, reason: handDescription, rollover: false };
        }
      }
      return { name: 'Board', isSplit: false, reason: handDescription, rollover: true };
    }

    // 2. Four of a kind (rare but possible)
    if (quads) {
      const quadRank = allCards.find(c => c.value === quads!.value)?.rank || '';
      const handDescription = `Four ${quadRank}s`;
      const usedValues = new Set([quads.value]);
      return resolveByHandMaker(handDescription, usedValues, quads.players);
    }

    // 3. Full House
    if (isFullHouse) {
      const tripRank = allCards.find(c => c.value === trips!.value)?.rank || '';
      const pairRank = allCards.find(c => c.value === pairs[0].value)?.rank || '';
      const handDescription = `Full House, ${tripRank}s full of ${pairRank}s`;

      // Each player has only ONE card, so no one can own both trips AND pair
      // Full house is always a shared hand - rollover
      console.log('Full house - shared hand, rollover');
      return { name: 'Tie', isSplit: false, reason: `${handDescription} - Tie!`, rollover: true };
    }

    // 4. Flush
    if (isFlush) {
      const handDescription = `Flush (${flushSuit})`;
      // Highest card in flush determines winner - skip eliminated players
      const sortedByValue = [...allCards].sort((a, b) => b.value - a.value);

      // Find highest eligible card
      for (const card of sortedByValue) {
        if (card.isBoard) {
          // Board is high - find next eligible player card
          continue;
        }
        if (card.player && !card.eliminated) {
          return { name: card.player.name, isSplit: false, reason: `${handDescription}, ${card.rank} high`, rollover: false };
        }
      }
      // No eligible player - board wins (rollover)
      return { name: 'Board', isSplit: false, reason: `${handDescription} - Board high`, rollover: true };
    }

    // 5. Straight
    if (isStraight) {
      const handDescription = isWheel ? 'Straight (Wheel)' : 'Straight';
      // Highest card determines winner (or 5 for wheel) - skip eliminated players
      const sortedByValue = [...allCards].sort((a, b) => b.value - a.value);

      // Find highest eligible card
      for (const card of sortedByValue) {
        if (card.isBoard) {
          continue;
        }
        if (card.player && !card.eliminated) {
          return { name: card.player.name, isSplit: false, reason: `${handDescription}, ${card.rank} high`, rollover: false };
        }
      }
      // No eligible player - board wins (rollover)
      return { name: 'Board', isSplit: false, reason: `${handDescription} - Board high`, rollover: true };
    }

    // 6. Three of a kind
    if (trips) {
      const tripRank = allCards.find(c => c.value === trips!.value)?.rank || '';
      const handDescription = `Three ${tripRank}s`;
      const usedValues = new Set([trips.value]);
      return resolveByHandMaker(handDescription, usedValues, trips.players);
    }

    // 7. Two pair
    if (pairs.length >= 2) {
      const pair1Rank = allCards.find(c => c.value === pairs[0].value)?.rank || '';
      const pair2Rank = allCards.find(c => c.value === pairs[1].value)?.rank || '';
      const handDescription = `Two Pair, ${pair1Rank}s and ${pair2Rank}s`;
      const usedValues = new Set([pairs[0].value, pairs[1].value]);
      const kickerDesc = getKickerDescription(usedValues);

      // For two pair, no single player "owns" both pairs
      // So it's a shared hand - rollover
      console.log('Two pair detected - rollover (no single owner)');
      return { name: 'Tie', isSplit: false, reason: `${handDescription}${kickerDesc} - Tie!`, rollover: true };
    }

    // 8. One pair
    if (pairs.length === 1) {
      const pairRank = allCards.find(c => c.value === pairs[0].value)?.rank || '';
      const pairValue = pairs[0].value;
      const includesBoard = pairs[0].includesBoard;

      // Find ALL players who have this card value (not just from pairs array)
      const playersWithPairValue = activePlayers.filter(p => p.card!.value === pairValue);

      console.log('One pair detected:', pairRank, 'includesBoard:', includesBoard);
      console.log('Players with pair value:', playersWithPairValue.map(p => p.name));

      if (includesBoard) {
        // Player pairs with board - they win (or split if multiple players pair with board, which would be trips)
        const handDescription = `Pair of ${pairRank}s (with board)`;
        const usedValues = new Set([pairValue]);
        return resolveByHandMaker(handDescription, usedValues, playersWithPairValue);
      } else {
        // Player pair (two players have same card) - they split
        const handDescription = `Pair of ${pairRank}s`;
        const usedValues = new Set([pairValue]);

        // Ensure we include ALL players with this card value
        if (playersWithPairValue.length >= 2) {
          console.log('Player pair - splitting between:', playersWithPairValue.map(p => p.name));
          return {
            name: playersWithPairValue.map(p => p.name).join(' & '),
            isSplit: true,
            players: playersWithPairValue,
            reason: `${handDescription}${getKickerDescription(usedValues)}`,
            rollover: false
          };
        }

        return resolveByHandMaker(handDescription, usedValues, playersWithPairValue);
      }
    }

    // 9. High card - find highest card held by an eligible (non-eliminated) player
    console.log('Fell through to HIGH CARD - no pairs/trips detected!');
    const sortedCards = [...allCards].sort((a, b) => b.value - a.value);

    // Find highest eligible card (skip board and eliminated players)
    for (const card of sortedCards) {
      if (card.isBoard) {
        // If board is highest, it's a rollover
        console.log('Board has high card - rollover');
        return { name: 'Board', isSplit: false, reason: `${boardRank} high - Board wins`, rollover: true };
      }
      if (card.eliminated) {
        // Skip eliminated players' cards
        continue;
      }
      // Found highest eligible player card
      const highCardPlayers = activePlayers.filter(p => p.card!.value === card.value);
      if (highCardPlayers.length === 1) {
        console.log('High card winner:', highCardPlayers[0].name);
        return { name: highCardPlayers[0].name, isSplit: false, reason: `${card.rank} high`, rollover: false };
      } else if (highCardPlayers.length > 1) {
        // Multiple players tied for high card - they split
        console.log('High card split:', highCardPlayers.map(p => p.name));
        return {
          name: highCardPlayers.map(p => p.name).join(' & '),
          isSplit: true,
          players: highCardPlayers,
          reason: `${card.rank} high`,
          rollover: false
        };
      }
    }
    // Fallback - board wins (all player cards were eliminated)
    return { name: 'Board', isSplit: false, reason: `${boardRank} high - Board wins`, rollover: true };
  };

  const endRound = (finalPot?: number, finalPlayers?: Player[]) => {
    const playersToUse = finalPlayers || players;
    let newPlayers = playersToUse.map(p => ({ ...p, revealed: true }));

    // Calculate side pots based on totalRoundBet
    const activePlayers = newPlayers.filter(p => !p.folded && !p.eliminated);

    // If only one active player, they win everything
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      const potToUse = finalPot !== undefined ? finalPot : pot;
      newPlayers = newPlayers.map(p =>
        p.name === winner.name ? { ...p, chips: p.chips + potToUse } : p
      );
      setPlayers(newPlayers);
      setWinner({ name: winner.name, isSplit: false, reason: 'Last player standing', rollover: false });
      setRolloverPot(0);
      setGameState('winner');
      return;
    }

    // Get unique bet levels (for side pot calculation)
    const betLevels = [...new Set(activePlayers.map(p => p.totalRoundBet))].sort((a, b) => a - b);

    // Calculate pots at each level
    interface PotInfo {
      amount: number;
      eligiblePlayers: Player[];
      winner: Winner | null;
    }
    const pots: PotInfo[] = [];
    let previousLevel = 0;

    for (const level of betLevels) {
      const contribution = level - previousLevel;
      // All players who bet at least this level contribute
      const contributors = newPlayers.filter(p => p.totalRoundBet >= level && !p.eliminated);
      const potAmount = contribution * contributors.length;

      // Eligible to WIN are non-folded players who contributed to this level
      const eligiblePlayers = contributors.filter(p => !p.folded);

      if (potAmount > 0 && eligiblePlayers.length > 0) {
        pots.push({
          amount: potAmount,
          eligiblePlayers,
          winner: null
        });
      }
      previousLevel = level;
    }

    // Add any rollover to the first pot
    if (rolloverPot > 0 && pots.length > 0) {
      pots[0].amount += rolloverPot;
    }

    // Determine winner for each pot
    let totalRollover = 0;
    const potWinners: string[] = [];

    for (const potInfo of pots) {
      // Create a filtered player list for this pot's eligible players
      const eligibleForPot = newPlayers.map(p => ({
        ...p,
        // Mark players not eligible for this pot as folded for winner determination
        folded: p.folded || !potInfo.eligiblePlayers.some(ep => ep.name === p.name)
      }));

      const winnerResult = determineWinner(eligibleForPot);
      potInfo.winner = winnerResult;

      if (winnerResult.rollover) {
        totalRollover += potInfo.amount;
      } else if (winnerResult.isSplit && winnerResult.players) {
        const share = Math.floor(potInfo.amount / winnerResult.players.length);
        newPlayers = newPlayers.map(p => {
          const isWinner = winnerResult.players!.some(wp => wp.name === p.name);
          return isWinner ? { ...p, chips: p.chips + share } : p;
        });
        potWinners.push(`${winnerResult.name} split $${potInfo.amount}`);
      } else {
        newPlayers = newPlayers.map(p =>
          p.name === winnerResult.name ? { ...p, chips: p.chips + potInfo.amount } : p
        );
        potWinners.push(`${winnerResult.name} won $${potInfo.amount}`);
      }
    }

    // Use the first pot's winner for display (main pot)
    const mainWinner = pots.length > 0 && pots[0].winner ? pots[0].winner : {
      name: 'No winner',
      isSplit: false,
      reason: 'No eligible players',
      rollover: true
    };

    // If there are side pots, add info to the reason
    if (pots.length > 1) {
      mainWinner.reason += ` (${pots.length} pots)`;
    }

    setPlayers(newPlayers);
    setWinner(mainWinner);
    setRolloverPot(totalRollover);
    setIsRollover(totalRollover > 0);
    setGameState('winner');
  };

  const startNextBettingRound = (newPlayers: Player[], nextRevealPhase: number) => {
    // Explicitly preserve revealed state while resetting currentBet
    const resetPlayers = newPlayers.map(p => ({
      ...p,
      currentBet: 0,
      revealed: p.revealed  // explicitly preserve
    }));
    setPlayers(resetPlayers);
    setCurrentBetAmount(0);
    setLastRaiser(-1);
    setAiRaiseCount({}); // Reset AI raise count for new betting round

    let starter = 0;
    while (starter < 4 && resetPlayers[starter].folded) {
      starter++;
    }
    if (starter >= 4) {
      endRound(pot, resetPlayers);
      return;
    }

    setBettingRoundStarter(starter);
    setCurrentPlayer(starter);
    setRevealPhase(nextRevealPhase);
    setShowPassScreen(true);
    setGameState('passing');
  };

  const advanceToNextPlayer = (updatedPlayers?: Player[], updatedPot?: number, newLastRaiser?: number, newCurrentBet?: number) => {
    // Don't advance if game/round has ended
    if (winner) return;

    const playersToUse = updatedPlayers || players;
    const potToUse = updatedPot !== undefined ? updatedPot : pot;
    const activePlayers = playersToUse.filter(p => !p.folded && !p.eliminated);
    const playersWhoCanAct = playersToUse.filter(p => !p.folded && !p.eliminated && !p.allIn);
    const lastRaiserToUse = newLastRaiser !== undefined ? newLastRaiser : lastRaiser;
    const currentBetToUse = newCurrentBet !== undefined ? newCurrentBet : currentBetAmount;

    // If only one active player left, they win
    if (activePlayers.length === 1) {
      endRound(potToUse, playersToUse);
      return;
    }

    // If no one can act (all are all-in or folded), end the round
    if (playersWhoCanAct.length === 0) {
      endRound(potToUse, playersToUse);
      return;
    }

    // Check if all humans have folded - simulate rest and end round immediately
    const allHumansFolded = checkAllHumansFolded(playersToUse);
    if (allHumansFolded && !isReplaying) {
      // Simulate the rest of the round to get correct final money
      const { finalPlayers, finalPot } = simulateRestOfRound(
        playersToUse,
        potToUse,
        currentPlayer,
        currentBetToUse,
        revealPhase,
        lastRaiserToUse,
        bettingRoundStarter,
        revealOrder,
        aiRaiseCount
      );

      // End round with simulated results
      endRound(finalPot, finalPlayers);
      return;
    }

    // If only one player can act, skip betting and go straight to reveal/end
    if (playersWhoCanAct.length === 1) {
      // Find next card to reveal
      let revealerIndex = -1;
      for (let i = 0; i < revealOrder.length; i++) {
        const idx = revealOrder[i];
        // Include eliminated players in reveal - their cards still count
        if (!playersToUse[idx].revealed) {
          revealerIndex = idx;
          break;
        }
      }

      if (revealerIndex === -1) {
        // All cards revealed, end the round
        endRound(potToUse, playersToUse);
        return;
      }

      // Reveal the next card and start new betting round
      const nextReveal = revealPhase + 1;
      const revealedPlayers = playersToUse.map((p, i) =>
        i === revealerIndex ? { ...p, revealed: true } : p
      );
      const revealer = revealedPlayers[revealerIndex];
      const statusNote = revealer.eliminated ? ' (out)' : revealer.folded ? ' (folded)' : '';
      const revealMsg = `${revealer.name} reveals: ${revealer.card!.rank}${revealer.card!.suit}${statusNote}`;
      setMessage(revealMsg);
      // Record reveal (not during replay)
      if (!isReplaying) {
        setRoundHistory(prev => [...prev, { action: 'check' as Action, playerIndex: revealerIndex, message: revealMsg, playersAfter: revealedPlayers.map(p => ({...p})), potAfter: potToUse, revealedCard: { playerIndex: revealerIndex } }]);
      }
      setPot(potToUse);
      startNextBettingRound(revealedPlayers, nextReveal);
      return;
    }

    const nextPlayer = findNextActivePlayer(currentPlayer, playersToUse);

    if (nextPlayer === -1) {
      endRound(potToUse, playersToUse);
      return;
    }

    // Determine who we're waiting to get back to for the round to end
    // If the original check player (raiser or starter) has folded, find the next active player from that position
    let checkPlayer = lastRaiserToUse >= 0 ? lastRaiserToUse : bettingRoundStarter;
    if (playersToUse[checkPlayer].folded || playersToUse[checkPlayer].eliminated) {
      checkPlayer = findNextActivePlayer(checkPlayer - 1, playersToUse); // -1 because findNext starts at +1
      if (checkPlayer === -1) checkPlayer = bettingRoundStarter; // fallback
    }
    const allMatched = activePlayers.every(p => p.currentBet === currentBetToUse || p.folded);

    if (nextPlayer === checkPlayer && allMatched && currentBetToUse > 0) {
      const nextReveal = revealPhase + 1;

      let revealerIndex = -1;
      for (let i = 0; i < revealOrder.length; i++) {
        const idx = revealOrder[i];
        // Reveal ALL cards (including folded and eliminated players) - their cards count
        if (!playersToUse[idx].revealed) {
          revealerIndex = idx;
          break;
        }
      }

      if (revealerIndex === -1) {
        // All cards revealed, end the round
        endRound(potToUse, playersToUse);
        return;
      }

      const revealedPlayers = playersToUse.map((p, i) =>
        i === revealerIndex ? { ...p, revealed: true } : p
      );
      const revealer = revealedPlayers[revealerIndex];
      const statusNote = revealer.eliminated ? ' (out)' : revealer.folded ? ' (folded)' : '';
      const revealMsg = `${revealer.name} reveals: ${revealer.card!.rank}${revealer.card!.suit}${statusNote}`;
      setMessage(revealMsg);
      if (!isReplaying) {
        setRoundHistory(prev => [...prev, { action: 'check' as Action, playerIndex: revealerIndex, message: revealMsg, playersAfter: revealedPlayers.map(p => ({...p})), potAfter: potToUse, revealedCard: { playerIndex: revealerIndex } }]);
      }
      setPot(potToUse);
      startNextBettingRound(revealedPlayers, nextReveal);
    } else if (nextPlayer === checkPlayer && currentBetToUse === 0) {
      const nextReveal = revealPhase + 1;

      let revealerIndex = -1;
      for (let i = 0; i < revealOrder.length; i++) {
        const idx = revealOrder[i];
        // Include eliminated players in reveal
        if (!playersToUse[idx].revealed) {
          revealerIndex = idx;
          break;
        }
      }

      if (revealerIndex === -1) {
        endRound(potToUse, playersToUse);
        return;
      }

      const revealedPlayers = playersToUse.map((p, i) =>
        i === revealerIndex ? { ...p, revealed: true } : p
      );
      const revealer = revealedPlayers[revealerIndex];
      const statusNote2 = revealer.eliminated ? ' (out)' : revealer.folded ? ' (folded)' : '';
      const revealMsg2 = `${revealer.name} reveals: ${revealer.card!.rank}${revealer.card!.suit}${statusNote2}`;
      setMessage(revealMsg2);
      if (!isReplaying) {
        setRoundHistory(prev => [...prev, { action: 'check' as Action, playerIndex: revealerIndex, message: revealMsg2, playersAfter: revealedPlayers.map(p => ({...p})), potAfter: potToUse, revealedCard: { playerIndex: revealerIndex } }]);
      }
      setPot(potToUse);
      startNextBettingRound(revealedPlayers, nextReveal);
    } else {
      setCurrentPlayer(nextPlayer);
      // Explicitly preserve all player state including revealed
      const preservedPlayers = playersToUse.map(p => ({ ...p, revealed: p.revealed }));
      setPlayers(preservedPlayers);
      setPot(potToUse);
      setShowPassScreen(true);
      setGameState('passing');
    }
  };

  const handleAction = (action: Action, amount = 0) => {
    // Don't allow actions after the game/round has ended
    if (winner) return;

    // Stop turn timer when action is taken
    setTurnTimerActive(false);

    const player = players[currentPlayer];
    let newPot = pot;
    const toCall = Math.min(currentBetAmount - player.currentBet, player.chips);
    // Always create a fresh copy to preserve all state including revealed
    let newPlayers = players.map(p => ({ ...p }));
    let actionMessage = '';

    // Helper to update player with all-in detection
    const updatePlayer = (p: Player, i: number, chipCost: number, newBet: number): Player => {
      if (i !== currentPlayer) return p;
      const newChips = p.chips - chipCost;
      const isAllIn = newChips <= 0;
      return {
        ...p,
        chips: Math.max(0, newChips),
        currentBet: newBet,
        totalRoundBet: p.totalRoundBet + chipCost,
        allIn: isAllIn || p.allIn
      };
    };

    if (action === 'bet') {
      // Limit bet to available chips
      const actualBet = Math.min(amount, player.chips);
      if (actualBet <= 0) return; // Can't bet with no chips
      const isAllIn = actualBet >= player.chips;
      newPlayers = newPlayers.map((p, i) => updatePlayer(p, i, actualBet, p.currentBet + actualBet));
      newPot = pot + actualBet;
      setCurrentBetAmount(actualBet);
      setLastRaiser(currentPlayer);
      if (player.aiLevel) {
        setAiRaiseCount(prev => ({ ...prev, [currentPlayer]: (prev[currentPlayer] || 0) + 1 }));
      }
      actionMessage = `${player.name} ${isAllIn ? 'went all-in with' : 'bet'} $${actualBet}`;
      setMessage(actionMessage);
      // Record action (not during replay)
      if (!isReplaying) {
        setRoundHistory(prev => [...prev, { action, playerIndex: currentPlayer, amount: actualBet, message: actionMessage, playersAfter: newPlayers.map(p => ({...p})), potAfter: newPot }]);
      }
      advanceToNextPlayer(newPlayers, newPot, currentPlayer, actualBet);
      return;
    } else if (action === 'call') {
      const actualCall = Math.min(toCall, player.chips);
      const isAllIn = actualCall >= player.chips;
      newPlayers = newPlayers.map((p, i) => updatePlayer(p, i, actualCall, p.currentBet + actualCall));
      newPot = pot + actualCall;
      actionMessage = `${player.name} ${isAllIn ? 'went all-in with' : 'called'} $${actualCall}`;
      setMessage(actionMessage);
    } else if (action === 'raise') {
      const maxRaise = player.chips - toCall;
      const actualRaise = Math.min(amount, maxRaise);
      if (actualRaise <= 0) {
        const actualCall = Math.min(toCall, player.chips);
        newPlayers = newPlayers.map((p, i) => updatePlayer(p, i, actualCall, p.currentBet + actualCall));
        newPot = pot + actualCall;
        actionMessage = `${player.name} went all-in with $${actualCall}`;
        setMessage(actionMessage);
        if (!isReplaying) {
          setRoundHistory(prev => [...prev, { action: 'call', playerIndex: currentPlayer, amount: actualCall, message: actionMessage, playersAfter: newPlayers.map(p => ({...p})), potAfter: newPot }]);
        }
        advanceToNextPlayer(newPlayers, newPot);
        return;
      }
      const totalCost = toCall + actualRaise;
      const newBetAmount = currentBetAmount + actualRaise;
      const isAllIn = totalCost >= player.chips;
      newPlayers = newPlayers.map((p, i) => updatePlayer(p, i, totalCost, newBetAmount));
      newPot = pot + totalCost;
      setCurrentBetAmount(newBetAmount);
      setLastRaiser(currentPlayer);
      if (player.aiLevel) {
        setAiRaiseCount(prev => ({ ...prev, [currentPlayer]: (prev[currentPlayer] || 0) + 1 }));
      }
      actionMessage = `${player.name} ${isAllIn ? 'went all-in, raising to' : 'raised to'} $${newBetAmount}`;
      setMessage(actionMessage);
      if (!isReplaying) {
        setRoundHistory(prev => [...prev, { action, playerIndex: currentPlayer, amount: actualRaise, message: actionMessage, playersAfter: newPlayers.map(p => ({...p})), potAfter: newPot }]);
      }
      advanceToNextPlayer(newPlayers, newPot, currentPlayer, newBetAmount);
      return;
    } else if (action === 'check') {
      actionMessage = `${player.name} checked`;
      setMessage(actionMessage);
    } else if (action === 'fold') {
      newPlayers = newPlayers.map((p, i) =>
        i === currentPlayer ? { ...p, folded: true } : p
      );
      actionMessage = `${player.name} folded`;
      setMessage(actionMessage);
    }

    // Record action (not during replay)
    if (!isReplaying && actionMessage) {
      setRoundHistory(prev => [...prev, { action, playerIndex: currentPlayer, amount, message: actionMessage, playersAfter: newPlayers.map(p => ({...p})), potAfter: newPot }]);
    }

    advanceToNextPlayer(newPlayers, newPot);
  };

  const handleNextRound = () => {
    // Check for game over (only 1 player with chips left)
    const playersWithChips = players.filter(p => !p.eliminated && p.chips > 0);
    if (playersWithChips.length <= 1) {
      // Game over - go back to menu
      setGameState('menu');
      setSeatedPlayers([null, null, null, null]);
      setLocalPlayerSeat(null);
      setLocalPlayerName('');
      setPlayers([
        { name: 'Player 1', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
        { name: 'Player 2', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
        { name: 'Player 3', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
        { name: 'Player 4', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
      ]);
      setPot(0);
      setRolloverPot(0);
      setWinner(null);
      return;
    }

    // Find next non-eliminated dealer
    let nextDealer = (dealer + 1) % 4;
    let attempts = 0;
    while ((players[nextDealer].eliminated || players[nextDealer].chips <= 0) && attempts < 4) {
      nextDealer = (nextDealer + 1) % 4;
      attempts++;
    }

    // Deal new round directly
    const newDeck = createDeck();
    const communal = newDeck.pop()!;

    const order: number[] = [];
    for (let j = 1; j <= 4; j++) {
      order.push((nextDealer + j) % 4);
    }
    setRevealOrder(order);

    const newPlayers = players.map((p, i) => {
      const canPlay = p.chips >= 1 && !p.eliminated && p.chips > 0;
      const isEliminated = p.eliminated || p.chips <= 0;
      return {
        ...p,
        // Deal cards to ALL players including eliminated - their cards still count in the hand
        card: newDeck.pop()!,
        revealed: false,
        folded: !canPlay,
        eliminated: isEliminated,
        peekedCards: [] as CardType[],
        currentBet: 0,
        totalRoundBet: canPlay ? 1 : 0,
        allIn: false,
        chips: canPlay ? p.chips - 1 : p.chips, // ante (eliminated don't pay)
        aiLevel: isPlayerAI[i] ? (['cautious', 'random', 'aggressive'][Math.floor(Math.random() * 3)] as AISkillLevel) : p.aiLevel,
      };
    });

    const playingCount = newPlayers.filter(p => !p.eliminated && !p.folded).length;
    let firstToAct = (nextDealer + 1) % 4;
    let findAttempts = 0;
    while ((newPlayers[firstToAct].eliminated || newPlayers[firstToAct].folded) && findAttempts < 4) {
      firstToAct = (firstToAct + 1) % 4;
      findAttempts++;
    }

    const initialPot = playingCount + rolloverPot;

    setDealer(nextDealer);
    setCommunalCard(communal);
    setPlayers(newPlayers);
    setPot(initialPot);
    setSidePots([]);
    setAiRaiseCount({});
    setCurrentPlayer(firstToAct);
    setCurrentBetAmount(0);
    setRevealPhase(0);
    setMessage(`${playerNames[nextDealer]} is dealer. Communal: ${communal.rank}${communal.suit}${rolloverPot > 0 ? ` (+$${rolloverPot} rollover!)` : ''}`);
    setRolloverPot(0);
    setShowPassScreen(true);
    setGameState('passing');
    setWinner(null);
    setIsRollover(false);
    setLastRaiser(-1);
    setBettingRoundStarter(firstToAct);
    setIsReplaying(false);
    setReplayIndex(0);
    setRoundHistory([]);
    setRoundStartState({
      players: newPlayers.map(p => ({ ...p })),
      pot: initialPot,
      currentPlayer: firstToAct,
      communalCard: communal,
      revealOrder: order,
    });
  };

  // Handle "Replay Last Round" - step through recorded history
  const handleReplayLastRound = () => {
    if (!roundStartState || roundHistory.length === 0) return;

    // Restore the initial round state
    setPlayers(roundStartState.players.map(p => ({ ...p })));
    setPot(roundStartState.pot);
    setCurrentPlayer(roundStartState.currentPlayer);
    setCommunalCard(roundStartState.communalCard);
    setRevealOrder(roundStartState.revealOrder);
    setMessage('Replaying round...');

    // Clear winner and start replaying
    setWinner(null);
    setIsReplaying(true);
    setReplayIndex(0);
    setGameState('playing');
  };

  // Advance to next step in replay
  const advanceReplay = () => {
    if (replayIndex >= roundHistory.length) {
      // Replay finished - show winner
      setIsReplaying(false);
      const lastEntry = roundHistory[roundHistory.length - 1];
      endRound(lastEntry.potAfter, lastEntry.playersAfter);
      return;
    }

    const entry = roundHistory[replayIndex];
    setPlayers(entry.playersAfter.map(p => ({ ...p })));
    setPot(entry.potAfter);
    setCurrentPlayer(entry.playerIndex);
    setMessage(entry.message);
    setReplayIndex(prev => prev + 1);
  };

  // Cancel replay - jump to end
  const handleCancelReplay = () => {
    if (roundHistory.length === 0) {
      setIsReplaying(false);
      return;
    }
    const lastEntry = roundHistory[roundHistory.length - 1];
    setIsReplaying(false);
    endRound(lastEntry.potAfter, lastEntry.playersAfter);
  };

  const currentPlayerData = players[currentPlayer];
  const toCall = currentBetAmount - (currentPlayerData?.currentBet || 0);
  const canCheck = currentBetAmount === 0;
  const canBet = currentBetAmount === 0;
  const canCall = toCall > 0;
  const canRaise = currentBetAmount > 0;

  const getHighlightInfo = () => {
    if (!communalCard) return { boardHighest: false, highestValue: 0 };
    const activePlayers = getActivePlayers();
    const revealedValues = activePlayers.filter(p => p.revealed).map(p => p.card!.value);
    const currentCard = currentPlayerData?.card?.value || 0;
    const allValues = [communalCard.value, ...revealedValues, currentCard];
    const highestValue = Math.max(...allValues);
    return {
      boardHighest: communalCard.value === highestValue,
      highestValue
    };
  };

  const { boardHighest } = getHighlightInfo();

  // Turn timer effect
  useEffect(() => {
    if (!turnTimerActive) return;
    if (gameState !== 'playing') return;
    if (currentPlayerData?.aiLevel) return; // AI doesn't use timer
    if (winner) return;

    const interval = setInterval(() => {
      setTurnTimeRemaining(prev => {
        if (prev <= 0.1) {
          // Time's up - auto-fold
          clearInterval(interval);
          setTurnTimerActive(false);
          handleAction('fold');
          return TURN_TIME_LIMIT;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [turnTimerActive, gameState, currentPlayerData?.aiLevel, winner]);

  // Start turn timer when it's a human's turn
  useEffect(() => {
    if (gameState === 'playing' && !showPassScreen && currentPlayerData && !currentPlayerData.aiLevel && !winner) {
      setTurnTimeRemaining(TURN_TIME_LIMIT);
      setTurnTimerActive(true);
    } else {
      setTurnTimerActive(false);
    }
  }, [gameState, currentPlayer, showPassScreen, winner]);

  // AI auto-play effect
  useEffect(() => {
    if (!autoAI) return;
    if (gameState !== 'playing' && gameState !== 'passing') return;
    if (!currentPlayerData?.aiLevel) return;
    if (winner) return;

    // Base timings (ms) multiplied by aiSpeed
    const passDelay = 1200 * aiSpeed;
    const thinkDelay = 1000 * aiSpeed;
    const executeDelay = 1500 * aiSpeed;

    // Auto-skip pass screen for AI
    if (showPassScreen && gameState === 'passing') {
      const timer = setTimeout(() => {
        handleReady();
      }, passDelay);
      return () => clearTimeout(timer);
    }

    // Make AI decision when it's their turn to play
    if (gameState === 'playing' && !showPassScreen) {
      if (!aiPendingAction) {
        // First, compute and show the decision
        const timer = setTimeout(() => {
          const decision = makeAIDecision(currentPlayerData, currentPlayer);
          setAiPendingAction(decision);
        }, thinkDelay);
        return () => clearTimeout(timer);
      } else {
        // Then execute it after showing the highlight
        const timer = setTimeout(() => {
          handleAction(aiPendingAction.action, aiPendingAction.amount || 0);
          setAiPendingAction(null);
        }, executeDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, currentPlayer, showPassScreen, currentPlayerData?.aiLevel, winner, aiPendingAction, autoAI, aiSpeed]);

  // Clear pending action when player changes
  useEffect(() => {
    setAiPendingAction(null);
  }, [currentPlayer]);

  // Sync refs with state for use in closures
  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  // Auto-reload chips when human player goes broke (once per round)
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'passing') return;
    if (reloadedThisRoundRef.current) return; // Already reloaded this round

    const humanPlayerIndex = localPlayerSeat !== null ? localPlayerSeat : 0;
    const humanPlayer = players[humanPlayerIndex];
    if (humanPlayer && humanPlayer.chips <= 0 && !humanPlayer.eliminated && !humanPlayer.allIn) {
      reloadedThisRoundRef.current = true;
      // Auto-reload their chips
      const newPlayers = players.map((p, i) =>
        i === humanPlayerIndex ? { ...p, chips: 50 } : p
      );
      setPlayers(newPlayers);
      setReloadNotification(true);
      // Auto-hide notification after 3 seconds
      setTimeout(() => setReloadNotification(false), 3000);
    }
  }, [players, gameState, localPlayerSeat]);

  // Reset reload flag when round ends
  useEffect(() => {
    if (gameState === 'winner' || gameState === 'menu' || gameState === 'lobby') {
      reloadedThisRoundRef.current = false;
    }
  }, [gameState]);

  // Auto-advance replay at current AI speed
  useEffect(() => {
    if (!isReplaying || replayIndex >= roundHistory.length) return;

    const delay = 1000 * aiSpeed; // Use AI speed setting
    const timer = setTimeout(() => {
      advanceReplay();
    }, delay);

    return () => clearTimeout(timer);
  }, [isReplaying, replayIndex, aiSpeed, roundHistory.length]);

  // Lobby AI - pre-seat some AI players and have them come/go while waiting
  useEffect(() => {
    if (gameState !== 'lobby') return;
    if (localPlayerSeat !== null) return; // Stop when player sits down

    // On entering lobby, randomly seat 0-3 AI players
    const initialAICount = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
    if (initialAICount > 0) {
      const availableSeats = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const seatsToFill = availableSeats.slice(0, initialAICount);
      const usedNames: string[] = [];

      setSeatedPlayers(() => {
        const newSeats: (string | null)[] = [null, null, null, null];
        seatsToFill.forEach(seat => {
          const availableNames = AI_NAMES.filter(n => !usedNames.includes(n));
          const name = availableNames[Math.floor(Math.random() * availableNames.length)];
          usedNames.push(name);
          newSeats[seat] = name;
        });
        return newSeats;
      });
    }

    // Set up recursive timeout for AI coming and going with variable delays
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextChange = () => {
      const delay = 3000 + Math.random() * 4000; // 3-7 seconds
      timeoutId = setTimeout(() => {
        setSeatedPlayers(prev => {
          const currentSeated = prev.filter(p => p !== null) as string[];
          const emptySeats = prev.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
          const occupiedSeats = prev.map((p, i) => p !== null ? i : -1).filter(i => i !== -1);

          // Random action: 0 = someone leaves, 1 = someone joins, 2 = swap
          const action = Math.floor(Math.random() * 3);

          if (action === 0 && occupiedSeats.length > 0) {
            // Someone leaves
            const leavingSeat = occupiedSeats[Math.floor(Math.random() * occupiedSeats.length)];
            const newSeats = [...prev];
            newSeats[leavingSeat] = null;
            return newSeats;
          } else if (action === 1 && emptySeats.length > 0) {
            // Someone joins
            const joiningSeat = emptySeats[Math.floor(Math.random() * emptySeats.length)];
            const availableNames = AI_NAMES.filter(n => !currentSeated.includes(n));
            if (availableNames.length === 0) return prev;
            const newName = availableNames[Math.floor(Math.random() * availableNames.length)];
            const newSeats = [...prev];
            newSeats[joiningSeat] = newName;
            return newSeats;
          } else if (action === 2 && occupiedSeats.length > 0) {
            // Someone leaves and different person joins same seat
            const swapSeat = occupiedSeats[Math.floor(Math.random() * occupiedSeats.length)];
            const usedNames = currentSeated.filter(n => n !== prev[swapSeat]);
            const availableNames = AI_NAMES.filter(n => !usedNames.includes(n));
            if (availableNames.length === 0) return prev;
            const newName = availableNames[Math.floor(Math.random() * availableNames.length)];
            const newSeats = [...prev];
            newSeats[swapSeat] = newName;
            return newSeats;
          }

          return prev;
        });

        scheduleNextChange(); // Schedule next change
      }, delay);
    };

    scheduleNextChange();

    return () => clearTimeout(timeoutId);
  }, [gameState, localPlayerSeat]);

  return (
    <div className="h-dvh bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 text-white p-2 font-sans overflow-hidden flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+Pro:wght@400;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'Source Sans Pro', sans-serif; }
      `}</style>

      {/* MENU SCREEN */}
      {gameState === 'menu' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-6xl sm:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 drop-shadow-lg mb-4">
              KICKER
            </h1>
            <p className="text-gray-400 text-lg mb-6">A Game of Cards & Bluffs</p>

            <div className="mb-6 w-full max-w-xs mx-auto">
              <input
                type="text"
                value={localPlayerName}
                onChange={(e) => setLocalPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white text-center text-lg focus:border-amber-400 focus:outline-none"
                maxLength={12}
              />
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setGameState('lobby')}
                disabled={!localPlayerName.trim()}
                className={`px-12 py-4 rounded-xl font-bold text-xl shadow-lg transition-all transform ${
                  localPlayerName.trim()
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 hover:scale-105'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Play
              </button>

              <button
                onClick={() => setGameState('setup')}
                className="px-12 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl font-bold text-xl shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all transform hover:scale-105"
              >
                Pass & Play
              </button>
            </div>

            <div className="mt-8 text-gray-500 text-sm">
              <p>4 players • 1 card each • Best kicker wins</p>
            </div>
          </div>
        </div>
      )}

      {/* PASS & PLAY SETUP SCREEN */}
      {gameState === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="font-display text-2xl text-amber-400 mb-2">Pass & Play</h2>
          <p className="text-gray-400 text-sm mb-6">Enter player names (2-4 players)</p>

          <div className="w-full max-w-xs space-y-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
                <input
                  type="text"
                  value={setupNames[i]}
                  onChange={(e) => {
                    const value = e.target.value;
                    const newNames = [...setupNames];
                    const newIsAI = [...setupIsAI];

                    // Detect "ai" typed (case insensitive)
                    if (value.toLowerCase() === 'ai') {
                      // Pick a random AI name not already used
                      const usedNames = newNames.filter((n, idx) => idx !== i && n.trim());
                      const availableNames = AI_NAMES.filter(n => !usedNames.includes(n));
                      const aiName = availableNames[Math.floor(Math.random() * availableNames.length)] || `Bot ${i + 1}`;
                      newNames[i] = aiName;
                      newIsAI[i] = true;
                    } else {
                      newNames[i] = value;
                      // Clear AI status if they edit the name
                      if (newIsAI[i] && value !== setupNames[i]) {
                        newIsAI[i] = false;
                      }
                    }

                    setSetupNames(newNames);
                    setSetupIsAI(newIsAI);
                  }}
                  placeholder={`Player ${i + 1}`}
                  className={`flex-1 px-3 py-2 bg-gray-800 border-2 rounded-lg text-white text-sm focus:outline-none ${
                    setupIsAI[i]
                      ? 'border-cyan-500 focus:border-cyan-400'
                      : 'border-gray-600 focus:border-amber-400'
                  }`}
                  maxLength={12}
                />
                {setupIsAI[i] && (
                  <span className="text-cyan-400 text-xs">AI</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSetupNames(['', '', '', '']);
                setSetupIsAI([false, false, false, false]);
                setGameState('menu');
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => {
                // Process names - use setupIsAI to determine AI players
                const processedNames: { name: string; isAI: boolean }[] = [];

                setupNames.forEach((n, i) => {
                  const trimmed = n.trim();
                  if (!trimmed && i >= 2) return; // Skip empty optional slots

                  if (trimmed) {
                    processedNames.push({ name: trimmed, isAI: setupIsAI[i] });
                  } else {
                    // Required slot with no name
                    const defaultName = `Player ${i + 1}`;
                    processedNames.push({ name: defaultName, isAI: false });
                  }
                });

                if (processedNames.length < 2) return;

                // Pad to 4 players with empty slots that will be marked as eliminated
                const finalNames = processedNames.map(p => p.name);
                const finalIsAI = processedNames.map(p => p.isAI);
                while (finalNames.length < 4) {
                  finalNames.push(`Seat ${finalNames.length + 1}`);
                  finalIsAI.push(false);
                }

                setPlayerNames(finalNames);
                setIsPlayerAI(finalIsAI);
                setSetupNames(['', '', '', '']);
                setSetupIsAI([false, false, false, false]);

                // Initialize players
                const newDeck = createDeck();
                const communal = newDeck.pop()!;
                const newDealer = Math.floor(Math.random() * processedNames.length); // Only among active players

                // Create reveal order starting from dealer+1
                const order: number[] = [];
                for (let i = 1; i <= 4; i++) {
                  order.push((newDealer + i) % 4);
                }

                const newPlayers = finalNames.map((name, i) => {
                  const isActive = i < processedNames.length;
                  return {
                    name,
                    chips: isActive ? 50 : 0,
                    card: newDeck.pop()!,
                    revealed: false,
                    folded: !isActive,
                    eliminated: !isActive,
                    peekedCards: [] as CardType[],
                    currentBet: 0,
                    totalRoundBet: isActive ? 1 : 0,
                    allIn: false,
                    aiLevel: (isActive && finalIsAI[i]) ? (['cautious', 'random', 'aggressive'][Math.floor(Math.random() * 3)] as AISkillLevel) : undefined,
                  };
                });

                // Deduct ante from active players
                newPlayers.forEach((p, i) => {
                  if (i < processedNames.length) {
                    p.chips = 49; // 50 - 1 ante
                  }
                });

                let firstToAct = (newDealer + 1) % 4;
                while (newPlayers[firstToAct].eliminated && firstToAct !== newDealer) {
                  firstToAct = (firstToAct + 1) % 4;
                }

                setCommunalCard(communal);
                setPlayers(newPlayers);
                setPot(processedNames.length); // 1 ante per active player
                setCurrentPlayer(firstToAct);
                setCurrentBetAmount(0);
                setDealer(newDealer);
                setRevealOrder(order);
                setRevealPhase(0);
                setMessage(`${finalNames[newDealer]} is dealer. Communal: ${communal.rank}${communal.suit}`);
                setShowPassScreen(true);
                setGameState('passing');
                setWinner(null);
                setIsRollover(false);
                setLastRaiser(-1);
                setBettingRoundStarter(firstToAct);
                setLocalPlayerSeat(null); // No single local player in pass & play
                setSetupNames(['', '', '', '']);
                setRoundHistory([]);
                setRoundStartState({
                  players: newPlayers.map(p => ({ ...p })),
                  pot: processedNames.length,
                  currentPlayer: firstToAct,
                  communalCard: communal,
                  revealOrder: order,
                });
              }}
              disabled={setupNames.filter(n => n.trim()).length < 2}
              className={`px-8 py-3 rounded-lg font-bold transition-all ${
                setupNames.filter(n => n.trim()).length >= 2
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* LOBBY / TABLE SCREEN */}
      {gameState === 'lobby' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="font-display text-2xl text-amber-400 mb-2">Join the Table</h2>
          <p className="text-gray-400 text-sm mb-4">Pick a seat, {localPlayerName}</p>

          {/* Table visualization */}
          <div className="relative w-72 h-48 mb-6">
            {/* Table */}
            <div className="absolute inset-4 bg-emerald-800 rounded-[50%] border-8 border-amber-900 shadow-2xl" />

            {/* Seats */}
            {[0, 1, 2, 3].map((seatIndex) => {
              const positions = [
                { top: '75%', left: '50%', transform: 'translate(-50%, -50%)' }, // Bottom
                { top: '50%', left: '5%', transform: 'translate(-50%, -50%)' },  // Left
                { top: '15%', left: '50%', transform: 'translate(-50%, -50%)' }, // Top
                { top: '50%', left: '95%', transform: 'translate(-50%, -50%)' }, // Right
              ];
              const pos = positions[seatIndex];
              const seated = seatedPlayers[seatIndex];
              const isLocalSeat = localPlayerSeat === seatIndex;

              return (
                <div
                  key={seatIndex}
                  style={pos}
                  className="absolute"
                >
                  {seated ? (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold ${isLocalSeat ? 'bg-amber-500 text-gray-900' : 'bg-blue-600 text-white'}`}>
                      {seated.slice(0, 6)}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (localPlayerSeat !== null) return; // Already seated
                        const name = localPlayerName.trim() || 'Player';

                        setSeatedPlayers(prev => {
                          const newSeats = [...prev];
                          newSeats[seatIndex] = name;
                          return newSeats;
                        });
                        setLocalPlayerSeat(seatIndex);

                        // Auto-fill other seats with AI one by one with staggered delays
                        const emptySeats = [0, 1, 2, 3].filter(i => i !== seatIndex);
                        // Shuffle the order AI players join
                        emptySeats.sort(() => Math.random() - 0.5);

                        // Generate random delays that total under 15 seconds
                        // First player joins after 1-3 seconds, others follow with 2-5 second gaps
                        let cumulativeDelay = 1000 + Math.random() * 2000; // 1-3 seconds for first
                        const usedNamesTracker: string[] = [name];

                        emptySeats.forEach((emptySeatIndex, idx) => {
                          const delay = cumulativeDelay;
                          setTimeout(() => {
                            setSeatedPlayers(prev => {
                              const newSeats = [...prev];
                              // Get currently used names
                              const currentUsedNames = newSeats.filter(n => n !== null) as string[];
                              const availableNames = AI_NAMES.filter(n => !currentUsedNames.includes(n) && !usedNamesTracker.includes(n));
                              const aiName = availableNames[Math.floor(Math.random() * availableNames.length)] || `Player ${emptySeatIndex + 1}`;
                              usedNamesTracker.push(aiName);
                              newSeats[emptySeatIndex] = aiName;
                              return newSeats;
                            });
                          }, delay);

                          // Add 2-5 seconds for next player (but keep total under 15s)
                          const maxRemaining = 14000 - cumulativeDelay;
                          const remainingPlayers = emptySeats.length - idx - 1;
                          const maxGap = remainingPlayers > 0 ? Math.min(5000, maxRemaining / remainingPlayers) : 0;
                          cumulativeDelay += 2000 + Math.random() * Math.max(0, maxGap - 2000);
                        });
                      }}
                      disabled={localPlayerSeat !== null}
                      className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center text-xs transition-all ${
                        localPlayerSeat !== null
                          ? 'border-gray-600 text-gray-600 cursor-not-allowed'
                          : 'border-emerald-400 text-emerald-400 hover:bg-emerald-400/20 cursor-pointer'
                      }`}
                    >
                      Sit
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Start game button - only show when all seats filled */}
          {seatedPlayers.every(s => s !== null) && (
            <button
              onClick={() => {
                // Set up the game with seated players
                const names = seatedPlayers as string[];
                const isAI = names.map((_, i) => i !== localPlayerSeat);
                setPlayerNames(names);
                setIsPlayerAI(isAI);
                const newDealer = Math.floor(Math.random() * 4);
                setDealer(newDealer);

                // Initialize players and deal cards directly
                const newDeck = createDeck();
                const communal = newDeck.pop()!;

                const order: number[] = [];
                for (let j = 1; j <= 4; j++) {
                  order.push((newDealer + j) % 4);
                }
                setRevealOrder(order);

                const newPlayers = names.map((name, i) => ({
                  name,
                  chips: 50 - 1, // minus ante
                  card: newDeck.pop()!,
                  revealed: false,
                  folded: false,
                  eliminated: false,
                  peekedCards: [] as CardType[],
                  currentBet: 0,
                  totalRoundBet: 1, // ante
                  allIn: false,
                  aiLevel: isAI[i] ? (['cautious', 'random', 'aggressive'][Math.floor(Math.random() * 3)] as AISkillLevel) : undefined,
                }));

                // Find first player after dealer
                let firstToAct = (newDealer + 1) % 4;

                setCommunalCard(communal);
                setPlayers(newPlayers);
                setPot(4 + rolloverPot); // 4 antes
                setSidePots([]);
                setAiRaiseCount({});
                setCurrentPlayer(firstToAct);
                setCurrentBetAmount(0);
                setRevealPhase(0);
                setMessage(`${names[newDealer]} is dealer. Communal: ${communal.rank}${communal.suit}${rolloverPot > 0 ? ` (+$${rolloverPot} rollover!)` : ''}`);
                setRolloverPot(0);
                setShowPassScreen(true);
                setGameState('passing');
                setWinner(null);
                setIsRollover(false);
                setLastRaiser(-1);
                setBettingRoundStarter(firstToAct);
                setIsReplaying(false);
                setReplayIndex(0);
                setRoundHistory([]);
                setRoundStartState({
                  players: newPlayers.map(p => ({ ...p })),
                  pot: 4 + rolloverPot,
                  currentPlayer: firstToAct,
                  communalCard: communal,
                  revealOrder: order,
                });
              }}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 rounded-xl font-bold text-lg shadow-lg hover:from-amber-400 hover:to-yellow-300 transition-all animate-pulse"
            >
              Start Game
            </button>
          )}

          {localPlayerSeat !== null && !seatedPlayers.every(s => s !== null) && (
            <p className="text-gray-400 text-sm animate-pulse">Waiting for players...</p>
          )}

          <button
            onClick={() => {
              setGameState('menu');
              setSeatedPlayers([null, null, null, null]);
              setLocalPlayerSeat(null);
              setLocalPlayerName('');
            }}
            className="mt-6 text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Back to Menu
          </button>
        </div>
      )}

      {showPassScreen && (gameState === 'passing' || gameState === 'playing') && (
        players[currentPlayer]?.aiLevel ? (
          // Other player's turn - auto-advance
          <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
            <div className="text-center p-4">
              {isReplaying && (
                <div className="text-amber-300 text-xs mb-2 px-3 py-1 bg-amber-900/60 rounded-full inline-block">
                  Replaying round...
                </div>
              )}
              <h2 className="font-display text-2xl text-amber-400 mb-4">{players[currentPlayer].name}'s Turn</h2>
              <div className="text-gray-400 animate-pulse text-sm">Waiting...</div>
              {isReplaying && (
                <button
                  onClick={handleCancelReplay}
                  className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  Stop Replay
                </button>
              )}
            </div>
          </div>
        ) : (
          <PassScreen playerName={players[currentPlayer].name} onReady={handleReady} />
        )
      )}

      {winner && (
        <WinnerScreen
          winner={winner}
          pot={pot}
          players={players}
          boardCard={communalCard}
          onNextRound={handleNextRound}
          rollover={isRollover}
          onReplay={roundStartState ? handleReplayLastRound : undefined}
          playerBroke={false}
          onReloadFunds={() => {
            // Reset player state but keep name, go to lobby
            setSeatedPlayers([null, null, null, null]);
            setLocalPlayerSeat(null);
            setPlayers([
              { name: 'Player 1', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
              { name: 'Player 2', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
              { name: 'Player 3', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
              { name: 'Player 4', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
            ]);
            setPot(0);
            setRolloverPot(0);
            setWinner(null);
            setGameState('lobby');
          }}
          onNewGame={() => {
            setGameState('menu');
            setSeatedPlayers([null, null, null, null]);
            setLocalPlayerSeat(null);
            setLocalPlayerName('');
            setPlayers([
              { name: 'Player 1', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
              { name: 'Player 2', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
              { name: 'Player 3', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
              { name: 'Player 4', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0, totalRoundBet: 0, allIn: false },
            ]);
            setPot(0);
            setRolloverPot(0);
            setWinner(null);
          }}
        />
      )}

      <div className="max-w-md mx-auto flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-center mb-1 flex-shrink-0">
          <h1 className="font-display text-xl bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
            KICKER
          </h1>
        </div>

        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Replaying Banner */}
            {isReplaying && (
              <div className="flex justify-between items-center mb-2 px-4 py-2 bg-cyan-900/60 rounded-lg border border-cyan-500 flex-shrink-0">
                <div className="text-cyan-300 text-sm font-medium">Replaying round...</div>
                <button
                  onClick={handleCancelReplay}
                  className="px-4 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  Stop Replay
                </button>
              </div>
            )}

            {/* Funds Reloaded Notification */}
            {reloadNotification && (
              <div className="mb-2 px-4 py-3 bg-emerald-900/80 rounded-lg border border-emerald-500 flex-shrink-0 text-center animate-pulse">
                <div className="text-emerald-300 font-bold">Funds Reloaded! +$50</div>
              </div>
            )}

            {/* Game Info */}
            <div className="flex justify-between items-center mb-2 px-4 py-2 bg-gray-900/80 rounded-lg border border-emerald-800 flex-shrink-0">
              <div className="text-center">
                <div className="text-xs text-gray-400">Pot</div>
                <div className="text-xl font-bold text-amber-400">${pot}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Bet</div>
                <div className="text-xl font-bold text-red-400">${currentBetAmount}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Call</div>
                <div className="text-xl font-bold text-blue-400">${toCall}</div>
              </div>
            </div>

            <div className="text-center mb-2 text-xs text-gray-300 flex-shrink-0">{message}</div>

            {/* Current Player Actions */}
            <div className="p-2 bg-amber-900/40 rounded-lg border border-amber-400 mb-2 flex-shrink-0">
              <div className="text-center mb-1">
                <span className="text-amber-400 font-bold">{currentPlayerData.name}'s Turn</span>
                {currentPlayerData.currentBet > 0 && (
                  <span className="text-gray-400 ml-1 text-xs">(${currentPlayerData.currentBet})</span>
                )}
                {/* Turn Timer */}
                {turnTimerActive && !currentPlayerData.aiLevel && (
                  <div className="mt-1">
                    <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-100 ${turnTimeRemaining < 5 ? 'bg-red-500' : 'bg-amber-400'}`}
                        style={{ width: `${(turnTimeRemaining / TURN_TIME_LIMIT) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${turnTimeRemaining < 5 ? 'text-red-400' : 'text-gray-400'}`}>
                      {Math.ceil(turnTimeRemaining)}s
                    </span>
                  </div>
                )}
              </div>

              {/* Other Player's Turn Display - Show buttons with animation on selection */}
              {currentPlayerData.aiLevel && (
                <div className="space-y-1.5">
                  {/* Thinking indicator when no action selected yet */}
                  {!aiPendingAction && (
                    <div className="text-gray-400 text-xs text-center animate-pulse mb-1">Thinking...</div>
                  )}

                  {/* Bet buttons (when no current bet) */}
                  {canBet && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map(amount => {
                        const isSelected = aiPendingAction?.action === 'bet' && aiPendingAction?.amount === amount;
                        return (
                          <div
                            key={amount}
                            className={`px-2 py-2 rounded-lg text-sm font-bold text-center transition-all duration-300 ${
                              isSelected
                                ? 'bg-green-400 text-green-900 scale-110 ring-2 ring-green-300 shadow-lg shadow-green-500/50'
                                : aiPendingAction ? 'bg-green-900/30 text-green-700' : 'bg-green-600/50 text-green-200'
                            }`}
                          >
                            Bet ${amount}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Call button */}
                  {canCall && (
                    <div
                      className={`w-full px-2 py-2 rounded-lg text-sm font-bold text-center transition-all duration-300 ${
                        aiPendingAction?.action === 'call'
                          ? 'bg-blue-400 text-blue-900 scale-105 ring-2 ring-blue-300 shadow-lg shadow-blue-500/50'
                          : aiPendingAction ? 'bg-blue-900/30 text-blue-700' : 'bg-blue-600/50 text-blue-200'
                      }`}
                    >
                      Call ${toCall}
                    </div>
                  )}

                  {/* Raise buttons */}
                  {canRaise && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map(amount => {
                        const isSelected = aiPendingAction?.action === 'raise' && aiPendingAction?.amount === amount;
                        return (
                          <div
                            key={amount}
                            className={`px-2 py-2 rounded-lg text-sm font-bold text-center transition-all duration-300 ${
                              isSelected
                                ? 'bg-orange-400 text-orange-900 scale-110 ring-2 ring-orange-300 shadow-lg shadow-orange-500/50'
                                : aiPendingAction ? 'bg-orange-900/30 text-orange-700' : 'bg-orange-600/50 text-orange-200'
                            }`}
                          >
                            +${amount}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bottom row: Check, Fold */}
                  <div className={`grid ${canCheck ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                    {canCheck && (
                      <div
                        className={`px-2 py-2 rounded-lg text-sm font-bold text-center transition-all duration-300 ${
                          aiPendingAction?.action === 'check'
                            ? 'bg-gray-300 text-gray-800 scale-110 ring-2 ring-gray-200 shadow-lg shadow-gray-400/50'
                            : aiPendingAction ? 'bg-gray-800/30 text-gray-600' : 'bg-gray-600/50 text-gray-300'
                        }`}
                      >
                        Check
                      </div>
                    )}
                    <div
                      className={`px-2 py-2 rounded-lg text-sm font-bold text-center transition-all duration-300 ${
                        aiPendingAction?.action === 'fold'
                          ? 'bg-red-400 text-red-900 scale-110 ring-2 ring-red-300 shadow-lg shadow-red-500/50'
                          : aiPendingAction ? 'bg-red-900/30 text-red-700' : 'bg-red-600/50 text-red-200'
                      }`}
                    >
                      Fold
                    </div>
                  </div>
                </div>
              )}

              {/* Human Player Controls */}
              {!currentPlayerData.aiLevel && (
                <>
                  {/* Actions */}
                  <div className="space-y-1.5">
                {canBet && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleAction('bet', 1)}
                      disabled={currentPlayerData.chips < 1}
                      className={`px-2 py-2 rounded-lg text-sm font-bold transition-colors ${currentPlayerData.chips >= 1 ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
                    >
                      Bet $1
                    </button>
                    <button
                      onClick={() => handleAction('bet', 2)}
                      disabled={currentPlayerData.chips < 2}
                      className={`px-2 py-2 rounded-lg text-sm font-bold transition-colors ${currentPlayerData.chips >= 2 ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
                    >
                      Bet $2
                    </button>
                    <button
                      onClick={() => handleAction('bet', 3)}
                      disabled={currentPlayerData.chips < 3}
                      className={`px-2 py-2 rounded-lg text-sm font-bold transition-colors ${currentPlayerData.chips >= 3 ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
                    >
                      Bet $3
                    </button>
                  </div>
                )}

                {canCall && currentPlayerData.chips > 0 && (
                  <button
                    onClick={() => handleAction('call')}
                    className="w-full px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors"
                  >
                    {currentPlayerData.chips >= toCall ? `Call $${toCall}` : `All-in $${currentPlayerData.chips}`}
                  </button>
                )}

                {canRaise && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleAction('raise', 1)}
                      disabled={currentPlayerData.chips < toCall + 1}
                      className={`px-2 py-2 rounded-lg text-sm font-bold transition-colors ${currentPlayerData.chips >= toCall + 1 ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
                    >
                      +$1
                    </button>
                    <button
                      onClick={() => handleAction('raise', 2)}
                      disabled={currentPlayerData.chips < toCall + 2}
                      className={`px-2 py-2 rounded-lg text-sm font-bold transition-colors ${currentPlayerData.chips >= toCall + 2 ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
                    >
                      +$2
                    </button>
                    <button
                      onClick={() => handleAction('raise', 3)}
                      disabled={currentPlayerData.chips < toCall + 3}
                      className={`px-2 py-2 rounded-lg text-sm font-bold transition-colors ${currentPlayerData.chips >= toCall + 3 ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-600 opacity-50 cursor-not-allowed'}`}
                    >
                      +$3
                    </button>
                  </div>
                )}

                <div className={`grid ${canCheck ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                  {canCheck && (
                    <button
                      onClick={() => handleAction('check')}
                      className="px-2 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-bold transition-colors"
                    >
                      Check
                    </button>
                  )}
                  <button
                    onClick={() => handleAction('fold')}
                    className="px-2 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold transition-colors"
                  >
                    Fold
                  </button>
                  </div>
                </div>
              </>
              )}
            </div>

            {/* Your Card (for human players only - hide AI cards) */}
            {!currentPlayerData.aiLevel && (
              <div className="p-2 bg-amber-900/30 rounded-lg mb-2 flex-shrink-0 border border-amber-400/50">
                <div className="flex justify-center items-center gap-3">
                  <span className="text-xs text-amber-400">Your card:</span>
                  <Card
                    card={currentPlayerData.card}
                    small
                    highlight={currentPlayerData.card?.value === communalCard?.value}
                  />
                  {currentPlayerData.card?.value === communalCard?.value && (
                    <span className="text-yellow-400 text-xs font-bold">PAIRS!</span>
                  )}
                </div>
              </div>
            )}

            {/* Game Board - Board card + all player cards */}
            <div className="p-2 bg-gray-900/60 rounded-lg flex-shrink-0">
              <div className="flex justify-center items-end gap-3">
                {/* Board Card */}
                <div className="text-center">
                  <div className="text-xs text-emerald-400 font-bold">Board</div>
                  <Card card={communalCard} small highlight={boardHighest} />
                  {boardHighest && (
                    <div className="text-purple-400 text-xs">HIGH</div>
                  )}
                </div>

                {/* All 4 Player Cards */}
                {players.map((p, idx) => {
                  const isCurrentTurn = idx === currentPlayer && !p.eliminated;
                  const pairsBoard = p.card?.value === communalCard?.value;

                  return (
                    <div key={idx} className={`text-center ${p.folded || p.eliminated ? 'opacity-50' : ''}`}>
                      <div className={`text-xs truncate max-w-[70px] ${isCurrentTurn ? 'text-amber-400 font-bold' : p.eliminated ? 'text-gray-500' : 'text-gray-400'}`}>
                        {p.name}
                        {idx === dealer && !p.eliminated && ' D'}
                      </div>
                      <div className={`inline-block ${p.revealed ? 'ring-2 ring-cyan-400 rounded-lg' : ''}`}>
                        <Card
                          card={p.card}
                          small
                          faceDown={!p.revealed}
                          highlight={p.revealed && pairsBoard}
                        />
                      </div>
                      {/* Status under card */}
                      <div className="text-xs mt-0.5">
                        {p.eliminated ? (
                          <span className="text-red-400">OUT</span>
                        ) : p.folded ? (
                          <span className="text-red-400">Fold</span>
                        ) : p.revealed && pairsBoard ? (
                          <span className="text-yellow-400">PAIRS!</span>
                        ) : p.currentBet > 0 ? (
                          <span className="text-emerald-400">${p.currentBet}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Your Chips */}
            <div className="flex justify-center items-center gap-3 mt-2 flex-shrink-0">
              <ChipStack chips={currentPlayerData.chips} />
              <div className="text-center">
                <div className="text-emerald-400 font-bold text-lg">${currentPlayerData.chips}</div>
                <div className="text-gray-500 text-[10px]">Your chips</div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
