export function centsToCurrency(amountCents: number, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amountCents / 100);
}

export const formatCurrency = centsToCurrency;
