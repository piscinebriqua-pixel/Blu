import React, { useState, useEffect } from 'react';
import ModalLayout from '../ModalLayout';
import Button from '../ui/Button';
import { invoiceService, type InvoiceSettings } from '../../services/invoiceService';
import { Hash, Info, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InvoiceSettingsModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

export const InvoiceSettingsModal: React.FC<InvoiceSettingsModalProps> = ({
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefix, setPrefix] = useState('FAC-2026-');
  const [startNumber, setStartNumber] = useState<number>(1);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await invoiceService.getInvoiceSettings();
      setPrefix(settings.prefix);
      setStartNumber(settings.next_number);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefix.trim()) {
      toast.error('Le préfixe ne peut pas être vide');
      return;
    }
    if (startNumber < 1) {
      toast.error('Le numéro de début doit être supérieur ou égal à 1');
      return;
    }

    try {
      setSaving(true);
      const payload: InvoiceSettings = {
        prefix: prefix.trim(),
        next_number: Math.floor(startNumber),
      };
      const ok = await invoiceService.updateInvoiceSettings(payload);
      if (ok) {
        onSaved?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const preview = `${prefix.trim()}${String(startNumber || 1).padStart(4, '0')}`;

  return (
    <ModalLayout
      title="Numérotation des Factures"
      onClose={onClose}
      className="max-w-md !min-h-0"
    >
      <form onSubmit={handleSave} className="space-y-5 pb-1">
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/30 flex items-start gap-3">
          <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 leading-relaxed">
            Définissez ici le préfixe et le numéro auquel vous souhaitez débuter la facturation (ex: 100 si vous démarrez un nouveau carnet).
          </p>
        </div>

        {/* Préfixe */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            Préfixe de facture
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Hash size={18} />
            </span>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="Ex: FAC-2026-"
              disabled={loading}
              className="w-full min-h-[44px] pl-10 pr-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Numéro de départ */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            Prochain numéro (compteur de départ)
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
            disabled={loading}
            className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white text-right"
          />
        </div>

        {/* Aperçu en direct */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Aperçu de la prochaine facture
            </p>
            <p className="text-xl font-black text-emerald-400 tracking-wider mt-0.5">
              {preview}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check size={20} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 min-h-[44px]"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            loading={saving}
            disabled={loading || saving}
            className="flex-1 min-h-[44px] bg-primary font-black uppercase tracking-wider"
          >
            Enregistrer
          </Button>
        </div>
      </form>
    </ModalLayout>
  );
};
export default InvoiceSettingsModal;
