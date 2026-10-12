import React from "react";
import { Calculator, Wallet, User } from "lucide-react";
import type { Technician, NewInterventionFormData } from "./types";
import Combobox from "../ui/Combobox";

interface PaymentSectionProps {
  totalAmount: number;
  formData: NewInterventionFormData;
  setFormData: React.Dispatch<React.SetStateAction<NewInterventionFormData>>;
  isAdmin: boolean;
  technicians: Technician[];
  amountInputRef: React.RefObject<HTMLInputElement | null>;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  totalAmount,
  formData,
  setFormData,
  isAdmin,
  technicians,
  amountInputRef,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Bloc Total Intervention Display */}
      <div className="bg-indigo-50/70 dark:bg-indigo-500/10 rounded-[2rem] p-6 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-sm">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400 mb-1">
            Total de l'intervention
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter text-indigo-950 dark:text-indigo-50 leading-none">
              {totalAmount.toFixed(0)}
            </span>
            <span className="text-xl font-black text-indigo-400 dark:text-indigo-400">DT</span>
          </div>
        </div>
        <div className="w-16 h-16 bg-white dark:bg-indigo-950 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/30 shadow-sm group-hover:scale-105 transition-transform">
          <Calculator size={28} className="text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      {/* 2. Bloc Détails Règlement */}
      <div className="bg-white dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/10 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Toggle Enable Payment */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
              Statut Règlement
            </label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, record_payment: !prev.record_payment }))}
              className={`min-h-[52px] flex items-center justify-between w-full p-4 rounded-2xl border transition-all duration-300 ${
                formData.record_payment
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300"
                  : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    formData.record_payment
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  <Wallet size={18} />
                </div>
                <span className="text-sm font-black uppercase tracking-wider">
                  Encaisser le paiement
                </span>
              </div>
              <div
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                  formData.record_payment ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                    formData.record_payment ? "right-1" : "left-1"
                  }`}
                />
              </div>
            </button>
          </div>

          {formData.record_payment && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Date d'encaissement (Admin) */}
              {isAdmin && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    Date d'encaissement
                  </label>
                  <input
                    type="date"
                    title="Date d'encaissement"
                    className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-5 font-black text-base uppercase tracking-wider text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all cursor-pointer"
                    value={formData.payment_date || formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>
              )}

              {/* Technicien Récepteur (Admin) */}
              {isAdmin && (
                <div className="space-y-2">
                  <Combobox
                    label="Technicien Récepteur"
                    icon={User}
                    placeholder="Sélectionner..."
                    options={technicians.map((t) => ({ label: t.full_name, value: t.id }))}
                    value={formData.payment_technician_id || formData.technician_id}
                    onChange={(val) => setFormData({ ...formData, payment_technician_id: val })}
                  />
                </div>
              )}

              {/* Montant Reçu */}
              <div className="space-y-2">
                <div className="bg-violet-50/70 dark:bg-violet-500/10 rounded-[2rem] p-6 border border-violet-200 dark:border-violet-500/20 flex items-center justify-between group hover:border-violet-500/30 transition-all shadow-sm">
                  <div className="flex flex-col flex-1">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-violet-600 dark:text-violet-400 mb-2">
                      Montant Reçu / Encaissé
                    </span>
                    <div className="flex items-baseline gap-3">
                      <input
                        ref={amountInputRef as any}
                        type="number"
                        title="Montant encaissé"
                        placeholder="0"
                        className="bg-transparent border-none outline-none font-black tracking-tighter text-violet-950 dark:text-white p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-48 text-5xl"
                        value={formData.payment_amount}
                        onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                        onFocus={(e) => e.target.select()}
                      />
                      <span className="text-xl font-black text-violet-400 dark:text-violet-400 select-none">
                        DT
                      </span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-white dark:bg-violet-950 rounded-2xl flex items-center justify-center border border-violet-100 dark:border-violet-500/30 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                    <Wallet size={28} className="text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </div>

              {/* Mode de règlement */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  Mode de règlement
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["espèces", "chèque", "virement"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: method })}
                      className={`min-h-[48px] py-3.5 px-2 rounded-2xl text-xs font-black uppercase tracking-wider border-2 transition-all active:scale-95 ${
                        formData.payment_method === method
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md scale-102"
                          : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
