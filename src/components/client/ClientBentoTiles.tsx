import React from "react";
import {
  Wallet,
  FileText,
  TrendingUp,
  Users,
  Waves,
  Phone,
  Mail,
  MapPin,
  Plus,
  User,
  UserPlus,
  Trash2,
  Edit2,
  History as HistoryIcon,
  MessageCircle,
  CheckCircle2,
  Package,
  Receipt,
} from "lucide-react";
import { formatBalance } from "../../lib/formatters";
import type { Client, Pool, Intervention, Devis, ActiveCategory } from "./types";

type ChecklistKey =
  | "task_balai"
  | "task_lavage"
  | "task_rincage"
  | "task_test_chlore"
  | "task_test_ph"
  | "task_remplissage"
  | "task_panier_prefiltre"
  | "task_traitement"
  | "task_verif_vanne"
  | "task_temps_fonctionnement";

const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  task_balai: "Balai",
  task_lavage: "Lavage filtre",
  task_rincage: "Rinçage filtre",
  task_test_chlore: "Test chlore",
  task_test_ph: "Test pH",
  task_remplissage: "Niveau eau",
  task_panier_prefiltre: "Panier préfiltre",
  task_traitement: "Traitement",
  task_verif_vanne: "Vannes",
  task_temps_fonctionnement: "Temps filtration",
};

interface ClientBentoTilesProps {
  client: Client | null;
  pools: Pool[];
  interventions: Intervention[];
  payments: any[];
  devis: Devis[];
  clientPartners: any[];
  totalIntersAmount: number;
  totalPaymentsAmount: number;
  onSelectCategory: (cat: ActiveCategory) => void;
  onOpenWhatsApp: () => void;
  onOpenInterventionModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenDevisModal: () => void;
  onOpenInvoiceModal: () => void;
  onOpenPoolModal: () => void;
  onOpenEditClientModal: () => void;
  onOpenAssignPartner: () => void;
  onSelectPartnerToUnassign: (partner: any) => void;
  onSelectInterventionForView: (inter: Intervention) => void;
  onSelectDevisForView: (d: Devis) => void;
}

export const ClientBentoTiles: React.FC<ClientBentoTilesProps> = ({
  client,
  pools,
  interventions,
  payments,
  devis,
  clientPartners,
  totalIntersAmount,
  totalPaymentsAmount,
  onSelectCategory,
  onOpenWhatsApp,
  onOpenInterventionModal,
  onOpenPaymentModal,
  onOpenDevisModal,
  onOpenInvoiceModal,
  onOpenPoolModal,
  onOpenEditClientModal,
  onOpenAssignPartner,
  onSelectPartnerToUnassign,
  onSelectInterventionForView,
  onSelectDevisForView,
}) => {
  const balanceDifference = totalPaymentsAmount - totalIntersAmount;

  return (
    <>
      {/* 1. Bento Dashboard Grid - 5 Tuiles Supérieures */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        {/* Tuile Financière */}
        <div
          onClick={() => onSelectCategory("balance")}
          className={`card-bento cursor-pointer relative overflow-hidden transition-all duration-300 p-5 flex flex-col justify-between min-h-[160px] ${
            balanceDifference < -0.1
              ? "border-none shadow-lg fintech-card-red-luxe"
              : "border-none shadow-lg fintech-card-money-luxe"
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-white/70" />
              <p className="text-xs font-black uppercase tracking-wider text-white/70">Solde Client</p>
            </div>
            <h3 className="text-4xl font-black tracking-tighter leading-none text-white">
              {client ? formatBalance(client.balance).amount : "0"}
              <span className="text-lg font-black ml-1 uppercase text-white/50">
                {client ? formatBalance(client.balance).unit : "DT"}
              </span>
            </h3>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-wider text-white/80 mb-2">
              {client ? formatBalance(client.balance).label : "Avance"}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenWhatsApp();
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-white/20 backdrop-blur-sm w-full justify-center"
            >
              <MessageCircle size={14} className="text-green-400" />
              Envoyer Solde
            </button>
          </div>
          <div className="fintech-pattern" />
        </div>

        {/* Tuile Entretiens */}
        <div
          onClick={() => onSelectCategory("interventions")}
          className="card-bento fintech-card-dark-luxe p-5 flex flex-col justify-between min-h-[160px] group cursor-pointer shadow-xl border-none transition-all relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <FileText size={18} />
              </div>
              <span className="bg-indigo-500/20 text-indigo-200 text-xs font-black px-2 py-0.5 rounded-md border border-indigo-500/20">
                #{interventions.length}
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-tight text-white uppercase">
              Entretiens
            </h3>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-black text-indigo-300">{totalIntersAmount.toFixed(0)}</span>
              <span className="text-xs font-black text-white/50 uppercase">DT</span>
            </div>
            <p className="text-xs font-black text-white/50 uppercase tracking-wider">Cumul des travaux</p>
          </div>
          <div className="fintech-pattern" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12" />
        </div>

        {/* Tuile Paiements */}
        <div
          onClick={() => onSelectCategory("payments")}
          className="card-bento glass-morphism border-slate-200/50 dark:border-slate-800 p-5 flex flex-col justify-between min-h-[160px] group cursor-pointer shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                <TrendingUp size={18} />
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-black px-2 py-0.5 rounded-md">
                {payments.length}
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-tight text-slate-900 dark:text-white uppercase">
              Paiements
            </h3>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {totalPaymentsAmount.toFixed(0)}
              </span>
              <span className="text-xs font-black text-slate-500 uppercase">DT</span>
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mt-1">Volume Total</p>
          </div>
        </div>

        {/* Tuile Staff */}
        <div
          onClick={() => {}}
          className="card-bento glass-morphism border-slate-200/50 dark:border-slate-800 p-5 flex flex-col justify-between min-h-[160px] group cursor-pointer shadow-sm"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600">
                <Users size={18} />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Staff</p>
            </div>
            <h3 className="text-2xl font-black tracking-tighter leading-none text-slate-900 dark:text-white uppercase">
              {clientPartners.length}
            </h3>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mt-1">Collaborateurs</p>
          </div>
          <div className="flex -space-x-2">
            {clientPartners.length > 0 ? (
              clientPartners.slice(0, 4).map((p, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase shadow-sm"
                >
                  {p.first_name.charAt(0)}
                  {p.last_name.charAt(0)}
                </div>
              ))
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700" />
            )}
            {clientPartners.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-black">
                +{clientPartners.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Tuile Bassins Actifs */}
        <div
          onClick={() => onSelectCategory("pools")}
          className="card-bento glass-morphism border-slate-200/50 dark:border-slate-800 p-5 flex flex-col justify-between min-h-[160px] group cursor-pointer shadow-sm"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
                <Waves size={18} />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Actifs</p>
            </div>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                {pools.length}
              </h3>
              <span className="text-xs font-black text-slate-500 uppercase">Bassins</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
              <span className="text-slate-500">Passages</span>
              <span className="text-blue-600 dark:text-blue-400">{interventions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Deux Colonnes Détails (Gauche: Coordonnées / Partenaires, Droite: Actions / Historique) */}
      <div className="bento-grid-2">
        {/* Colonne Gauche */}
        <div className="flex flex-col gap-4">
          {/* Coordonnées */}
          <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">Coordonnées</h4>
            <div className="space-y-4">
              {client?.phone && (
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
                    <Phone size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-500 uppercase">Téléphone Principal</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">{client.phone}</span>
                  </div>
                </div>
              )}

              {client?.phone2 && (
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
                    <Phone size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-500 uppercase">Téléphone Secondaire</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">{client.phone2}</span>
                  </div>
                </div>
              )}

              {client?.email && (
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
                    <Mail size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-500 uppercase">Email</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">{client.email}</span>
                  </div>
                </div>
              )}

              {client?.city && (
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform flex-shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-500 uppercase">Localisation</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">{client.city}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Équipe du Projet (Solution A Compacte & Zéro Gaspillage d'Espace) */}
          {clientPartners.length > 0 ? (
            <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider">Équipe du Projet</h4>
                <button
                  type="button"
                  onClick={onOpenAssignPartner}
                  className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all min-h-[44px] min-w-[44px]"
                  title="Assigner un intervenant"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
              <div className="space-y-3 pt-1">
                {clientPartners.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-black text-slate-800 dark:text-white leading-tight truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider py-0.5 px-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          {p.id === client?.billing_partner_id ? "TIERS-PAYANT" : p.role || "Partenaire"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectPartnerToUnassign(p)}
                      className="w-11 h-11 shrink-0 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center min-h-[44px] min-w-[44px]"
                      title="Retirer du projet"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAssignPartner}
              className="w-full min-h-[52px] p-3.5 rounded-2xl border-2 border-dashed border-slate-200/90 hover:border-blue-500/80 dark:border-slate-700 dark:hover:border-blue-400 bg-white dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 flex items-center justify-between gap-3 text-left transition-all group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserPlus size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    + Assigner un intervenant / tiers-payant
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Aucun intervenant associé au projet
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
                <Plus size={16} strokeWidth={2.5} />
              </div>
            </button>
          )}
        </div>

        {/* Colonne Droite: Actions de Gestion */}
        <div className="flex flex-col gap-4">
          <div className="card-bento bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 p-6">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">
              Actions de Gestion
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenInterventionModal}
                className="min-h-[48px] flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl hover:border-blue-500 transition-all group shadow-sm"
              >
                <Plus size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Intervention</span>
              </button>
              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="min-h-[48px] flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl hover:border-emerald-500 transition-all group shadow-sm"
              >
                <Wallet size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Versement</span>
              </button>
              <button
                type="button"
                onClick={onOpenDevisModal}
                className="min-h-[48px] flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl hover:border-blue-500 transition-all group shadow-sm"
              >
                <FileText size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Devis</span>
              </button>
              <button
                type="button"
                onClick={onOpenInvoiceModal}
                className="min-h-[48px] flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 p-3 rounded-2xl hover:border-indigo-500 transition-all group shadow-sm bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-800"
              >
                <Receipt size={16} className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase">Facture</span>
              </button>
              <button
                type="button"
                onClick={onOpenPoolModal}
                className="min-h-[48px] flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl hover:border-indigo-500 transition-all group shadow-sm"
              >
                <Plus size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Info Bassin</span>
              </button>
              <button
                type="button"
                onClick={onOpenEditClientModal}
                className="min-h-[48px] flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl hover:border-slate-900 transition-all group shadow-sm"
              >
                <Edit2 size={16} className="text-slate-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Éditer Profil</span>
              </button>
            </div>
          </div>

          {/* Aperçu Historique Financier */}
          <div
            className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6 flex-1 cursor-pointer group shadow-sm"
            onClick={() => onSelectCategory("payments")}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider">
                Historique Financier
              </h4>
              <Wallet size={16} className="text-slate-500" />
            </div>

            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.slice(0, 3).map((pay) => (
                  <div key={pay.id} className="flex items-center gap-4">
                    <div className="w-1.5 h-10 rounded-full bg-emerald-500/30 flex-shrink-0 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full bg-emerald-500 h-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          Encaissement {pay.method}
                        </h5>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          +{pay.amount.toFixed(0)} DT
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase">
                        {new Date(pay.payment_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider group-hover:underline">
                    Consulter tout l'historique
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Wallet size={24} className="text-slate-400 mb-2" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Aucun paiement</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Ligne Inférieure (Timeline Activité & Devis) */}
      <div className={`mt-4 grid gap-4 ${devis.length > 0 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Timeline Activité */}
        <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6 min-h-[200px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider">Dernière Activité</h4>
            <HistoryIcon size={16} className="text-slate-500" />
          </div>

          <div className="flex-1">
            {interventions.length > 0 ? (
              <div className="space-y-3.5">
                {interventions.slice(0, 3).map((inter) => {
                  const techName = inter.technician?.full_name;
                  const completedTasks = (Object.keys(CHECKLIST_LABELS) as ChecklistKey[])
                    .filter((key) => Boolean(inter[key]))
                    .map((key) => CHECKLIST_LABELS[key]);
                  const serviceNames = inter.services?.map((s) => s.service?.name).filter(Boolean) as string[] || [];
                  const allActions = [...serviceNames, ...completedTasks];

                  return (
                    <div
                      key={inter.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500/50 hover:shadow-sm transition-all cursor-pointer group space-y-2.5"
                      onClick={() => onSelectInterventionForView(inter)}
                    >
                      {/* En-tête : Nom du technicien (Titre), Bassin, Date & Statut */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                              <User size={14} strokeWidth={2.5} />
                            </div>
                            <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {techName ? techName : "Technicien non assigné"}
                            </h5>
                          </div>
                          <p className="text-xs font-bold text-slate-500 uppercase mt-1 pl-8">
                            Bassin : <span className="text-blue-600 dark:text-blue-400 font-black">{inter.pool_name || "Piscine Principale"}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                            {new Date(inter.completed_date || inter.scheduled_date || inter.created_at).toLocaleDateString("fr-FR")}
                          </span>
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              inter.status === "completed"
                                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                                : "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            {inter.status === "completed" ? "Réalisée" : "Planifiée"}
                          </span>
                        </div>
                      </div>

                      {/* Actions effectuées (Checklist + Services) */}
                      {allActions.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                            Actions réalisées :
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {allActions.map((action, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40"
                              >
                                <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Produits consommés (si présents) */}
                      {inter.products && inter.products.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Package size={11} /> Produits :
                          </span>
                          {inter.products.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-200/50 dark:border-amber-800/40"
                            >
                              {p.product.name} ({p.quantity} {p.product.unit})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Chimie de l'eau (si renseignée) */}
                      {(inter.ph_level || inter.chlorine_level) && (
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 pt-0.5">
                          {inter.ph_level && (
                            <span>
                              pH : <strong className="text-slate-900 dark:text-white font-black">{inter.ph_level}</strong>
                            </span>
                          )}
                          {inter.chlorine_level && (
                            <span>
                              Chlore :{" "}
                              <strong className="text-slate-900 dark:text-white font-black">
                                {inter.chlorine_level} ppm
                              </strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Note / Observation (si présente) */}
                      {inter.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 pt-0.5 border-t border-slate-200/40 dark:border-slate-700/40">
                          "{inter.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <HistoryIcon size={28} className="mb-2 text-slate-400" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Aucune activité enregistrée
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectCategory("interventions")}
            className="w-full mt-4 py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-500 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase tracking-wider"
          >
            Consulter l'historique complet
          </button>
        </div>

        {/* Timeline Devis */}
        {devis.length > 0 && (
          <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6 min-h-[200px] flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider">Derniers Devis</h4>
              <FileText size={16} className="text-slate-500" />
            </div>

            <div className="flex-1">
              <div className="space-y-3">
                {devis.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 group cursor-pointer"
                    onClick={() => onSelectDevisForView(d)}
                  >
                    <div
                      className={`w-1.5 h-12 rounded-full flex-shrink-0 relative overflow-hidden ${
                        d.status === "closed"
                          ? "bg-emerald-500/30"
                          : d.status === "cancelled"
                          ? "bg-rose-500/30"
                          : "bg-blue-500/30"
                      }`}
                    >
                      <div
                        className={`absolute top-0 left-0 w-full transition-all duration-300 group-hover:h-full h-3 ${
                          d.status === "closed"
                            ? "bg-emerald-600"
                            : d.status === "cancelled"
                            ? "bg-rose-600"
                            : "bg-blue-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {d.title || "Devis"}
                        </h5>
                        <span className="text-xs font-black text-slate-500">
                          {new Date(d.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-slate-500 font-bold uppercase">
                          #{d.number} • {d.status === "closed" ? "Clôturé" : d.status === "cancelled" ? "Annulé" : "En cours"}
                        </p>
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                          {(d.total_amount || 0).toFixed(0)} DT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectCategory("devis")}
              className="w-full mt-4 py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-500 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase tracking-wider"
            >
              Voir tous les devis
            </button>
          </div>
        )}
      </div>
    </>
  );
};
