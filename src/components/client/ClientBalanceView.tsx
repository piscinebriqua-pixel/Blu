import React from "react";
import { formatBalance } from "../../lib/formatters";
import type { Client } from "./types";

interface ClientBalanceViewProps {
  client: Client | null;
  totalIntersAmount: number;
  totalPaymentsAmount: number;
}

export const ClientBalanceView: React.FC<ClientBalanceViewProps> = ({
  client,
  totalIntersAmount,
  totalPaymentsAmount,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
            Total Interventions
          </p>
          <h4 className="text-2xl font-black text-slate-800 dark:text-white">
            -{totalIntersAmount.toFixed(0)} <span className="text-sm opacity-60">DT</span>
          </h4>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800/30 shadow-sm">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">
            Total Paiements
          </p>
          <h4 className="text-2xl font-black text-emerald-600">
            +{totalPaymentsAmount.toFixed(0)} <span className="text-sm opacity-60 text-emerald-400">DT</span>
          </h4>
        </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/20 text-center">
        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
          Solde Final
        </p>
        <h3 className="text-5xl font-black tracking-tighter">
          {client ? (
            <span className={formatBalance(client.balance).text}>
              {formatBalance(client.balance).amount}{" "}
              <span className="text-xl opacity-50 ml-2">{formatBalance(client.balance).unit}</span>{" "}
              {formatBalance(client.balance).label}
            </span>
          ) : (
            <span className="text-slate-500">0 DT</span>
          )}
        </h3>
      </div>
    </div>
  );
};
