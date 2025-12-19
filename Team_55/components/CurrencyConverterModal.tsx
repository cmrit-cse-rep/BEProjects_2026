import { useState, useEffect } from 'react';
import { FiX, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency?: string;
  destination?: string;
}

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
];

const DESTINATION_CURRENCY_MAP: { [key: string]: string } = {
  'united states': 'USD',
  'usa': 'USD',
  'europe': 'EUR',
  'uk': 'GBP',
  'united kingdom': 'GBP',
  'japan': 'JPY',
  'australia': 'AUD',
  'canada': 'CAD',
  'switzerland': 'CHF',
  'china': 'CNY',
  'india': 'INR',
  'singapore': 'SGD',
  'mexico': 'MXN',
  'brazil': 'BRL',
};

export default function CurrencyConverterModal({ 
  isOpen, 
  onClose, 
  baseCurrency, 
  destination 
}: CurrencyConverterModalProps) {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>(baseCurrency || 'INR');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auto-detect destination currency
  useEffect(() => {
    if (destination) {
      const destLower = destination.toLowerCase();
      const matchedCurrency = Object.keys(DESTINATION_CURRENCY_MAP).find(
        key => destLower.includes(key)
      );
      if (matchedCurrency) {
        setToCurrency(DESTINATION_CURRENCY_MAP[matchedCurrency]);
      }
    }
  }, [destination]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const fetchExchangeRate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/currency/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setConvertedAmount(data.convertedAmount);
        setExchangeRate(data.rate);
        setLastUpdated(new Date());
      } else {
        toast.error(data.message || 'Failed to fetch exchange rate');
      }
    } catch (error: any) {
      console.error('Currency conversion error:', error);
      toast.error('Failed to convert currency. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && parseFloat(value) > 0) {
      const debounceTimer = setTimeout(() => {
        fetchExchangeRate();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const getCurrencySymbol = (code: string) => {
    return COMMON_CURRENCIES.find(c => c.code === code)?.symbol || code;
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center">
            <FiDollarSign className="w-6 h-6 mr-2 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Currency Converter</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <FiX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              min="0"
              step="0.01"
            />
          </div>

          {/* From Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => {
                setFromCurrency(e.target.value);
                if (amount && parseFloat(amount) > 0) {
                  setTimeout(() => fetchExchangeRate(), 300);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              {COMMON_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={swapCurrencies}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
            title="Swap currencies"
          >
            <FiRefreshCw className="w-5 h-5 text-gray-600" />
          </button>

          {/* To Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <select
              value={toCurrency}
              onChange={(e) => {
                setToCurrency(e.target.value);
                if (amount && parseFloat(amount) > 0) {
                  setTimeout(() => fetchExchangeRate(), 300);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              {COMMON_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Convert Button */}
          <button
            onClick={fetchExchangeRate}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Converting...
              </div>
            ) : (
              'Convert'
            )}
          </button>

          {/* Result */}
          {convertedAmount !== null && exchangeRate !== null && (
            <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Converted Amount</p>
                <p className="text-3xl font-bold text-green-700">
                  {getCurrencySymbol(toCurrency)} {convertedAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                </p>
                {lastUpdated && (
                  <p className="text-xs text-gray-400 mt-1">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Convert Common Amounts */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-600 mb-2">Quick amounts:</p>
            <div className="flex flex-wrap gap-2">
              {[10, 50, 100, 500, 1000].map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => {
                    setAmount(quickAmount.toString());
                    setTimeout(() => fetchExchangeRate(), 300);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {getCurrencySymbol(fromCurrency)}{quickAmount}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

