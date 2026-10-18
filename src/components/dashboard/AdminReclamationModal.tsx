import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Phone, 
    ChevronDown, 
    ChevronUp, 
    RefreshCw
} from 'lucide-react';
import ModalLayout from '../ModalLayout';
import { 
    getAllReclamations, 
    closeReclamation, 
    reopenReclamation 
} from '../../services/reclamationService';
import type { ReclamationRow } from '../../lib/supabase';

interface AdminReclamationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
}

export const AdminReclamationModal: React.FC<AdminReclamationModalProps> = ({
    isOpen,
    onClose,
    onUpdated
}) => {
    const [filter, setFilter] = useState<'en_cours' | 'cloturee' | 'all'>('en_cours');
    const [reclamations, setReclamations] = useState<ReclamationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [adminResponseText, setAdminResponseText] = useState<{ [key: string]: string }>({});
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadReclamations();
        }
    }, [isOpen, filter]);

    const loadReclamations = async () => {
        setLoading(true);
        try {
            const data = await getAllReclamations(filter);
            setReclamations(data);
            if (data.length > 0 && !expandedId) {
                setExpandedId(data[0].id);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleCloseTicket = async (recId: string) => {
        setProcessingId(recId);
        try {
            const responseNote = adminResponseText[recId] || '';
            const success = await closeReclamation(recId, responseNote);
            if (success) {
                await loadReclamations();
                if (onUpdated) onUpdated();
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleReopenTicket = async (recId: string) => {
        setProcessingId(recId);
        try {
            const success = await reopenReclamation(recId);
            if (success) {
                await loadReclamations();
                if (onUpdated) onUpdated();
            }
        } finally {
            setProcessingId(null);
        }
    };

    const pendingCount = reclamations.filter(r => r.status === 'en_cours').length;

    return (
        <ModalLayout
            title="Gestion des Réclamations Clients"
            onClose={onClose}
            className="max-w-3xl"
        >
            <div className="p-5 space-y-4">
                {/* Filtres de statut */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={() => setFilter('en_cours')}
                        className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            filter === 'en_cours'
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <Clock size={15} />
                        En cours ({filter === 'en_cours' ? reclamations.length : pendingCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('cloturee')}
                        className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            filter === 'cloturee'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <CheckCircle2 size={15} />
                        Clôturées
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            filter === 'all'
                                ? 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        Toutes
                    </button>
                </div>

                {/* Contenu / Liste */}
                {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-3" />
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Chargement des réclamations...</p>
                    </div>
                ) : reclamations.length === 0 ? (
                    <div className="py-14 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center p-6">
                        <CheckCircle2 size={40} className="text-emerald-500 mb-2 opacity-80" />
                        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {filter === 'en_cours' ? 'Aucune réclamation en cours !' : 'Aucun ticket trouvé'}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm">
                            {filter === 'en_cours' 
                                ? 'Toutes les réclamations déposées par vos clients ont été traitées et clôturées.' 
                                : 'Aucune entrée ne correspond au filtre sélectionné.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 hide-scrollbar">
                        {reclamations.map((rec) => {
                            const isExpanded = expandedId === rec.id;
                            const isClosed = rec.status === 'cloturee';
                            const clientName = rec.client 
                                ? `${rec.client.first_name} ${rec.client.last_name}` 
                                : 'Client Blu';
                            const clientPhone = rec.client?.phone;

                            return (
                                <div
                                    key={rec.id}
                                    className={`rounded-2xl border transition-all ${
                                        isExpanded 
                                            ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700/60 shadow-lg ring-1 ring-amber-500/20' 
                                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    {/* Barre de résumé cliquable */}
                                    <div
                                        onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                                        className="p-4 flex items-center justify-between gap-3 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                                isClosed 
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' 
                                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                                            }`}>
                                                {isClosed ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                                                        {clientName}
                                                    </p>
                                                    {rec.client?.city && (
                                                        <span className="text-xs font-bold text-slate-500 truncate">
                                                            • {rec.client.city}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                                                    {rec.subject}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs font-semibold text-slate-500">
                                                {new Date(rec.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>

                                            {isClosed ? (
                                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase">
                                                    Clôturée
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-black uppercase animate-pulse">
                                                    En cours
                                                </span>
                                            )}

                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Détail déplié */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
                                            {/* Coordonnées & Actions de contact */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-0.5">
                                                    <p>Bassin : <strong className="text-slate-900 dark:text-white uppercase">{rec.pool?.name || 'Non spécifié'}</strong></p>
                                                    <p>Reçue le : <strong>{new Date(rec.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</strong></p>
                                                </div>

                                                {clientPhone && (
                                                    <a
                                                        href={`tel:${clientPhone}`}
                                                        className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95"
                                                    >
                                                        <Phone size={14} />
                                                        Appeler ({clientPhone})
                                                    </a>
                                                )}
                                            </div>

                                            {/* Message complet du client */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                                    Message du client
                                                </label>
                                                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                                    {rec.description}
                                                </div>
                                            </div>

                                            {/* Zone de Résolution / Clôture */}
                                            {!isClosed ? (
                                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                                        <span>Solution / Note de résolution pour le client</span>
                                                        <span className="font-semibold text-slate-500 lowercase">(visible dans son espace)</span>
                                                    </label>
                                                    <textarea
                                                        value={adminResponseText[rec.id] ?? ''}
                                                        onChange={(e) => setAdminResponseText({ ...adminResponseText, [rec.id]: e.target.value })}
                                                        placeholder="Ex: Le technicien est intervenu pour rééquilibrer le produit et vérifier le filtre..."
                                                        rows={2}
                                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => handleCloseTicket(rec.id)}
                                                        disabled={processingId === rec.id}
                                                        className="w-full min-h-[44px] h-auto px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 text-center leading-snug"
                                                    >
                                                        {processingId === rec.id ? (
                                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 size={16} className="shrink-0" />
                                                                <span>Confirmer la clôture de cette réclamation</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl space-y-1">
                                                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">
                                                            Réclamation clôturée
                                                            {rec.closed_at && (
                                                                <span className="font-semibold ml-2">
                                                                    le {new Date(rec.closed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            {rec.admin_response || "Aucune note explicative enregistrée."}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleReopenTicket(rec.id)}
                                                        disabled={processingId === rec.id}
                                                        className="w-full min-h-[44px] h-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center leading-snug"
                                                    >
                                                        <RefreshCw size={14} className="shrink-0" />
                                                        <span>Rouvrir la réclamation</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </ModalLayout>
    );
};
