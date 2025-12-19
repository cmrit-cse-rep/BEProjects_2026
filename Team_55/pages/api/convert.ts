import type { NextApiRequest, NextApiResponse } from 'next';

interface ExchangeRateResponse {
  success: boolean;
  convertedAmount?: number;
  rate?: number;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExchangeRateResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { from, to, amount } = req.query;

  if (!from || !to || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: from, to, amount',
    });
  }

  const fromCurrency = (from as string).toUpperCase();
  const toCurrency = (to as string).toUpperCase();
  const amountValue = parseFloat(amount as string);

  if (isNaN(amountValue) || amountValue <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount',
    });
  }

  if (fromCurrency === toCurrency) {
    return res.status(200).json({
      success: true,
      convertedAmount: amountValue,
      rate: 1,
    });
  }

  try {
    // Using exchangerate-api.io free tier (no API key required for basic usage)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();

    if (!data.rates || !data.rates[toCurrency]) {
      return res.status(400).json({
        success: false,
        message: `Currency ${toCurrency} not found in exchange rates`,
      });
    }

    const rate = data.rates[toCurrency];
    const convertedAmount = amountValue * rate;

    return res.status(200).json({
      success: true,
      convertedAmount,
      rate,
    });
  } catch (error: any) {
    console.error('Currency conversion error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert currency',
    });
  }
}

