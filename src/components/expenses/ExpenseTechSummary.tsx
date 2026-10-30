import React from 'react';
import { type ExpenseRow } from '../../lib/supabase';
import { Users, Banknote, Fuel, Wrench, Building } from 'lucide-react';

interface ExpenseTechSummaryProps {
    expenses: ExpenseRow[];
    technicians: Array<{ id: string; full_name: string }>;
}

export const ExpenseTechSummary: React.FC<ExpenseTechSummaryProps> = ({ expenses, technicians }) => {
    // Calcul de synthèse par centre de coût (Chaque technicien + Société)
    const summaries = React.useMemo(() => {
        // Société (dépenses sans technicien)
        const companyExpenses = expenses.filter(e => !e.technician_id);
        const companyTotal = companyExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
        const companyFuel = companyExpenses.filter(e => e.vehicle_id || e.category?.name?.toLowerCase().includes('carburant')).reduce((s, e) => s + Number(e.amount || 0), 0);
        const companyEquipment = companyExpenses.filter(e => e.category?.name?.toLowerCase().includes('outillage') || e.category?.name?.toLowerCase().includes('pièce')).reduce((s, e) => s + Number(e.amount || 0), 0);

        const list = [
            {
                id: 'company',
                name: 'Entreprise & Siège (Frais Généraux)',
                isCompany: true,
                count: companyExpenses.length,
                fuelTotal: companyFuel,
                equipmentTotal: companyEquipment,
                cashDeducted: 0,
                total: companyTotal
            }
        ];

        // Pour chaque technicien
        technicians.forEach(t => {
            const techExps = expenses.filter(e => e.technician_id === t.id);
            const total = techExps.reduce((s, e) => s + Number(e.amount || 0), 0);
            const fuel = techExps.filter(e => e.vehicle_id || e.category?.name?.toLowerCase().includes('carburant')).reduce((s, e) => s + Number(e.amount || 0), 0);
            const equip = techExps.filter(e => e.category?.name?.toLowerCase().includes('outillage') || e.category?.name?.toLowerCase().includes('pièce')).reduce((s, e) => s + Number(e.amount || 0), 0);
            const cash = techExps.filter(e => e.payment_method === 'cash_technician').reduce((s, e) => s + Number(e.amount || 0), 0);

            list.push({
                id: t.id,
                name: t.full_name,
                isCompany: false,
                count: techExps.length,
                fuelTotal: fuel,
                equipmentTotal: equip,
                cashDeducted: cash,
                total
            });
        });

        // Tri par total décroissant
        return list.sort((a, b) => b.total - a.total);
    }, [expenses, technicians]);

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {summaries.map(item => (
                    <div 
                        key={item.id}
                        className="card-bento p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
                    >
                        {/* En-tête de la carte */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                    item.isCompany 
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                                }`}>
                                    {item.isCompany ? <Building size={20} /> : <Users size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs font-semibold text-slate-500">
                                        {item.count} dépense{item.count > 1 ? 's' : ''} sur la période
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {item.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <span className="text-xs font-bold text-slate-500 ml-1">DT</span>
                                </div>
                            </div>
                        </div>

                        {/* Ventilation des postes */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                            {/* Carburant */}
                            <div className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
                                <span className="text-xs font-black uppercase text-teal-700 dark:text-teal-400 flex items-center justify-center gap-1 mb-0.5">
                                    <Fuel size={12} /> Carburant
                                </span>
                                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                                    {item.fuelTotal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} DT
                                </span>
                            </div>

                            {/* Outillage */}
                            <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1 mb-0.5">
                                    <Wrench size={12} /> Outillage
                                </span>
                                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                                    {item.equipmentTotal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} DT
                                </span>
                            </div>

                            {/* Déduit Caisse */}
                            <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1 mb-0.5">
                                    <Banknote size={12} /> Caisse Esp.
                                </span>
                                <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                                    {item.cashDeducted.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} DT
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpenseTechSummary;

