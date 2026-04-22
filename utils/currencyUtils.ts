
/**
 * Professional Currency Formatter for POS System
 * Supports Iraqi Dinar (IQD) and US Dollar (USD) with professional business logic.
 */

export const formatCurrency = (amount: number, currencySymbol: string): string => {
    // Handle Iraqi Dinar (IQD)
    if (currencySymbol === 'د.ع' || currencySymbol === 'IQD') {
        // Professional Iraqi Dinar logic: 
        // In the local market, prices are often entered in units of thousands (e.g., 5 means 5,000).
        // The user explicitly requested to add three zeros to represent the value in thousands.
        const displayAmount = amount * 1000;

        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.round(displayAmount));

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
        // Since base amount is in thousands, 1000 units = 1,000,000 (Million)
        if (amount >= 1000) {
            return (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1) + ' مليون د.ع';
        }
    }
    return formatCurrency(amount, currencySymbol);
};
