import { useState, useEffect } from 'react';

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
}

const WinnerScreen = ({ winner, pot, players, boardCard, onNextRound, rollover, onReplay }: WinnerScreenProps) => (
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
      </div>
    </div>
  </div>
);

type GameState = 'setup' | 'passing' | 'playing' | 'winner';
type Action = 'bet' | 'call' | 'raise' | 'check' | 'fold' | 'peek';

export default function Kicker() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [deck, setDeck] = useState<CardType[]>([]);
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
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [isPlayerAI, setIsPlayerAI] = useState([false, false, false, false]);
  const [autoAI, setAutoAI] = useState(true);
  const [aiSpeed, setAiSpeed] = useState(1); // 0.5 = fast, 1 = normal, 2 = slow
  const [aiPendingAction, setAiPendingAction] = useState<{ action: Action; amount?: number } | null>(null);
  const [lastRaiser, setLastRaiser] = useState(-1);
  const [bettingRoundStarter, setBettingRoundStarter] = useState(0);
  const [dealer, setDealer] = useState(0);
  const [revealOrder, setRevealOrder] = useState<number[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [roundStartState, setRoundStartState] = useState<{
    players: Player[];
    pot: number;
    currentPlayer: number;
    deck: CardType[];
    communalCard: CardType;
    revealOrder: number[];
  } | null>(null);

  const AI_NAMES = [
    'Alex', 'Sam', 'Jordan', 'Taylor', 'Casey',
    'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake',
    'Charlie', 'Drew', 'Frankie', 'Jamie', 'Jesse',
    'Kelly', 'Logan', 'Max', 'Peyton', 'Reese'
  ];

  const getRandomAIName = (excludeNames: string[]): string => {
    const available = AI_NAMES.filter(n => !excludeNames.includes(n));
    if (available.length === 0) return AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...playerNames];
    const newIsAI = [...isPlayerAI];

    if (value.toLowerCase() === 'ai') {
      // Get names already used by other AI players
      const usedNames = playerNames.filter((_, i) => i !== index && isPlayerAI[i]);
      newNames[index] = getRandomAIName(usedNames);
      newIsAI[index] = true;
    } else {
      newNames[index] = value;
      newIsAI[index] = false;
    }

    setPlayerNames(newNames);
    setIsPlayerAI(newIsAI);
  };

  const getRandomAILevel = (): AISkillLevel => {
    const levels: AISkillLevel[] = ['cautious', 'random', 'aggressive'];
    return levels[Math.floor(Math.random() * levels.length)];
  };

  const dealCards = () => {
    const newDeck = createDeck();
    const communal = newDeck.pop()!;

    const order: number[] = [];
    for (let i = 1; i <= 4; i++) {
      order.push((dealer + i) % 4);
    }
    setRevealOrder(order);

    // Check who can afford to play (need at least 1 chip for ante)
    const newPlayers = players.map((p, i) => {
      const canPlay = p.chips >= 1 && !p.eliminated;
      return {
        ...p,
        name: playerNames[i],
        card: canPlay ? newDeck.pop()! : null,
        revealed: false,
        folded: !canPlay,
        eliminated: p.eliminated || p.chips < 1,
        peekedCards: [],
        currentBet: 0,
        totalRoundBet: 0,
        allIn: false,
        aiLevel: isPlayerAI[i] ? getRandomAILevel() : undefined,
      };
    });

    // Collect antes only from players who can play
    const playingCount = newPlayers.filter(p => !p.eliminated && !p.folded).length;
    const antePlayers = newPlayers.map(p =>
      (!p.eliminated && !p.folded) ? { ...p, chips: p.chips - 1, totalRoundBet: 1 } : p
    );

    // Find first non-eliminated player after dealer
    let firstToAct = (dealer + 1) % 4;
    let attempts = 0;
    while ((antePlayers[firstToAct].eliminated || antePlayers[firstToAct].folded) && attempts < 4) {
      firstToAct = (firstToAct + 1) % 4;
      attempts++;
    }

    const initialPot = playingCount + rolloverPot;

    // Save initial state for replay feature
    setRoundStartState({
      players: antePlayers.map(p => ({ ...p })),
      pot: initialPot,
      currentPlayer: firstToAct,
      deck: [...newDeck],
      communalCard: communal,
      revealOrder: order,
    });

    setDeck(newDeck);
    setCommunalCard(communal);
    setPlayers(antePlayers);
    setPot(initialPot);
    setSidePots([]);
    setAiRaiseCount({});
    setCurrentPlayer(firstToAct);
    setCurrentBetAmount(0);
    setRevealPhase(0);
    setMessage(`${playerNames[dealer]} is dealer. Communal: ${communal.rank}${communal.suit}${rolloverPot > 0 ? ` (+$${rolloverPot} rollover!)` : ''}`);
    setShowPassScreen(true);
    setGameState('passing');
    setWinner(null);
    setIsRollover(false);
    setLastRaiser(-1);
    setBettingRoundStarter(firstToAct);
    setIsReplaying(false);
  };

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
    // Skip folded, eliminated, AND all-in players (they can't act)
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
        // Reveal next card
        let revealerIndex = -1;
        for (let i = 0; i < simRevealOrder.length; i++) {
          const idx = simRevealOrder[i];
          if (!sPlayers[idx].revealed && !sPlayers[idx].eliminated) {
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
      const canCheck = sCurrentBet === 0;
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
    playerIndex: number,
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
    const activePlayers = playerList.filter(p => !p.folded && !p.eliminated);
    const boardValue = communalCard!.value;
    const boardRank = communalCard!.rank;
    const boardSuit = communalCard!.suit;

    // Collect all cards with suits for hand evaluation
    const allCards = [
      { value: boardValue, rank: boardRank, suit: boardSuit, isBoard: true, player: null as Player | null },
      ...activePlayers.map(p => ({
        value: p.card!.value,
        rank: p.card!.rank,
        suit: p.card!.suit,
        isBoard: false,
        player: p
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
    const resolveByHandMaker = (handDescription: string, usedValues: Set<number>, handMakers: Player[]): Winner => {
      const kickerDesc = getKickerDescription(usedValues);
      const hasKicker = kickerDesc !== '';
      console.log('resolveByHandMaker:', handDescription, 'handMakers:', handMakers.map(p => p.name), 'hasKicker:', hasKicker);

      if (handMakers.length === 1) {
        // One player made the hand - they win
        console.log('Winner:', handMakers[0].name);
        return {
          name: handMakers[0].name,
          isSplit: false,
          reason: `${handDescription}${kickerDesc}`,
          rollover: false
        };
      } else if (handMakers.length > 1) {
        // Multiple players made the hand - they SPLIT the pot
        console.log('Split between:', handMakers.map(p => p.name));
        return {
          name: handMakers.map(p => p.name).join(' & '),
          isSplit: true,
          players: handMakers,
          reason: `${handDescription}${kickerDesc}`,
          rollover: false
        };
      }
      // No players made the hand - rollover
      console.log('No handMakers - Board rollover');
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
      if (highCard?.player) {
        return { name: highCard.player.name, isSplit: false, reason: handDescription, rollover: false };
      }
      // Find player with highest card in the straight
      const sortedByValue = [...allCards].sort((a, b) => b.value - a.value);
      for (const card of sortedByValue) {
        if (!card.isBoard && card.player) {
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
      // Highest card in flush determines winner
      const sortedByValue = [...allCards].sort((a, b) => b.value - a.value);
      const highCard = sortedByValue[0];

      if (highCard.isBoard) {
        // Check for tie - multiple players with same high card
        const secondHighest = sortedByValue[1];
        if (!secondHighest.isBoard && secondHighest.player) {
          return { name: secondHighest.player.name, isSplit: false, reason: `${handDescription}, ${secondHighest.rank} kicker`, rollover: false };
        }
        return { name: 'Board', isSplit: false, reason: `${handDescription} - Board high`, rollover: true };
      }

      if (highCard.player) {
        return { name: highCard.player.name, isSplit: false, reason: `${handDescription}, ${highCard.rank} high`, rollover: false };
      }
      return { name: 'Board', isSplit: false, reason: handDescription, rollover: true };
    }

    // 5. Straight
    if (isStraight) {
      const handDescription = isWheel ? 'Straight (Wheel)' : 'Straight';
      // Highest card determines winner (or 5 for wheel)
      const highValue = isWheel ? 5 : Math.max(...sortedValues);
      const highCard = allCards.find(c => c.value === highValue);

      if (highCard?.isBoard) {
        // Board is high - next highest player card wins
        const sortedByValue = [...allCards].filter(c => !c.isBoard).sort((a, b) => b.value - a.value);
        if (sortedByValue.length > 0 && sortedByValue[0].player) {
          return { name: sortedByValue[0].player.name, isSplit: false, reason: `${handDescription}, ${sortedByValue[0].rank} kicker`, rollover: false };
        }
        return { name: 'Board', isSplit: false, reason: `${handDescription} - Board high`, rollover: true };
      }

      if (highCard?.player) {
        return { name: highCard.player.name, isSplit: false, reason: `${handDescription}, ${highCard.rank} high`, rollover: false };
      }
      return { name: 'Board', isSplit: false, reason: handDescription, rollover: true };
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
      const handDescription = `Pair of ${pairRank}s`;
      const usedValues = new Set([pairs[0].value]);
      return resolveByHandMaker(handDescription, usedValues, pairs[0].players);
    }

    // 9. High card
    console.log('Fell through to HIGH CARD - no pairs/trips detected!');
    const sortedCards = [...allCards].sort((a, b) => b.value - a.value);
    const highestCard = sortedCards[0];

    if (highestCard.isBoard) {
      console.log('Board has high card - rollover');
      return { name: 'Board', isSplit: false, reason: `${boardRank} high - Board wins`, rollover: true };
    }

    // Player has high card
    const highCardPlayers = activePlayers.filter(p => p.card!.value === highestCard.value);
    if (highCardPlayers.length === 1) {
      console.log('High card winner:', highCardPlayers[0].name);
      return { name: highCardPlayers[0].name, isSplit: false, reason: `${highestCard.rank} high`, rollover: false };
    } else {
      // Multiple players tied for high card - they split
      console.log('High card split:', highCardPlayers.map(p => p.name));
      return {
        name: highCardPlayers.map(p => p.name).join(' & '),
        isSplit: true,
        players: highCardPlayers,
        reason: `${highestCard.rank} high`,
        rollover: false
      };
    }
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
        if (!playersToUse[idx].revealed && !playersToUse[idx].eliminated) {
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
      const foldedNote = revealer.folded ? ' (folded)' : '';
      setMessage(`${revealer.name} reveals: ${revealer.card!.rank}${revealer.card!.suit}${foldedNote}`);
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
        // Reveal ALL cards (including folded players) - they're part of the hand
        if (!playersToUse[idx].revealed && !playersToUse[idx].eliminated) {
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
      const foldedNote = revealer.folded ? ' (folded)' : '';
      setMessage(`${revealer.name} reveals: ${revealer.card!.rank}${revealer.card!.suit}${foldedNote}`);
      setPot(potToUse);
      startNextBettingRound(revealedPlayers, nextReveal);
    } else if (nextPlayer === checkPlayer && currentBetToUse === 0) {
      const nextReveal = revealPhase + 1;

      let revealerIndex = -1;
      for (let i = 0; i < revealOrder.length; i++) {
        const idx = revealOrder[i];
        // Reveal ALL cards (including folded players) - they're part of the hand
        if (!playersToUse[idx].revealed && !playersToUse[idx].eliminated) {
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
      const foldedNote = revealer.folded ? ' (folded)' : '';
      setMessage(`${revealer.name} reveals: ${revealer.card!.rank}${revealer.card!.suit}${foldedNote}`);
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
    const player = players[currentPlayer];
    let newPot = pot;
    const toCall = Math.min(currentBetAmount - player.currentBet, player.chips);
    // Always create a fresh copy to preserve all state including revealed
    let newPlayers = players.map(p => ({ ...p }));

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
      // Track AI raises (bet counts as first raise)
      if (player.aiLevel) {
        setAiRaiseCount(prev => ({ ...prev, [currentPlayer]: (prev[currentPlayer] || 0) + 1 }));
      }
      setMessage(`${player.name} ${isAllIn ? 'went all-in with' : 'bet'} $${actualBet}`);
      advanceToNextPlayer(newPlayers, newPot, currentPlayer, actualBet);
      return;
    } else if (action === 'call') {
      // Limit call to available chips (all-in if can't afford full call)
      const actualCall = Math.min(toCall, player.chips);
      const isAllIn = actualCall >= player.chips;
      newPlayers = newPlayers.map((p, i) => updatePlayer(p, i, actualCall, p.currentBet + actualCall));
      newPot = pot + actualCall;
      setMessage(`${player.name} ${isAllIn ? 'went all-in with' : 'called'} $${actualCall}`);
    } else if (action === 'raise') {
      // Limit raise to available chips
      const maxRaise = player.chips - toCall;
      const actualRaise = Math.min(amount, maxRaise);
      if (actualRaise <= 0) {
        // Can't raise, just call (all-in)
        const actualCall = Math.min(toCall, player.chips);
        newPlayers = newPlayers.map((p, i) => updatePlayer(p, i, actualCall, p.currentBet + actualCall));
        newPot = pot + actualCall;
        setMessage(`${player.name} went all-in with $${actualCall}`);
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
      // Track AI raises
      if (player.aiLevel) {
        setAiRaiseCount(prev => ({ ...prev, [currentPlayer]: (prev[currentPlayer] || 0) + 1 }));
      }
      setMessage(`${player.name} ${isAllIn ? 'went all-in, raising to' : 'raised to'} $${newBetAmount}`);
      advanceToNextPlayer(newPlayers, newPot, currentPlayer, newBetAmount);
      return;
    } else if (action === 'check') {
      setMessage(`${player.name} checked`);
    } else if (action === 'fold') {
      newPlayers = newPlayers.map((p, i) =>
        i === currentPlayer ? { ...p, folded: true } : p
      );
      setMessage(`${player.name} folded`);
    } else if (action === 'peek') {
      if (deck.length > 0) {
        const newDeck = [...deck];
        const peeked = newDeck.pop()!;
        newPlayers = newPlayers.map((p, i) =>
          i === currentPlayer ? { ...p, peekedCards: [...p.peekedCards, peeked], chips: p.chips - 1 } : p
        );
        newPot = pot + 1;
        setDeck(newDeck);
        setPot(newPot);
        setPlayers(newPlayers);
        setMessage(`${player.name} peeked at a card`);
        return;
      }
    }

    advanceToNextPlayer(newPlayers, newPot);
  };

  const handleNextRound = () => {
    // Eliminate players with no chips
    const resetPlayers = players.map(p => ({
      ...p,
      card: null,
      revealed: false,
      folded: false,
      eliminated: p.eliminated || p.chips <= 0,
      peekedCards: [],
      currentBet: 0,
      totalRoundBet: 0,
      allIn: false,
    }));
    setPlayers(resetPlayers);
    setSidePots([]);
    setAiRaiseCount({});

    // Find next non-eliminated dealer
    let nextDealer = (dealer + 1) % 4;
    let attempts = 0;
    while (resetPlayers[nextDealer].eliminated && attempts < 4) {
      nextDealer = (nextDealer + 1) % 4;
      attempts++;
    }
    setDealer(nextDealer);
    setGameState('setup');
    setShowPassScreen(false);
    setWinner(null);
    setPot(0);
    setCurrentBetAmount(0);
    setIsRollover(false);
    setIsReplaying(false);
  };

  // Handle "Replay Last Round" - restore initial state and watch round play out
  const handleReplayLastRound = () => {
    if (!roundStartState) return;

    // Restore the initial round state
    setPlayers(roundStartState.players.map(p => ({ ...p })));
    setPot(roundStartState.pot);
    setCurrentPlayer(roundStartState.currentPlayer);
    setDeck([...roundStartState.deck]);
    setCommunalCard(roundStartState.communalCard);
    setRevealOrder(roundStartState.revealOrder);
    setCurrentBetAmount(0);
    setRevealPhase(0);
    setLastRaiser(-1);
    setAiRaiseCount({});

    // Clear winner and start replaying
    setWinner(null);
    setIsReplaying(true);
    setShowPassScreen(true);
    setGameState('passing');
  };

  // Cancel replay - simulate to end and show winner
  const handleCancelReplay = () => {
    // Simulate the rest of the round to get final result
    const { finalPlayers, finalPot } = simulateRestOfRound(
      players,
      pot,
      currentPlayer,
      currentBetAmount,
      revealPhase,
      lastRaiser,
      bettingRoundStarter,
      revealOrder,
      aiRaiseCount
    );

    setIsReplaying(false);
    endRound(finalPot, finalPlayers);
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

  // Function to trigger AI turn - shows decision first, then executes
  const triggerAITurn = () => {
    if (!currentPlayerData?.aiLevel) return;
    if (aiPendingAction) {
      // Execute the pending action
      handleAction(aiPendingAction.action, aiPendingAction.amount || 0);
      setAiPendingAction(null);
    } else {
      // Compute and show the decision
      const decision = makeAIDecision(currentPlayerData, currentPlayer);
      setAiPendingAction(decision);
    }
  };

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

  return (
    <div className="h-dvh bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 text-white p-2 font-sans overflow-hidden flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+Pro:wght@400;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'Source Sans Pro', sans-serif; }
      `}</style>

      {showPassScreen && (
        players[currentPlayer]?.aiLevel ? (
          // AI player pass screen
          <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
            <div className="text-center p-4">
              {isReplaying && (
                <div className="text-cyan-300 text-xs mb-2 px-3 py-1 bg-cyan-900/60 rounded-full inline-block">
                  Replaying round...
                </div>
              )}
              <h2 className="font-display text-2xl text-cyan-400 mb-2">{players[currentPlayer].name}'s Turn</h2>
              <p className="text-gray-400 mb-1 text-sm">({players[currentPlayer].aiLevel} AI)</p>
              {autoAI ? (
                <p className="text-cyan-400 animate-pulse text-sm mt-4">Starting turn...</p>
              ) : (
                <button
                  onClick={handleReady}
                  className="mt-4 px-8 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-xl font-bold text-base shadow-lg hover:from-cyan-500 hover:to-cyan-400 transition-all"
                >
                  Next
                </button>
              )}
              {isReplaying && (
                <button
                  onClick={handleCancelReplay}
                  className="mt-4 ml-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-colors"
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
        />
      )}

      <div className="max-w-md mx-auto flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-center mb-1 flex-shrink-0">
          <h1 className="font-display text-xl bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
            KICKER
          </h1>
          {rolloverPot > 0 && gameState === 'setup' && (
            <div className="text-purple-400 font-bold text-xs">+${rolloverPot} rollover!</div>
          )}
        </div>

        {gameState === 'setup' && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="p-4 bg-gray-900/80 rounded-xl flex-shrink-0">
              <h3 className="font-semibold text-amber-400 mb-3 text-base">Player Names</h3>
              {/* Mobile: 1 column, Desktop: 2 columns with 1,2 left and 3,4 right */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Left column: Players 1 & 2 */}
                <div className="flex-1 flex flex-col gap-3">
                  {[0, 1].map((i) => {
                    const name = playerNames[i];
                    return (
                      <div key={i} className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleNameChange(i, e.target.value)}
                          onFocus={(e) => {
                            if (name === `Player ${i + 1}` || isPlayerAI[i]) {
                              const newNames = [...playerNames];
                              newNames[i] = '';
                              setPlayerNames(newNames);
                              if (isPlayerAI[i]) {
                                const newIsAI = [...isPlayerAI];
                                newIsAI[i] = false;
                                setIsPlayerAI(newIsAI);
                              }
                            }
                            e.target.select();
                          }}
                          onBlur={() => {
                            if (name.trim() === '') {
                              const newNames = [...playerNames];
                              newNames[i] = `Player ${i + 1}`;
                              setPlayerNames(newNames);
                            }
                          }}
                          className={`w-full px-4 py-3 bg-gray-800 border-2 rounded-lg text-white text-base ${isPlayerAI[i] ? 'border-cyan-400' : i === dealer ? 'border-amber-400' : 'border-gray-700'}`}
                          placeholder={`Player ${i + 1}`}
                        />
                        {isPlayerAI[i] && (
                          <span className="absolute -top-2 -left-1 bg-cyan-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            AI
                          </span>
                        )}
                        {i === dealer && (
                          <span className="absolute -top-2 -right-1 bg-amber-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            D
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Right column: Players 3 & 4 */}
                <div className="flex-1 flex flex-col gap-3">
                  {[2, 3].map((i) => {
                    const name = playerNames[i];
                    return (
                      <div key={i} className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleNameChange(i, e.target.value)}
                          onFocus={(e) => {
                            if (name === `Player ${i + 1}` || isPlayerAI[i]) {
                              const newNames = [...playerNames];
                              newNames[i] = '';
                              setPlayerNames(newNames);
                              if (isPlayerAI[i]) {
                                const newIsAI = [...isPlayerAI];
                                newIsAI[i] = false;
                                setIsPlayerAI(newIsAI);
                              }
                            }
                            e.target.select();
                          }}
                          onBlur={() => {
                            if (name.trim() === '') {
                              const newNames = [...playerNames];
                              newNames[i] = `Player ${i + 1}`;
                              setPlayerNames(newNames);
                            }
                          }}
                          className={`w-full px-4 py-3 bg-gray-800 border-2 rounded-lg text-white text-base ${isPlayerAI[i] ? 'border-cyan-400' : i === dealer ? 'border-amber-400' : 'border-gray-700'}`}
                          placeholder={`Player ${i + 1}`}
                        />
                        {isPlayerAI[i] && (
                          <span className="absolute -top-2 -left-1 bg-cyan-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            AI
                          </span>
                        )}
                        {i === dealer && (
                          <span className="absolute -top-2 -right-1 bg-amber-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            D
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 text-center text-sm text-gray-400">
                {playerNames[dealer]} deals • Type "AI" for bots
              </div>
            </div>

            {players[0].chips !== 50 && (
              <div className="p-2 bg-gray-900/80 rounded-xl">
                <div className="grid grid-cols-4 gap-1">
                  {players.map((p, i) => (
                    <div key={i} className={`text-center ${p.eliminated ? 'opacity-40' : ''} ${i === dealer && !p.eliminated ? 'ring-1 ring-amber-400 rounded p-0.5' : ''}`}>
                      <div className="text-xs text-gray-400 truncate">{playerNames[i]}</div>
                      {p.eliminated ? (
                        <div className="text-red-400 font-bold text-xs">OUT</div>
                      ) : (
                        <div className="text-emerald-400 font-bold text-sm">${p.chips}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Check for game winner */}
            {(() => {
              const activePlayers = players.filter(p => !p.eliminated && p.chips > 0);
              if (activePlayers.length <= 1 && players.some(p => p.eliminated)) {
                const gameWinner = activePlayers[0];
                return (
                  <div className="p-3 bg-amber-900/60 rounded-xl border-2 border-amber-400 text-center">
                    <h2 className="font-display text-xl text-amber-400">Game Over!</h2>
                    <p className="text-lg text-white">{gameWinner?.name || 'No one'} wins with ${gameWinner?.chips || 0}!</p>
                  </div>
                );
              }
              return null;
            })()}

            {players.filter(p => !p.eliminated && p.chips > 0).length > 1 && (
              <button
                onClick={dealCards}
                className="w-full px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 rounded-lg font-bold text-sm shadow-lg hover:from-amber-400 hover:to-yellow-300 transition-all"
              >
                Deal Cards {rolloverPot > 0 && `(+$${rolloverPot})`}
              </button>
            )}

            <div className="p-2 bg-gray-900/60 rounded-xl border border-gray-800">
              <h3 className="font-display text-sm text-amber-400 mb-1">How to Win</h3>
              <ul className="text-xs text-gray-400 space-y-0.5 font-body">
                <li><span className="text-yellow-400">Pair with board</span> = Best</li>
                <li><span className="text-blue-400">Pair with player</span> = 2nd</li>
                <li><span className="text-gray-300">Highest card</span> = 3rd</li>
                <li><span className="text-purple-400">Board highest</span> = Rollover</li>
              </ul>
            </div>
          </div>
        )}

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

            {/* AI Controls */}
            {players.some(p => p.aiLevel) && (
              <div className="flex justify-center items-center gap-2 mb-1 flex-shrink-0">
                <button
                  onClick={() => setAutoAI(!autoAI)}
                  className={`px-3 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    autoAI ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {autoAI ? 'Auto' : 'Manual'}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAiSpeed(Math.max(0.25, aiSpeed - 0.25))}
                    className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold"
                  >-</button>
                  <span className="text-xs text-gray-400 w-8 text-center">
                    {aiSpeed === 0.25 ? '4x' : aiSpeed === 0.5 ? '2x' : aiSpeed === 0.75 ? '1.3x' : aiSpeed === 1 ? '1x' : aiSpeed === 1.5 ? '.7x' : '.5x'}
                  </span>
                  <button
                    onClick={() => setAiSpeed(Math.min(2, aiSpeed + 0.25))}
                    className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold"
                  >+</button>
                </div>
              </div>
            )}

            <div className="text-center mb-2 text-xs text-gray-300 flex-shrink-0">{message}</div>

            {/* Current Player Actions */}
            <div className="p-2 bg-amber-900/40 rounded-lg border border-amber-400 mb-2 flex-shrink-0">
              <div className="text-center mb-1">
                <span className="text-amber-400 font-bold">{currentPlayerData.name}'s Turn</span>
                {currentPlayerData.aiLevel && (
                  <span className="text-cyan-400 ml-1 text-xs">({currentPlayerData.aiLevel})</span>
                )}
                {currentPlayerData.currentBet > 0 && (
                  <span className="text-gray-400 ml-1 text-xs">(${currentPlayerData.currentBet})</span>
                )}
              </div>

              {/* AI Actions Display */}
              {currentPlayerData.aiLevel && (
                <div className="space-y-1">
                  {!aiPendingAction && (
                    <div className="text-center py-1">
                      {autoAI ? (
                        <div className="text-cyan-400 text-xs animate-pulse">AI thinking...</div>
                      ) : (
                        <button onClick={triggerAITurn} className="px-4 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-xs">
                          Next
                        </button>
                      )}
                    </div>
                  )}

                  {aiPendingAction && (
                    <>
                      <div className="text-center text-cyan-400 text-[10px]">{currentPlayerData.name} chooses...</div>

                      {canBet && (
                        <div className="grid grid-cols-3 gap-1">
                          {[1, 2, 3].map(amt => (
                            <div key={amt} className={`px-1 py-1 rounded text-xs font-bold text-center transition-all duration-300 ${
                              aiPendingAction.action === 'bet' && aiPendingAction.amount === amt
                                ? 'bg-green-400 text-gray-900 ring-1 ring-green-300 animate-pulse'
                                : 'bg-green-900/50 text-green-300/50'
                            }`}>
                              ${amt}
                            </div>
                          ))}
                        </div>
                      )}

                      {canCall && (
                        <div className={`w-full px-1 py-1 rounded text-xs font-bold text-center transition-all duration-300 ${
                          aiPendingAction.action === 'call'
                            ? 'bg-blue-400 text-gray-900 ring-1 ring-blue-300 animate-pulse'
                            : 'bg-blue-900/50 text-blue-300/50'
                        }`}>
                          Call ${toCall}
                        </div>
                      )}

                      {canRaise && (
                        <div className="grid grid-cols-3 gap-1">
                          {[1, 2, 3].map(amt => (
                            <div
                              key={amt}
                              className={`px-1 py-1 rounded text-xs font-bold text-center transition-all duration-300 ${
                                aiPendingAction.action === 'raise' && aiPendingAction.amount === amt
                                  ? 'bg-orange-400 text-gray-900 ring-1 ring-orange-300 animate-pulse'
                                  : 'bg-orange-900/50 text-orange-300/50'
                              }`}
                            >
                              +${amt}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={`grid ${canCheck ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
                        {canCheck && (
                          <div
                            className={`px-1 py-1 rounded text-xs font-bold text-center transition-all duration-300 ${
                              aiPendingAction.action === 'check'
                                ? 'bg-gray-400 text-gray-900 ring-1 ring-gray-300 animate-pulse'
                                : 'bg-gray-800/50 text-gray-400/50'
                            }`}
                          >
                            Check
                          </div>
                        )}
                        <div
                          className={`px-1 py-1 rounded text-xs font-bold text-center transition-all duration-300 ${
                            aiPendingAction.action === 'fold'
                              ? 'bg-red-400 text-gray-900 ring-1 ring-red-300 animate-pulse'
                              : 'bg-red-900/50 text-red-300/50'
                          }`}
                        >
                          Fold
                        </div>
                      </div>

                      {!autoAI && (
                        <div className="text-center mt-1">
                          <button
                            onClick={triggerAITurn}
                            className="px-4 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-xs transition-colors"
                          >
                            Execute
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Human Player Controls */}
              {!currentPlayerData.aiLevel && (
                <>
                  {/* Peeked Cards */}
                  {currentPlayerData.peekedCards.length > 0 && (
                    <div className="mb-1">
                      <div className="text-[10px] text-gray-400 text-center">Peeked</div>
                      <div className="flex gap-1 justify-center">
                        {currentPlayerData.peekedCards.map((card, i) => (
                          <Card key={i} card={card} small />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-1.5">
                {canBet && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => handleAction('bet', 1)} className="px-2 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold transition-colors">
                      Bet $1
                    </button>
                    <button onClick={() => handleAction('bet', 2)} className="px-2 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold transition-colors">
                      Bet $2
                    </button>
                    <button onClick={() => handleAction('bet', 3)} className="px-2 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold transition-colors">
                      Bet $3
                    </button>
                  </div>
                )}

                {canCall && (
                  <button
                    onClick={() => handleAction('call')}
                    className="w-full px-2 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors"
                  >
                    Call ${toCall}
                  </button>
                )}

                {canRaise && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleAction('raise', 1)}
                      className="px-2 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold transition-colors"
                    >
                      +$1
                    </button>
                    <button
                      onClick={() => handleAction('raise', 2)}
                      className="px-2 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold transition-colors"
                    >
                      +$2
                    </button>
                    <button
                      onClick={() => handleAction('raise', 3)}
                      className="px-2 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold transition-colors"
                    >
                      +$3
                    </button>
                  </div>
                )}

                <div className={`grid ${canCheck ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
                  <button
                    onClick={() => handleAction('peek')}
                    className="px-2 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold transition-colors"
                  >
                    Peek $1
                  </button>
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
                  if (p.eliminated) {
                    return (
                      <div key={idx} className="text-center opacity-30">
                        <div className="text-xs text-gray-500 truncate max-w-[70px]">{p.name}</div>
                        <div className="w-11 h-16 rounded-lg bg-gray-800 flex items-center justify-center">
                          <span className="text-red-400 text-xs font-bold">OUT</span>
                        </div>
                      </div>
                    );
                  }
                  const isCurrentTurn = idx === currentPlayer;
                  const pairsBoard = p.card?.value === communalCard?.value;

                  return (
                    <div key={idx} className={`text-center ${p.folded ? 'opacity-40' : ''}`}>
                      <div className={`text-xs truncate max-w-[70px] ${isCurrentTurn ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                        {p.name}
                        {idx === dealer && ' D'}
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
                        {p.folded ? (
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
