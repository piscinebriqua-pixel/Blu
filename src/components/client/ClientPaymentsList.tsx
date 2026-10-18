import React from "react";
import { Wallet, Edit2, Trash2 } from "lucide-react";

interface PaymentItem {
  id: string;
  amount: number;
  payment_date: string;
  method: string;
  technician?: { full_name: string };
}

interface ClientPaymentsListProps {
  payments: PaymentItem[];
  isAdmin: boolean;
  onEditPayment: (payment: PaymentItem) => void;
  onDeletePayment: (paymentId: string) => void;
}

export const ClientPaymentsList: React.FC<ClientPaymentsListProps> = ({
  payments,
  isAdmin,
  onEditPayment,
  onDeletePayment,
}) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
        <Wallet size={44} className="mx-auto text-slate-500 mb-3" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Aucun mouvement financier
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((pay) => (
        <div
          key={pay.id}
          className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 transition-all shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Wallet size={24} />
            </div>
            <div className="space-y-0.5">
              <p className="text-xl font-black text-emerald-600">
                +{pay.amount.toFixed(0)} <span className="text-xs opacity-70">DT</span>
              </p>
              <p className="text-xs text-slate-500 font-black uppercase tracking-wider">
                {new Date(pay.payment_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                • {pay.method}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-black text-slate-600 dark:text-slate-300 uppercase shadow-sm">
              {pay.technician?.full_name?.split(" ")[0] || "Admin"}
            </span>
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEditPayment(pay)}
                  className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-blue-200 dark:border-blue-900/30"
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePayment(pay.id);
                  }}
                  className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all border border-red-200 dark:border-red-900/30"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
