
/**
 * Professional Currency Formatter for POS System
 * Supports Iraqi Dinar (IQD) and US Dollar (USD) with professional business logic.
 */

export const formatCurrency = (amount: number, currencySymbol: string): string => {
    // Handle Iraqi Dinar (IQD)
    if (currencySymbol === 'د.ع' || currencySymbol === 'IQD') {
        // IQD typically doesn't have decimals in commercial transactions
        // We use thousand separators for high values (e.g. 150,000)
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.round(amount));

        return `${formatted} د.ع`;
    }

    // Handle US Dollar (USD)
    if (currencySymbol === '$' || currencySymbol === 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    }

    // Default Fallback
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + ' ' + currencySymbol;
};

/**
 * Simplified display for Iraqi Dinar often used in reports (e.g. 25k instead of 25000)
 * Only if requested or preferred for UI compactness.
 */
export const formatCompactCurrency = (amount: number, currencySymbol: string): string => {
    if (currencySymbol === 'د.ع' || currencySymbol === 'IQD') {
        if (amount >= 1000) {
            return (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1) + ' ألف د.ع';
        }
    }
    return formatCurrency(amount, currencySymbol);
};
