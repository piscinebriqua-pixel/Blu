/**
 * Centralized formatting for client balances
 * Negative balance = Credit (Emerald)
 * Positive balance = Debt (Rose)
 */
export const formatBalance = (balance: number) => {
    const absValue = Math.abs(balance || 0).toFixed(0);
    
    if (!balance || balance === 0) {
        return {
            amount: "0",
            unit: "DT",
            label: "À jour",
            full: "0 DT",
            color: "slate",
            bg: "bg-slate-50 dark:bg-slate-900/30",
            text: "text-slate-500 dark:text-slate-400",
            border: "border-slate-100 dark:border-slate-800"
        };
    }

    if (balance < 0) {
        return {
            amount: absValue,
            unit: "DT",
            label: "Credit",
            full: `${absValue} DT Credit`,
            color: "rose",
            bg: "bg-rose-50 dark:bg-rose-900/30",
            text: "text-rose-500 dark:text-rose-400",
            border: "border-rose-100 dark:border-rose-800"
        };
    }

    return {
        amount: absValue,
        unit: "DT",
        label: "Avance",
        full: `${absValue} DT Avance`,
        color: "emerald",
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
        text: "text-emerald-500 dark:text-emerald-400",
        border: "border-emerald-100 dark:border-emerald-800"
    };
};
