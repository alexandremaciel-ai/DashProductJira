import { useState, useEffect } from 'react';
import type { CardConfigState, CardStatusConfig } from '@/types/card-config';
import { DEFAULT_CARD_CONFIG } from '@/types/card-config';

export function useCardConfig() {
  const [cardConfig, setCardConfig] = useState<CardConfigState>(DEFAULT_CARD_CONFIG);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('cardStatusConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as CardConfigState;
        setCardConfig(parsed);
      }
    } catch (error) {
      console.warn('Failed to load card configuration:', error);
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = (newConfig: CardConfigState) => {
    try {
      localStorage.setItem('cardStatusConfig', JSON.stringify(newConfig));
      setCardConfig(newConfig);
    } catch (error) {
      console.warn('Failed to save card configuration:', error);
    }
  };

  // Update specific card configuration
  const updateCardConfig = (cardId: string, config: CardStatusConfig) => {
    const newConfig = {
      ...cardConfig,
      [cardId]: config
    };
    saveConfig(newConfig);
  };

  // Reset to default configuration
  const resetToDefault = () => {
    saveConfig(DEFAULT_CARD_CONFIG);
  };

  return {
    cardConfig,
    updateCardConfig,
    resetToDefault
  };
}