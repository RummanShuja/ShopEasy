const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function formatCurrency(amount) {
  return currency.format(amount);
}
