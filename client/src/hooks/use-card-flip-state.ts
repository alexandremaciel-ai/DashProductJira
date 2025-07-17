import { useState, useCallback } from 'react';

export function useCardFlipState() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const handleCardFlip = useCallback((cardId: string) => {
    setActiveCard(current => current === cardId ? null : cardId);
  }, []);

  const closeAllCards = useCallback(() => {
    setActiveCard(null);
  }, []);

  const isCardFlipped = useCallback((cardId: string) => {
    return activeCard === cardId;
  }, [activeCard]);

  return {
    activeCard,
    handleCardFlip,
    closeAllCards,
    isCardFlipped
  };
}