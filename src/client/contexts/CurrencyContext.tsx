import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, getUserCurrency, setUserCurrency } from '../utils/currencyConversion';

interface CurrencyContextType {
  userCurrency: Currency;
  setUserCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [userCurrency, setUserCurrencyState] = useState<Currency>('USDC');

  // Initialize user currency from localStorage
  useEffect(() => {
    const savedCurrency = getUserCurrency();
    setUserCurrencyState(savedCurrency);
  }, []);

  const handleSetUserCurrency = (currency: Currency) => {
    setUserCurrencyState(currency);
    setUserCurrency(currency);
  };

  return (
    <CurrencyContext.Provider value={{ userCurrency, setUserCurrency: handleSetUserCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
