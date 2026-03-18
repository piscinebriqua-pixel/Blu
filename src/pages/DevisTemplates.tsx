import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    FileText,
    Plus,
    Trash2,
    Search,
    Loader2,
    ClipboardCopy
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import AddDevisModal from '../components/AddDevisModal';
import ConfirmModal from '../components/ConfirmModal';

interface DevisTemplate {
    id: string;
    title: string;
    total_amount: number;
    created_at: string;
    is_template: boolean;
}

const DevisTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<DevisTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>(undefined);
    const [templateToDelete, setTemplateToDelete] = useState<DevisTemplate | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('devis')
                .select('*')
                .eq('is_template', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error("Erreur lors du chargement des modèles");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async () => {
        if (!templateToDelete) return;
        setIsDeleting(true);
        try {
            await supabase.from('devis_items').delete().eq('devis_id', templateToDelete.id);
            const { error } = await supabase
                .from('devis')
                .delete()
                .eq('id', templateToDelete.id);

            if (error) throw error;
            toast.success(`Modèle supprimé`);
            setTemplateToDelete(null);
            fetchTemplates();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTemplates = templates.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageLayout
            title="Modèles de Devis"
            subtitle="Gérez vos devis types pour gagner du temps"
            showBackButton={true}
            toolbar={
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un modèle..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-4 pb-32">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase">Aucun modèle</h3>
                        <p className="text-slate-500 mb-6">Créez des modèles avec entêtes et pieds de page types.</p>
                        <button onClick={() => setIsAddModalOpen(true)} className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                            Créer mon premier modèle
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => setEditingTemplateId(t.id)}
                                className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-primary/50 hover:scale-[1.02] transition-all cursor-pointer group flex items-center gap-4"
                            >
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                    <ClipboardCopy size={26} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm truncate">{t.title}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {t.total_amount.toFixed(0)} DT
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setTemplateToDelete(t); }} 
                                        className="p-2 text-slate-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Fab */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
            >
                <Plus size={32} strokeWidth={3} />
            </button>

            {(isAddModalOpen || editingTemplateId) && (
                <AddDevisModal
                    devisId={editingTemplateId}
                    isTemplateMode={true}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingTemplateId(undefined);
                    }}
                    onSuccess={fetchTemplates}
                />
            )}

            <ConfirmModal
                isOpen={!!templateToDelete}
                title="Supprimer ce modèle ?"
                message={`Voulez-vous vraiment supprimer "${templateToDelete?.title}" ?`}
                confirmLabel="OUI, SUPPRIMER"
                onConfirm={handleDeleteTemplate}
                onClose={() => setTemplateToDelete(null)}
                loading={isDeleting}
                variant="danger"
            />
        </PageLayout>
    );
};

export default DevisTemplates;
