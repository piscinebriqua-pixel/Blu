import React from 'react';
import ModalLayout from '../ModalLayout';
import Combobox from '../ui/Combobox';
import { LayoutGrid, Wallet, Package as PackageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface TechnicianFinanceModalsProps {
  techId: string | null;
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;
  isAdvanceModalOpen: boolean;
  setIsAdvanceModalOpen: (open: boolean) => void;
  isRemittanceModalOpen: boolean;
  setIsRemittanceModalOpen: (open: boolean) => void;
  categories: any[];
  advanceCategories: any[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  isFinancing: boolean;
  setIsFinancing: (financing: boolean) => void;
  onRefreshFinance: () => void;
}

export const TechnicianFinanceModals: React.FC<TechnicianFinanceModalsProps> = ({
  techId,
  isExpenseModalOpen,
  setIsExpenseModalOpen,
  isAdvanceModalOpen,
  setIsAdvanceModalOpen,
  isRemittanceModalOpen,
  setIsRemittanceModalOpen,
  categories,
  advanceCategories,
  selectedCategoryId,
  setSelectedCategoryId,
  isFinancing,
  setIsFinancing,
  onRefreshFinance,
}) => {
  return (
    <>
      {/* EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <ModalLayout
          title="Déclarer une Dépense"
          onClose={() => setIsExpenseModalOpen(false)}
          actions={
            <button
              form="expense-form"
              type="submit"
              disabled={isFinancing}
              className="btn-flow btn-primary w-full !h-14 disabled:opacity-50"
            >
              {isFinancing ? 'Envoi...' : 'VALIDER LA DÉPENSE'}
            </button>
          }
        >
          <form
            id="expense-form"
            className="flex flex-col gap-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const amount = Number(formData.get('amount'));
              const category_id = formData.get('category_id') as string;
              const description = formData.get('description') as string;

              if (!amount || !category_id) return toast.error('Montant et catégorie requis');

              setIsFinancing(true);
              try {
                const { error } = await supabase.from('expenses').insert({
                  technician_id: techId,
                  category_id,
                  amount,
                  description,
                  status: 'pending',
                });
                if (error) throw error;
                toast.success('Dépense enregistrée (En attente de validation)');
                setIsExpenseModalOpen(false);
                onRefreshFinance();
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setIsFinancing(false);
              }
            }}
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Combobox
                  label="Type de dépense"
                  icon={LayoutGrid}
                  placeholder="Choisir une catégorie..."
                  options={categories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  }))}
                  value={selectedCategoryId}
                  onChange={setSelectedCategoryId}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Montant (TND)
                </label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-black text-2xl text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Notes / Justification
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Détaillez votre dépense..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-300 text-base"
                />
              </div>
            </div>
          </form>
        </ModalLayout>
      )}

      {/* ADVANCE MODAL */}
      {isAdvanceModalOpen && (
        <ModalLayout
          title="Demander une Avance"
          onClose={() => setIsAdvanceModalOpen(false)}
          actions={
            <button
              form="advance-form"
              type="submit"
              disabled={isFinancing}
              className="btn-flow btn-primary w-full !h-14 disabled:opacity-50"
            >
              {isFinancing ? 'Envoi...' : "DEMANDER L'AVANCE"}
            </button>
          }
        >
          <form
            id="advance-form"
            className="flex flex-col gap-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const amount = Number(formData.get('amount'));
              const category_id = formData.get('category_id') as string;
              const description = formData.get('description') as string;

              if (!amount || !category_id) return toast.error('Montant et catégorie requis');

              setIsFinancing(true);
              try {
                const { error } = await supabase.from('advances').insert({
                  technician_id: techId,
                  amount,
                  category_id,
                  description,
                  status: 'pending',
                });
                if (error) throw error;
                toast.success("Demande d'avance envoyée (En attente de validation)");
                setIsAdvanceModalOpen(false);
                onRefreshFinance();
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setIsFinancing(false);
              }
            }}
          >
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl mb-4">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase leading-relaxed">
                Note : Les avances sont déduites de votre caisse et devront être validées par l'administrateur.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Combobox
                label="Type d'avance"
                icon={LayoutGrid}
                placeholder="Choisir une catégorie..."
                options={advanceCategories.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                }))}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Montant de l'avance (TND)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-black text-2xl text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Motif
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Pourquoi avez-vous besoin de cette avance ?"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-300 text-base"
              />
            </div>
          </form>
        </ModalLayout>
      )}

      {/* REMITTANCE MODAL */}
      {isRemittanceModalOpen && (
        <ModalLayout
          title="Déclarer un Versement"
          onClose={() => setIsRemittanceModalOpen(false)}
          actions={
            <button
              form="remittance-form"
              type="submit"
              disabled={isFinancing}
              className="btn-flow btn-primary w-full !h-14 disabled:opacity-50"
            >
              {isFinancing ? 'Envoi...' : 'CONFIRMER LE VERSEMENT'}
            </button>
          }
        >
          <form
            id="remittance-form"
            className="flex flex-col gap-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const amount = Number(formData.get('amount'));
              const method = formData.get('method') as string;
              const description = formData.get('description') as string;

              if (!amount) return toast.error('Montant requis');

              setIsFinancing(true);
              try {
                const { error } = await supabase.from('remittances').insert({
                  technician_id: techId,
                  amount,
                  method,
                  description,
                  status: 'pending',
                });
                if (error) throw error;
                toast.success('Déclaration de versement envoyée');
                setIsRemittanceModalOpen(false);
                onRefreshFinance();
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setIsFinancing(false);
              }
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Mode de Versement
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                  <input type="radio" name="method" value="cash" className="hidden" defaultChecked />
                  <Wallet size={20} className="text-primary" />
                  <span className="text-sm font-black uppercase text-slate-700 dark:text-slate-300">
                    Espèces (Cash)
                  </span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                  <input type="radio" name="method" value="check" className="hidden" />
                  <PackageIcon size={20} className="text-primary" />
                  <span className="text-sm font-black uppercase text-slate-700 dark:text-slate-300">
                    Chèque
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Montant versé (TND)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-black text-2xl text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Commentaires
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Précisez le destinataire ou détails du chèque..."
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-300 text-base"
              />
            </div>
          </form>
        </ModalLayout>
      )}
    </>
  );
};
