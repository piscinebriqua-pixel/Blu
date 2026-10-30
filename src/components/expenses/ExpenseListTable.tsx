import React from 'react';
import { type ExpenseRow } from '../../lib/supabase';
import { 
    Edit2, 
    Trash2, 
    CreditCard, 
    Banknote, 
    Building2, 
    FileText, 
    Receipt, 
    Plus, 
    Fuel, 
    Wrench, 
    Package, 
    Coffee, 
    Truck, 
    Eye,
    UserCheck,
    Building
} from 'lucide-react';

interface ExpenseListTableProps {
    expenses: ExpenseRow[];
    onEdit: (expense: ExpenseRow) => void;
    onDelete: (expense: ExpenseRow) => void;
    onViewReceipt: (url: string) => void;
    onAddNew: () => void;
}

const getPaymentBadge = (method: string) => {
    switch (method) {
        case 'cash_technician':
            return { label: 'Caisse Tech', icon: Banknote, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' };
        case 'company_card':
            return { label: 'Carte Pro', icon: CreditCard, bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' };
        case 'company_transfer':
            return { label: 'Virement', icon: Building2, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300' };
        case 'cash_company':
            return { label: 'Caisse Bureau', icon: Banknote, bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' };
        case 'check':
            return { label: 'Chèque', icon: FileText, bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' };
        default:
            return { label: method, icon: CreditCard, bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
};

const getCategoryIcon = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('carburant') || n.includes('essence') || n.includes('fuel')) return Fuel;
    if (n.includes('outillage') || n.includes('pièce') || n.includes('pompe')) return Wrench;
    if (n.includes('produit') || n.includes('chimique')) return Package;
    if (n.includes('repas') || n.includes('café')) return Coffee;
    if (n.includes('véhicule') || n.includes('camion')) return Truck;
    return Receipt;
};

export const ExpenseListTable: React.FC<ExpenseListTableProps> = ({
    expenses,
    onEdit,
    onDelete,
    onViewReceipt,
    onAddNew
}) => {
    // RÈGLE BLU : Empty State Compact CTA (Solution A Haute Densité)
    if (expenses.length === 0) {
        return (
            <button
                type="button"
                onClick={onAddNew}
                className="w-full min-h-[52px] p-2.5 px-4 rounded-2xl border-2 border-dashed border-slate-200/90 hover:border-blue-500/80 dark:border-slate-700 dark:hover:border-blue-500/80 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Receipt size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                            Aucune dépense trouvée
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                            Touchez ici pour ajouter une nouvelle dépense
                        </div>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:bg-blue-700 shadow-sm">
                    <Plus size={16} strokeWidth={2.5} />
                </div>
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {expenses.map((expense) => {
                const CatIcon = getCategoryIcon(expense.category?.name);
                const paymentBadge = getPaymentBadge(expense.payment_method);
                const PaymentIcon = paymentBadge.icon;
                const formattedDate = expense.expense_date
                    ? new Date(expense.expense_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Date inconnue';

                return (
                    <div
                        key={expense.id}
                        className="card-bento p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                        {/* Partie Gauche : Catégorie, Date, Fournisseur, Description */}
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <CatIcon size={20} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                        {expense.category?.name || 'Général'}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        • {formattedDate}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${paymentBadge.bg}`}>
                                        <PaymentIcon size={12} />
                                        {paymentBadge.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-base font-black text-slate-900 dark:text-white truncate">
                                        {expense.supplier || expense.description || 'Dépense diverse'}
                                    </span>
                                </div>

                                {/* Ligne de sous-informations : Technicien / Client / Véhicule */}
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-semibold text-slate-500">
                                    {expense.technician ? (
                                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                            <UserCheck size={14} />
                                            {expense.technician.full_name}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-slate-500">
                                            <Building size={14} />
                                            Société
                                        </span>
                                    )}

                                    {expense.vehicle && (
                                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                                            <Truck size={14} />
                                            {expense.vehicle.name} {expense.liters ? `(${expense.liters} L)` : ''}
                                        </span>
                                    )}

                                    {expense.client && (
                                        <span className="text-slate-500">
                                            📍 Client: {expense.client.first_name} {expense.client.last_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Partie Droite : Montant, Miniature Reçu & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                            {/* Montant */}
                            <div className="text-left sm:text-right">
                                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {Number(expense.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <span className="text-xs font-bold text-slate-500 ml-1">DT</span>
                                </div>
                            </div>

                            {/* Reçu photo */}
                            {expense.receipt_url && (
                                <button
                                    type="button"
                                    onClick={() => onViewReceipt(expense.receipt_url!)}
                                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 hover:border-blue-500 transition-all flex items-center justify-center shrink-0 group relative cursor-pointer"
                                    title="Voir le reçu"
                                >
                                    <img src={expense.receipt_url} alt="Reçu" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <Eye size={16} />
                                    </div>
                                </button>
                            )}

                            {/* Boutons d'action : min 44x44px conformité HIG */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => onEdit(expense)}
                                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                                    title="Modifier la dépense"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(expense)}
                                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                                    title="Supprimer la dépense"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ExpenseListTable;

