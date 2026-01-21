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
  aiLevel?: AISkillLevel;
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
}

const WinnerScreen = ({ winner, pot, players, boardCard, onNextRound, rollover }: WinnerScreenProps) => (
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
              <div className={`text-xs mb-1 truncate max-w-[50px] ${isWinner ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
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

      <button
        onClick={onNextRound}
        className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 rounded-xl font-bold text-base shadow-lg hover:from-amber-400 hover:to-yellow-300 transition-all"
      >
        Next Round
      </button>
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
    { name: 'Player 1', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0 },
    { name: 'Player 2', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0 },
    { name: 'Player 3', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0 },
    { name: 'Player 4', chips: 50, card: null, revealed: false, folded: false, eliminated: false, peekedCards: [], currentBet: 0 },
  ]);
  const [pot, setPot] = useState(0);
  const [rolloverPot, setRolloverPot] = useState(0);
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
        aiLevel: isPlayerAI[i] ? getRandomAILevel() : undefined,
      };
    });

    // Collect antes only from players who can play
    const playingCount = newPlayers.filter(p => !p.eliminated && !p.folded).length;
    const antePlayers = newPlayers.map(p =>
      (!p.eliminated && !p.folded) ? { ...p, chips: p.chips - 1 } : p
    );

    // Find first non-eliminated player after dealer
    let firstToAct = (dealer + 1) % 4;
    let attempts = 0;
    while ((antePlayers[firstToAct].eliminated || antePlayers[firstToAct].folded) && attempts < 4) {
      firstToAct = (firstToAct + 1) % 4;
      attempts++;
    }

    setDeck(newDeck);
    setCommunalCard(communal);
    setPlayers(antePlayers);
    setPot(playingCount + rolloverPot);
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
  };

  const handleReady = () => {
    setShowPassScreen(false);
    setGameState('playing');
  };

  const getActivePlayers = () => players.filter(p => !p.folded && !p.eliminated);

  const findNextActivePlayer = (fromIndex: number) => {
    let next = (fromIndex + 1) % 4;
    let attempts = 0;
    while ((players[next].folded || players[next].eliminated) && attempts < 4) {
      next = (next + 1) % 4;
      attempts++;
    }
    return attempts >= 4 ? -1 : next;
  };

  // AI Decision Making
  const makeAIDecision = (player: Player): { action: Action; amount?: number } => {
    const myCard = player.card!;
    const aiLevel = player.aiLevel!;
    const toCall = currentBetAmount - player.currentBet;
    const canCheck = currentBetAmount === 0;
    const availableChips = player.chips;
    const canAffordCall = availableChips >= toCall;
    const maxBet = availableChips;
    const maxRaise = availableChips - toCall;

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
      // 20% chance to bet/raise if we can afford it
      if (Math.random() < 0.2) {
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
      // Never folds, often bets/raises
      if (pairsWithBoard) {
        // Always raise big with board pair (limited by chips)
        const amount = Math.min(3, canCheck ? maxBet : maxRaise);
        if (amount > 0) {
          if (canCheck) return { action: 'bet', amount };
          return { action: 'raise', amount };
        }
      }
      // 50% chance to bet/raise if we can afford it
      if (Math.random() < 0.5) {
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

    // Check for straight (5 consecutive values)
    const sortedValues = [...allCards].map(c => c.value).sort((a, b) => a - b);
    let isStraight = true;
    for (let i = 1; i < sortedValues.length; i++) {
      if (sortedValues[i] !== sortedValues[i - 1] + 1) {
        isStraight = false;
        break;
      }
    }
    // Check for A-2-3-4-5 straight (wheel)
    const isWheel = sortedValues.join(',') === '2,3,4,5,14';
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
    // Kicker only describes the hand, doesn't determine winner
    const resolveByHandMaker = (handDescription: string, usedValues: Set<number>, handMakers: Player[]): Winner => {
      const kickerDesc = getKickerDescription(usedValues);

      if (handMakers.length === 1) {
        // One player made the hand - they win
        return {
          name: handMakers[0].name,
          isSplit: false,
          reason: `${handDescription}${kickerDesc}`,
          rollover: false
        };
      } else if (handMakers.length > 1) {
        // Multiple players made the hand - tie, rollover
        return {
          name: 'Tie',
          isSplit: false,
          reason: `${handDescription}${kickerDesc} - Tie!`,
          rollover: true
        };
      }
      // No players made the hand (shouldn't happen for most hands)
      return { name: 'Board', isSplit: false, reason: handDescription, rollover: true };
    };

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

      // In full house, no kicker - trips holder wins, or tie if board involved
      if (trips!.players.length === 1) {
        return { name: trips!.players[0].name, isSplit: false, reason: handDescription, rollover: false };
      } else if (trips!.players.length > 1) {
        // Tie - rollover
        return { name: 'Tie', isSplit: false, reason: `${handDescription} - Tie!`, rollover: true };
      }
      // Board has the trips - pair holders determine winner
      if (pairs[0].players.length === 1) {
        return { name: pairs[0].players[0].name, isSplit: false, reason: handDescription, rollover: false };
      } else if (pairs[0].players.length > 1) {
        return { name: 'Tie', isSplit: false, reason: `${handDescription} - Tie!`, rollover: true };
      }
      return { name: 'Board', isSplit: false, reason: handDescription, rollover: true };
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

      // Player who made the HIGHER pair wins
      // If higher pair involves board only, fall back to lower pair makers
      if (pairs[0].players.length > 0) {
        return resolveByHandMaker(handDescription, usedValues, pairs[0].players);
      } else if (pairs[1].players.length > 0) {
        return resolveByHandMaker(handDescription, usedValues, pairs[1].players);
      }
      // Both pairs involve only board (impossible with 1 board card)
      return { name: 'Board', isSplit: false, reason: handDescription, rollover: true };
    }

    // 8. One pair
    if (pairs.length === 1) {
      const pairRank = allCards.find(c => c.value === pairs[0].value)?.rank || '';
      const handDescription = `Pair of ${pairRank}s`;
      const usedValues = new Set([pairs[0].value]);
      return resolveByHandMaker(handDescription, usedValues, pairs[0].players);
    }

    // 9. High card
    const sortedCards = [...allCards].sort((a, b) => b.value - a.value);
    const highestCard = sortedCards[0];

    if (highestCard.isBoard) {
      return { name: 'Board', isSplit: false, reason: `${boardRank} high - Board wins`, rollover: true };
    }

    // Player has high card
    const highCardPlayers = activePlayers.filter(p => p.card!.value === highestCard.value);
    if (highCardPlayers.length === 1) {
      return { name: highCardPlayers[0].name, isSplit: false, reason: `${highestCard.rank} high`, rollover: false };
    } else {
      // Tie - rollover
      return { name: 'Tie', isSplit: false, reason: `${highestCard.rank} high - Tie!`, rollover: true };
    }
  };

  const endRound = (finalPot?: number, finalPlayers?: Player[]) => {
    const playersToUse = finalPlayers || players;
    const potToUse = finalPot !== undefined ? finalPot : pot;
    const winnerResult = determineWinner(playersToUse);

    if (winnerResult.rollover) {
      setRolloverPot(potToUse);
      setIsRollover(true);
      const revealedPlayers = playersToUse.map(p => ({ ...p, revealed: true }));
      setPlayers(revealedPlayers);
      setWinner(winnerResult);
      setGameState('winner');
      return;
    }

    let newPlayers = playersToUse.map(p => ({ ...p, revealed: true }));

    if (winnerResult.isSplit && winnerResult.players) {
      const share = Math.floor(potToUse / winnerResult.players.length);
      newPlayers = newPlayers.map(p => {
        const isWinner = winnerResult.players!.some(wp => wp.name === p.name);
        return isWinner ? { ...p, chips: p.chips + share } : p;
      });
    } else {
      newPlayers = newPlayers.map(p =>
        p.name === winnerResult.name ? { ...p, chips: p.chips + potToUse } : p
      );
    }

    setPlayers(newPlayers);
    setWinner(winnerResult);
    setRolloverPot(0);
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
    const lastRaiserToUse = newLastRaiser !== undefined ? newLastRaiser : lastRaiser;
    const currentBetToUse = newCurrentBet !== undefined ? newCurrentBet : currentBetAmount;

    if (activePlayers.length === 1) {
      endRound(potToUse, playersToUse);
      return;
    }

    const nextPlayer = findNextActivePlayer(currentPlayer);

    if (nextPlayer === -1) {
      endRound(potToUse, playersToUse);
      return;
    }

    const checkPlayer = lastRaiserToUse >= 0 ? lastRaiserToUse : bettingRoundStarter;
    const allMatched = activePlayers.every(p => p.currentBet === currentBetToUse || p.folded);

    if (nextPlayer === checkPlayer && allMatched && currentBetToUse > 0) {
      const nextReveal = revealPhase + 1;

      let revealerIndex = -1;
      for (let i = 0; i < revealOrder.length; i++) {
        const idx = revealOrder[i];
        if (!playersToUse[idx].folded && !playersToUse[idx].revealed) {
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
      setMessage(`${revealedPlayers[revealerIndex].name} reveals: ${revealedPlayers[revealerIndex].card!.rank}${revealedPlayers[revealerIndex].card!.suit}`);
      setPot(potToUse);
      startNextBettingRound(revealedPlayers, nextReveal);
    } else if (nextPlayer === bettingRoundStarter && currentBetToUse === 0) {
      const nextReveal = revealPhase + 1;

      let revealerIndex = -1;
      for (let i = 0; i < revealOrder.length; i++) {
        const idx = revealOrder[i];
        if (!playersToUse[idx].folded && !playersToUse[idx].revealed) {
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
      setMessage(`${revealedPlayers[revealerIndex].name} reveals: ${revealedPlayers[revealerIndex].card!.rank}${revealedPlayers[revealerIndex].card!.suit}`);
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

    if (action === 'bet') {
      // Limit bet to available chips
      const actualBet = Math.min(amount, player.chips);
      if (actualBet <= 0) return; // Can't bet with no chips
      newPlayers = newPlayers.map((p, i) =>
        i === currentPlayer ? { ...p, chips: p.chips - actualBet, currentBet: p.currentBet + actualBet } : p
      );
      newPot = pot + actualBet;
      setCurrentBetAmount(actualBet);
      setLastRaiser(currentPlayer);
      setMessage(`${player.name} bet $${actualBet}`);
      advanceToNextPlayer(newPlayers, newPot, currentPlayer, actualBet);
      return;
    } else if (action === 'call') {
      // Limit call to available chips (all-in if can't afford full call)
      const actualCall = Math.min(toCall, player.chips);
      newPlayers = newPlayers.map((p, i) =>
        i === currentPlayer ? { ...p, chips: p.chips - actualCall, currentBet: p.currentBet + actualCall } : p
      );
      newPot = pot + actualCall;
      setMessage(`${player.name} ${actualCall < toCall ? 'went all-in with' : 'called'} $${actualCall}`);
    } else if (action === 'raise') {
      // Limit raise to available chips
      const maxRaise = player.chips - toCall;
      const actualRaise = Math.min(amount, maxRaise);
      if (actualRaise <= 0) {
        // Can't raise, just call
        const actualCall = Math.min(toCall, player.chips);
        newPlayers = newPlayers.map((p, i) =>
          i === currentPlayer ? { ...p, chips: p.chips - actualCall, currentBet: p.currentBet + actualCall } : p
        );
        newPot = pot + actualCall;
        setMessage(`${player.name} went all-in with $${actualCall}`);
        advanceToNextPlayer(newPlayers, newPot);
        return;
      }
      const totalCost = toCall + actualRaise;
      const newBetAmount = currentBetAmount + actualRaise;
      newPlayers = newPlayers.map((p, i) =>
        i === currentPlayer ? { ...p, chips: p.chips - totalCost, currentBet: newBetAmount } : p
      );
      newPot = pot + totalCost;
      setCurrentBetAmount(newBetAmount);
      setLastRaiser(currentPlayer);
      setMessage(`${player.name} raised $${amount} (total: $${newBetAmount})`);
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
    }));
    setPlayers(resetPlayers);

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
      const decision = makeAIDecision(currentPlayerData);
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
          const decision = makeAIDecision(currentPlayerData);
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
            <div className="p-2 bg-gray-900/80 rounded-xl flex-shrink-0">
              <h3 className="font-semibold text-amber-400 mb-1 text-xs">Player Names</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {playerNames.map((name, i) => (
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
                      className={`w-full px-2 py-1 bg-gray-800 border rounded text-white text-xs ${isPlayerAI[i] ? 'border-cyan-400' : i === dealer ? 'border-amber-400' : 'border-gray-700'}`}
                      placeholder={`Player ${i + 1}`}
                    />
                    {isPlayerAI[i] && (
                      <span className="absolute -top-1.5 -left-1 bg-cyan-500 text-gray-900 text-[10px] font-bold px-1.5 py-0 rounded-full">
                        AI
                      </span>
                    )}
                    {i === dealer && (
                      <span className="absolute -top-1.5 -right-1 bg-amber-500 text-gray-900 text-[10px] font-bold px-1 py-0 rounded-full">
                        D
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-1 text-center text-[10px] text-gray-400">
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
                        <div className="text-xs text-gray-500 truncate max-w-[50px]">{p.name}</div>
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
                      <div className={`text-xs truncate max-w-[50px] ${isCurrentTurn ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                        {p.name}
                        {idx === dealer && ' D'}
                        {p.folded && ' X'}
                      </div>
                      <div className={`inline-block ${p.revealed ? 'ring-2 ring-cyan-400 rounded-lg' : ''}`}>
                        <Card
                          card={p.card}
                          small
                          faceDown={!p.revealed}
                          highlight={p.revealed && pairsBoard}
                        />
                      </div>
                      {p.revealed && pairsBoard && (
                        <div className="text-yellow-400 text-xs">PAIRS!</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Bets */}
            {players.some(p => p.currentBet > 0) && (
              <div className="flex justify-center gap-2 text-[10px] mt-1 flex-shrink-0">
                {players.map((p, i) => p.currentBet > 0 && (
                  <span key={i} className="text-gray-400">
                    {p.name}: <span className="text-red-400">${p.currentBet}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
