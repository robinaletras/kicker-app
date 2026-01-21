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
      <div className={`${small ? 'w-12 h-16' : 'w-24 h-32'} rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-emerald-600 flex items-center justify-center shadow-lg`}>
        <div className="text-emerald-400 text-3xl font-bold">K</div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className={`${small ? 'w-12 h-16' : 'w-24 h-32'} rounded-lg bg-white border-3 ${highlight ? 'border-yellow-400 ring-4 ring-yellow-400/50' : 'border-gray-300'} flex flex-col items-center justify-center shadow-lg transition-all duration-300`}>
      <span className={`${small ? 'text-lg' : 'text-3xl'} font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.rank}
      </span>
      <span className={`${small ? 'text-xl' : 'text-4xl'} ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
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
    <div className="text-center p-8">
      <h2 className="font-display text-4xl text-amber-400 mb-6">Pass to {playerName}</h2>
      <p className="text-gray-400 mb-8 text-lg">Hand the device to {playerName}</p>
      <button
        onClick={onReady}
        className="px-12 py-6 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold text-xl shadow-lg hover:from-emerald-500 hover:to-emerald-400 transition-all transform hover:scale-105"
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
  onNextRound: () => void;
  rollover: boolean;
}

const WinnerScreen = ({ winner, pot, players, onNextRound, rollover }: WinnerScreenProps) => (
  <div className="fixed inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-50">
    <div className="text-center p-8 max-w-md">
      {rollover ? (
        <>
          <h2 className="font-display text-4xl text-purple-400 mb-4">The Board was the best Kicker!</h2>
          <p className="text-3xl text-amber-400 mb-8">${pot} rolls over to next round</p>
        </>
      ) : (
        <>
          <h2 className="font-display text-4xl text-amber-400 mb-4">
            {winner.isSplit ? `${winner.name} were the best Kickers!` : `${winner.name} was the best Kicker!`}
          </h2>
          <p className="text-lg text-gray-400 mb-2">{winner.reason}</p>
          <p className="text-3xl text-emerald-400 mb-8">${pot} pot</p>
        </>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        {players.map((p, i) => (
          <div key={i} className={`p-4 rounded-lg ${p.folded ? 'bg-gray-800 opacity-50' : 'bg-gray-800'}`}>
            <div className="font-semibold text-white mb-2">{p.name}</div>
            <div className="flex justify-center">
              <Card card={p.card} small />
            </div>
            <div className="mt-2 text-emerald-400">${p.chips}</div>
            {p.folded && <div className="text-red-400 text-sm">Folded</div>}
          </div>
        ))}
      </div>

      <button
        onClick={onNextRound}
        className="px-12 py-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 rounded-xl font-bold text-xl shadow-lg hover:from-amber-400 hover:to-yellow-300 transition-all transform hover:scale-105"
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
    { name: 'Player 1', chips: 50, card: null, revealed: false, folded: false, peekedCards: [], currentBet: 0 },
    { name: 'Player 2', chips: 50, card: null, revealed: false, folded: false, peekedCards: [], currentBet: 0 },
    { name: 'Player 3', chips: 50, card: null, revealed: false, folded: false, peekedCards: [], currentBet: 0 },
    { name: 'Player 4', chips: 50, card: null, revealed: false, folded: false, peekedCards: [], currentBet: 0 },
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
  const [lastRaiser, setLastRaiser] = useState(-1);
  const [bettingRoundStarter, setBettingRoundStarter] = useState(0);
  const [dealer, setDealer] = useState(0);
  const [revealOrder, setRevealOrder] = useState<number[]>([]);

  const isAI = (name: string) => name.toLowerCase() === 'ai';

  const AI_NAMES = [
    'Alex', 'Sam', 'Jordan', 'Taylor', 'Casey',
    'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake',
    'Charlie', 'Drew', 'Frankie', 'Jamie', 'Jesse',
    'Kelly', 'Logan', 'Max', 'Peyton', 'Reese'
  ];

  const getRandomAIName = (usedNames: string[]): string => {
    const available = AI_NAMES.filter(n => !usedNames.includes(n));
    if (available.length === 0) return AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
    return available[Math.floor(Math.random() * available.length)];
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

    // Assign random names to AI players
    const usedAINames: string[] = [];
    const newPlayers = players.map((p, i) => {
      const isAIPlayer = isAI(playerNames[i]);
      let name = playerNames[i];
      if (isAIPlayer) {
        name = getRandomAIName(usedAINames);
        usedAINames.push(name);
      }
      return {
        ...p,
        name,
        card: newDeck.pop()!,
        revealed: false,
        folded: false,
        peekedCards: [],
        currentBet: 0,
        aiLevel: isAIPlayer ? getRandomAILevel() : undefined,
      };
    });

    const antePlayers = newPlayers.map(p => ({ ...p, chips: p.chips - 1 }));

    const firstToAct = (dealer + 1) % 4;

    setDeck(newDeck);
    setCommunalCard(communal);
    setPlayers(antePlayers);
    setPot(4 + rolloverPot);
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

  const getActivePlayers = () => players.filter(p => !p.folded);

  const findNextActivePlayer = (fromIndex: number) => {
    let next = (fromIndex + 1) % 4;
    let attempts = 0;
    while (players[next].folded && attempts < 4) {
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

    // Get revealed cards that are higher than mine
    const revealedHigherCards = players.filter(
      p => p.revealed && !p.folded && p.card && p.card.value > myCard.value
    );

    // Check if board is higher than my card
    const boardHigher = communalCard && communalCard.value > myCard.value;

    // Check if I pair with the board
    const pairsWithBoard = communalCard && communalCard.value === myCard.value;

    if (aiLevel === 'cautious') {
      // Folds when a higher card is revealed or board is higher
      if (revealedHigherCards.length > 0 || boardHigher) {
        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
      }
      // Otherwise just call or check
      if (canCheck) return { action: 'check' };
      if (toCall > 0) return { action: 'call' };
      return { action: 'bet', amount: 1 };
    }

    if (aiLevel === 'random') {
      // 30% chance to fold if there's a bet (unless pairs with board)
      if (!pairsWithBoard && toCall > 0 && Math.random() < 0.3) {
        return { action: 'fold' };
      }
      // 20% chance to bet/raise
      if (Math.random() < 0.2) {
        const amount = Math.floor(Math.random() * 3) + 1;
        if (canCheck) return { action: 'bet', amount };
        return { action: 'raise', amount };
      }
      // Otherwise call or check
      if (canCheck) return { action: 'check' };
      return { action: 'call' };
    }

    if (aiLevel === 'aggressive') {
      // Never folds, often bets/raises
      if (pairsWithBoard) {
        // Always raise big with board pair
        const amount = 3;
        if (canCheck) return { action: 'bet', amount };
        return { action: 'raise', amount };
      }
      // 50% chance to bet/raise
      if (Math.random() < 0.5) {
        const amount = Math.floor(Math.random() * 2) + 1;
        if (canCheck) return { action: 'bet', amount };
        return { action: 'raise', amount };
      }
      // Otherwise call or check
      if (canCheck) return { action: 'check' };
      return { action: 'call' };
    }

    // Default fallback
    if (canCheck) return { action: 'check' };
    return { action: 'call' };
  };

  const determineWinner = (): Winner => {
    const activePlayers = getActivePlayers();

    if (activePlayers.length === 1) {
      return {
        name: activePlayers[0].name,
        isSplit: false,
        reason: 'Last player standing',
        rollover: false
      };
    }

    const boardValue = communalCard!.value;

    const boardPairPlayers = activePlayers.filter(p => p.card!.value === boardValue);

    if (boardPairPlayers.length > 0) {
      if (boardPairPlayers.length === 1) {
        return {
          name: boardPairPlayers[0].name,
          isSplit: false,
          reason: `Paired with board (${communalCard!.rank})`,
          rollover: false
        };
      } else {
        return {
          name: boardPairPlayers.map(p => p.name).join(' & '),
          isSplit: true,
          players: boardPairPlayers,
          reason: `Both paired with board (${communalCard!.rank})`,
          rollover: false
        };
      }
    }

    const pairs: { value: number; players: Player[] }[] = [];

    for (let i = 0; i < activePlayers.length; i++) {
      for (let j = i + 1; j < activePlayers.length; j++) {
        if (activePlayers[i].card!.value === activePlayers[j].card!.value) {
          pairs.push({
            value: activePlayers[i].card!.value,
            players: [activePlayers[i], activePlayers[j]]
          });
        }
      }
    }

    if (pairs.length > 0) {
      const highestPairValue = Math.max(...pairs.map(p => p.value));
      const highestPairs = pairs.filter(p => p.value === highestPairValue);

      const pairPlayers = highestPairs.flatMap(p => p.players);
      const uniquePairPlayers = [...new Map(pairPlayers.map(p => [p.name, p])).values()];

      return {
        name: uniquePairPlayers.map(p => p.name).join(' & '),
        isSplit: true,
        players: uniquePairPlayers,
        reason: `Pair of ${uniquePairPlayers[0].card!.rank}s`,
        rollover: false
      };
    }

    const allCardValues = [boardValue, ...activePlayers.map(p => p.card!.value)];
    const highestValue = Math.max(...allCardValues);

    if (boardValue === highestValue) {
      return {
        name: 'Board',
        isSplit: false,
        reason: `Board ${communalCard!.rank} is highest`,
        rollover: true
      };
    }

    const highCardPlayers = activePlayers.filter(p => p.card!.value === highestValue);

    if (highCardPlayers.length === 1) {
      return {
        name: highCardPlayers[0].name,
        isSplit: false,
        reason: `Highest card (${highCardPlayers[0].card!.rank})`,
        rollover: false
      };
    } else {
      return {
        name: highCardPlayers.map(p => p.name).join(' & '),
        isSplit: true,
        players: highCardPlayers,
        reason: `Tied high card (${highCardPlayers[0].card!.rank})`,
        rollover: false
      };
    }
  };

  const endRound = (finalPot?: number, finalPlayers?: Player[]) => {
    const playersToUse = finalPlayers || players;
    const potToUse = finalPot !== undefined ? finalPot : pot;
    const winnerResult = determineWinner();

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
    const activePlayers = playersToUse.filter(p => !p.folded);
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
    const toCall = currentBetAmount - player.currentBet;
    // Always create a fresh copy to preserve all state including revealed
    let newPlayers = players.map(p => ({ ...p }));

    if (action === 'bet') {
      newPlayers = newPlayers.map((p, i) =>
        i === currentPlayer ? { ...p, chips: p.chips - amount, currentBet: p.currentBet + amount } : p
      );
      newPot = pot + amount;
      setCurrentBetAmount(amount);
      setLastRaiser(currentPlayer);
      setMessage(`${player.name} bet $${amount}`);
      advanceToNextPlayer(newPlayers, newPot, currentPlayer, amount);
      return;
    } else if (action === 'call') {
      newPlayers = newPlayers.map((p, i) =>
        i === currentPlayer ? { ...p, chips: p.chips - toCall, currentBet: currentBetAmount } : p
      );
      newPot = pot + toCall;
      setMessage(`${player.name} called $${toCall}`);
    } else if (action === 'raise') {
      const totalCost = toCall + amount;
      const newBetAmount = currentBetAmount + amount;
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
    const resetPlayers = players.map(p => ({
      ...p,
      card: null,
      revealed: false,
      folded: false,
      peekedCards: [],
      currentBet: 0,
    }));
    setPlayers(resetPlayers);
    setDealer((dealer + 1) % 4);
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

  // AI auto-play effect
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'passing') return;
    if (!currentPlayerData?.aiLevel) return;
    if (winner) return;

    // Auto-skip pass screen for AI
    if (showPassScreen && gameState === 'passing') {
      const timer = setTimeout(() => {
        handleReady();
      }, 500);
      return () => clearTimeout(timer);
    }

    // Make AI decision when it's their turn to play
    if (gameState === 'playing' && !showPassScreen) {
      const timer = setTimeout(() => {
        const decision = makeAIDecision(currentPlayerData);
        handleAction(decision.action, decision.amount || 0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentPlayer, showPassScreen, currentPlayerData?.aiLevel, winner]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 text-white p-4 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+Pro:wght@400;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'Source Sans Pro', sans-serif; }
      `}</style>

      {showPassScreen && (
        <PassScreen playerName={players[currentPlayer].name} onReady={handleReady} />
      )}

      {winner && (
        <WinnerScreen
          winner={winner}
          pot={pot}
          players={players}
          onNextRound={handleNextRound}
          rollover={isRollover}
        />
      )}

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="font-display text-4xl bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
            KICKER
          </h1>
          {rolloverPot > 0 && gameState === 'setup' && (
            <div className="text-purple-400 font-bold mt-1">+${rolloverPot} rollover in pot!</div>
          )}
        </div>

        {gameState === 'setup' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-900/80 rounded-xl">
              <h3 className="font-semibold text-amber-400 mb-3">Player Names</h3>
              <div className="grid grid-cols-2 gap-3">
                {playerNames.map((name, i) => (
                  <div key={i} className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newNames = [...playerNames];
                        newNames[i] = e.target.value;
                        setPlayerNames(newNames);
                      }}
                      onFocus={(e) => {
                        if (name === `Player ${i + 1}`) {
                          const newNames = [...playerNames];
                          newNames[i] = '';
                          setPlayerNames(newNames);
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
                      className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white ${i === dealer ? 'border-amber-400' : 'border-gray-700'}`}
                      placeholder={`Player ${i + 1}`}
                    />
                    {isAI(name) && (
                      <span className="absolute -top-2 -left-2 bg-cyan-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                    {i === dealer && (
                      <span className="absolute -top-2 -right-2 bg-amber-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        DEALER
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center text-sm text-gray-400">
                {playerNames[dealer]} is the dealer
              </div>
              <div className="mt-2 text-center text-xs text-cyan-400">
                Type "AI" for computer players
              </div>
            </div>

            {players[0].chips !== 50 && (
              <div className="p-4 bg-gray-900/80 rounded-xl">
                <h3 className="font-semibold text-amber-400 mb-2">Chip Counts</h3>
                <div className="grid grid-cols-4 gap-2">
                  {players.map((p, i) => (
                    <div key={i} className={`text-center ${i === dealer ? 'ring-2 ring-amber-400 rounded-lg p-1' : ''}`}>
                      <div className="text-sm text-gray-400">
                        {playerNames[i]}
                      </div>
                      <div className="text-emerald-400 font-bold">${p.chips}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={dealCards}
              className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 rounded-xl font-bold text-lg shadow-lg hover:from-amber-400 hover:to-yellow-300 transition-all"
            >
              Deal Cards {rolloverPot > 0 && `(+$${rolloverPot} rollover)`}
            </button>

            <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
              <h3 className="font-display text-lg text-amber-400 mb-2">How to Win</h3>
              <ul className="text-sm text-gray-400 space-y-1 font-body">
                <li><span className="text-yellow-400">Pair with board</span> = Best hand</li>
                <li><span className="text-blue-400">Pair with another player</span> = Second best</li>
                <li><span className="text-gray-300">Highest card</span> = Third best</li>
                <li><span className="text-purple-400">Board is highest?</span> = Pot rolls over!</li>
                <li>Ties broken by kicker, else split pot</li>
              </ul>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Game Info */}
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-900/80 rounded-xl border border-emerald-800">
              <div className="text-center">
                <div className="text-xs text-gray-400">Pot</div>
                <div className="text-xl font-bold text-amber-400">${pot}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Current Bet</div>
                <div className="text-xl font-bold text-red-400">${currentBetAmount}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">To Call</div>
                <div className="text-xl font-bold text-blue-400">${toCall}</div>
              </div>
            </div>

            <div className="text-center mb-3 text-sm text-gray-300">{message}</div>

            {/* Current Player Actions */}
            <div className="p-4 bg-amber-900/40 rounded-xl border-2 border-amber-400 mb-4">
              <div className="text-center mb-3">
                <span className="text-amber-400 font-bold text-xl">{currentPlayerData.name}'s Turn</span>
                {currentPlayerData.aiLevel && (
                  <span className="text-cyan-400 ml-2 text-sm">({currentPlayerData.aiLevel} AI)</span>
                )}
                {currentPlayerData.currentBet > 0 && (
                  <span className="text-gray-400 ml-2">(bet: ${currentPlayerData.currentBet})</span>
                )}
              </div>

              {/* AI Thinking Indicator */}
              {currentPlayerData.aiLevel && (
                <div className="text-center py-8">
                  <div className="text-cyan-400 text-lg animate-pulse">AI is thinking...</div>
                </div>
              )}

              {/* Human Player Controls */}
              {!currentPlayerData.aiLevel && (
                <>
                  {/* Peeked Cards */}
                  {currentPlayerData.peekedCards.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 mb-1 text-center">Your Peeked Cards</div>
                      <div className="flex gap-2 justify-center">
                        {currentPlayerData.peekedCards.map((card, i) => (
                          <Card key={i} card={card} small />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                {canBet && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1 text-center">Bet</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => handleAction('bet', 1)} className="px-3 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors">
                        Bet $1
                      </button>
                      <button onClick={() => handleAction('bet', 2)} className="px-3 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors">
                        Bet $2
                      </button>
                      <button onClick={() => handleAction('bet', 3)} className="px-3 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors">
                        Bet $3
                      </button>
                    </div>
                  </div>
                )}

                {canCall && (
                  <button
                    onClick={() => handleAction('call')}
                    className="w-full px-3 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
                  >
                    Call ${toCall}
                  </button>
                )}

                {canRaise && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1 text-center">Raise (call ${toCall} + raise)</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAction('raise', 1)}
                        className="px-3 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold transition-colors"
                      >
                        +$1 (${toCall + 1})
                      </button>
                      <button
                        onClick={() => handleAction('raise', 2)}
                        className="px-3 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold transition-colors"
                      >
                        +$2 (${toCall + 2})
                      </button>
                      <button
                        onClick={() => handleAction('raise', 3)}
                        className="px-3 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold transition-colors"
                      >
                        +$3 (${toCall + 3})
                      </button>
                    </div>
                  </div>
                )}

                <div className={`grid ${canCheck ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  <button
                    onClick={() => handleAction('peek')}
                    className="px-3 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors"
                  >
                    Peek $1
                  </button>
                  {canCheck && (
                    <button
                      onClick={() => handleAction('check')}
                      className="px-3 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold transition-colors"
                    >
                      Check
                    </button>
                  )}
                  <button
                    onClick={() => handleAction('fold')}
                    className="px-3 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors"
                  >
                    Fold
                  </button>
                  </div>
                </div>
              </>
              )}
            </div>

            {/* Board + Active Player's Card */}
            <div className="p-4 bg-gray-900/60 rounded-xl mb-4">
              <div className="flex justify-center items-end gap-6">
                {/* Board Card */}
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">Board</div>
                  <Card card={communalCard} highlight={boardHighest} />
                  {boardHighest && (
                    <div className="text-purple-400 text-xs mt-1">HIGH</div>
                  )}
                </div>

                {/* Active Player's Card */}
                <div className="text-center">
                  <div className="text-xs text-amber-400 font-bold mb-1">{currentPlayerData.name}</div>
                  <Card
                    card={currentPlayerData.card}
                    highlight={currentPlayerData.card?.value === communalCard?.value}
                  />
                  {currentPlayerData.card?.value === communalCard?.value && (
                    <div className="text-yellow-400 text-xs mt-1">PAIRS!</div>
                  )}
                </div>
              </div>
            </div>

            {/* All Players - shows what everyone knows */}
            <div className="p-3 bg-gray-900/40 rounded-xl mb-4">
              <div className="text-xs text-gray-500 text-center mb-2">Revealed Cards</div>
              <div className="flex justify-center gap-4">
                {players.map((p, idx) => {
                  const isCurrentTurn = idx === currentPlayer;
                  const pairsBoard = p.card?.value === communalCard?.value;

                  return (
                    <div key={idx} className={`text-center ${p.folded ? 'opacity-40' : ''}`}>
                      <div className={`text-xs mb-1 ${isCurrentTurn ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                        {p.name}
                        {idx === dealer && ' (D)'}
                        {p.folded && ' X'}
                      </div>
                      <div className={`inline-block ${p.revealed ? 'ring-2 ring-cyan-400 rounded-lg p-1' : ''}`}>
                        <Card
                          card={p.card}
                          small
                          faceDown={!p.revealed}
                          highlight={p.revealed && pairsBoard}
                        />
                      </div>
                      {p.revealed && pairsBoard && (
                        <div className="text-yellow-400 text-xs mt-1">PAIRS!</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Bets */}
            {players.some(p => p.currentBet > 0) && (
              <div className="flex justify-center gap-3 text-xs">
                {players.map((p, i) => p.currentBet > 0 && (
                  <div key={i} className="text-gray-400">
                    {i === currentPlayer ? 'You' : p.name}: <span className="text-red-400">${p.currentBet}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
