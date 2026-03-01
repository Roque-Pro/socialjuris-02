import { useApp } from '../store';
import { useState } from 'react';

export const useClickLimit = () => {
  const { clicksUsed, clicksLimit, recordClick } = useApp();
  const [showLimitModal, setShowLimitModal] = useState(false);

  const canClick = (): boolean => {
    return clicksUsed < clicksLimit;
  };

  const handleClick = (): boolean => {
    if (!canClick()) {
      setShowLimitModal(true);
      return false;
    }
    recordClick();
    return true;
  };

  return {
    canClick,
    handleClick,
    showLimitModal,
    setShowLimitModal,
    clicksUsed,
    clicksLimit
  };
};
