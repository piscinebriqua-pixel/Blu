import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { 
    Users, 
    Scissors, 
    FileText, 
    Wallet, 
    ShieldCheck, 
    ArrowRight,
    Bell,
    Database,
    Globe,
    Building2,
    FileSpreadsheet,
    Truck
} from 'lucide-react';

const Settings: React.FC = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Gestion Utilisateurs",
            description: "Approuver les techniciens et gérer les accès admin",
            icon: <Users size={28} />,
            color: "bg-blue-500",
            path: "/admin/users"
        },
        {
            title: "Catalogue Services",
            description: "Modifier les types de prestations et tarifs",
            icon: <Scissors size={28} />,
            color: "bg-rose-500",
            path: "/settings/services"
        },
        {
            title: "Modèles d'Intervention",
            description: "Gérer les checklists et fréquences récurrentes",
            icon: <FileText size={28} />,
            color: "bg-cyan-500",
            path: "/settings/templates"
        },
        {
            title: "Types de Dépenses",
            description: "Gérer les types de dépenses et d'avances",
            icon: <Database size={28} />,
            color: "bg-indigo-500",
            path: "/settings/finance-types"
        },
        {
            title: "Gestion Caisse",
            description: "Consulter les recettes et journal financier",
            icon: <Wallet size={28} />,
            color: "bg-orange-500",
            path: "/admin-finance"
        },
        {
            title: "Coordonnées Société",
            description: "Numéro, Email, Adresse et Matricule Fiscal",
            icon: <Building2 size={28} />,
            color: "bg-emerald-500",
            path: "/settings/company"
        },
        {
            title: "Modèles de Devis",
            description: "Gérer l'entête, le pied de page et prestations types",
            icon: <FileSpreadsheet size={28} />,
            color: "bg-amber-500",
            path: "/settings/devis-templates"
        },
        {
            title: "Flotte Véhicules",
            description: "Gérer les véhicules et consulter les statistiques carburant",
            icon: <Truck size={28} />,
            color: "bg-teal-500",
            path: "/settings/vehicles"
        }
    ];

    return (
        <PageLayout 
            title="Paramètres" 
            subtitle="Configuration Système & Administration"
            showBackButton={true}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {sections.map((section, index) => (
                    <div 
                        key={index}
                        onClick={() => navigate(section.path)}
                        className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[32px] p-8 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-2xl ${section.color}/10 ${section.color.replace('bg-', 'text-')} flex items-center justify-center transition-transform group-hover:rotate-12`}>
                                {section.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">{section.title}</h3>
                                <p className="text-sm font-bold text-slate-400 leading-relaxed">{section.description}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Placeholder for future global settings */}
                <div className="md:col-span-2 mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Préférences Système</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-40 grayscale pointer-events-none">
                        <div className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-900 rounded-[24px]">
                            <Bell size={24} />
                            <span className="text-[10px] font-black uppercase">Notifications</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-900 rounded-[24px]">
                            <Database size={24} />
                            <span className="text-[10px] font-black uppercase">Backup</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-900 rounded-[24px]">
                            <Globe size={24} />
                            <span className="text-[10px] font-black uppercase">Langue</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-900 rounded-[24px]">
                            <ShieldCheck size={24} />
                            <span className="text-[10px] font-black uppercase">Sécurité</span>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default Settings;
