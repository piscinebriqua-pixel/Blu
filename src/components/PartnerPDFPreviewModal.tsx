import React from 'react';
import ModalLayout from './ModalLayout';
import Button from './ui/Button';
import { FileText, Download, X, Printer, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';

interface Partner {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
    phone: string;
    email: string;
    role: string;
    is_billing_partner: boolean;
}

interface Intervention {
    id: string;
    visit_date: string;
    status: string;
    client_name: string;
    pool_name: string;
    services?: any[];
    products?: any[];
}

interface PartnerPDFPreviewModalProps {
    partner: Partner;
    interventions: Intervention[];
    assignedClients: any[];
    totalBilled: number;
    totalPaid: number;
    balance: number;
    onClose: () => void;
}

const PartnerPDFPreviewModal: React.FC<PartnerPDFPreviewModalProps> = ({
    partner,
    interventions,
    assignedClients,
    totalBilled,
    totalPaid,
    balance,
    onClose
}) => {
    const partnerName = `${partner.first_name} ${partner.last_name}`.trim() || partner.company;

    const generatePDF = (shouldDownload = true) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 119, 182);
        doc.setFont('helvetica', 'bold');
        doc.text(partner.is_billing_partner ? "RELEVE DE COMPTE" : "SUIVI PARTENAIRE", 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.setFont('helvetica', 'normal');
        doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 32);

        // Partner Info Section
        doc.setDrawColor(230);
        doc.line(14, 38, 196, 38);

        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.text("DESTINATAIRE :", 14, 48);
        doc.setFontSize(13);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(partnerName, 14, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        if (partner.company) doc.text(`Société : ${partner.company}`, 14, 61);
        doc.text(`Rôle : ${partner.role}`, 14, 67);
        doc.text(`Tél : ${partner.phone || '-'} | Email : ${partner.email || '-'}`, 14, 73);

        // Financial Summary Box
        doc.setFillColor(248, 250, 252);
        doc.rect(14, 80, 182, 35, 'F');
        doc.setDrawColor(0, 119, 182);
        doc.setLineWidth(0.5);
        doc.line(14, 80, 14, 115);

        doc.setTextColor(0, 119, 182);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`SOLDE : ${Math.abs(balance).toFixed(0)} DT`, 20, 92);

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'italic');
        doc.text(balance > 0 ? "UNITEC doit ce montant au partenaire." : "Le partenaire a reçu ce montant en avance de la part de UNITEC.", 20, 98);

        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        if (partner.is_billing_partner) {
            doc.text(`TOTAL FACTURÉ : ${totalBilled.toFixed(0)} DT`, 20, 108);
            doc.text(`TOTAL RÉGLÉ : ${totalPaid.toFixed(0)} DT`, 100, 108);
        } else {
            doc.text(`TOTAL AVANCES VERSÉES : ${totalPaid.toFixed(0)} DT`, 20, 108);
        }

        let currentY = 125;

        // Interventions Table
        if (interventions.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text("HISTORIQUE DES INTERVENTIONS (SOUS-TRAITANCE)", 14, currentY);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Date', 'Client / Bassin', 'Statut', 'Montant']],
                body: interventions.map(inter => {
                    const sTotal = inter.services?.reduce((sAcc, s) => sAcc + (s.price_at_time || 0), 0) || 0;
                    const pTotal = inter.products?.reduce((pAcc, p) => pAcc + (p.total_price || 0), 0) || 0;
                    return [
                        new Date(inter.visit_date).toLocaleDateString('fr-FR'),
                        `${inter.client_name}\n(${inter.pool_name})`,
                        inter.status === 'completed' ? 'Terminé' : inter.status,
                        `${(sTotal + pTotal).toFixed(0)} DT`
                    ];
                }),
                headStyles: { fillColor: [0, 119, 182], textColor: [255, 255, 255] },
                bodyStyles: { fontSize: 9 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 14, right: 14 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // Clients Table
        if (assignedClients.length > 0) {
            if (currentY > 240) { doc.addPage(); currentY = 20; }
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text("CLIENTS ET DOSSIERS AFFECTÉS", 14, currentY);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Client', 'Ville', 'Statut']],
                body: assignedClients.map(c => [
                    `${c.first_name} ${c.last_name}`,
                    c.city || '-',
                    'Actif'
                ]),
                headStyles: { fillColor: [148, 163, 184], textColor: [255, 255, 255] },
                bodyStyles: { fontSize: 9 },
                margin: { left: 14, right: 14 }
            });
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("UNITEC - Système de Gestion de Piscines", 14, 285);
            doc.text(`Page ${i} sur ${pageCount}`, 180, 285);
        }

        if (shouldDownload) {
            doc.save(`Recap_${partnerName.replace(/\s+/g, '_')}.pdf`);
            toast.success("Téléchargement lancé");
            onClose();
        }
    };

    return (
        <ModalLayout
            title="Aperçu du Document"
            onClose={onClose}
            className="max-w-4xl"
        >
            <div className="flex flex-col lg:flex-row gap-6 p-4 bg-slate-50 dark:bg-slate-900/50">
                {/* PDF Paper Mockup */}
                <div className="flex-1 bg-white dark:bg-slate-800 shadow-2xl rounded-sm p-8 min-h-[700px] border border-slate-200 dark:border-slate-700 overflow-y-auto max-h-[70vh] scrollbar-hide">
                    {/* Header simulating the PDF */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">
                                {partner.is_billing_partner ? "Relevé de Compte" : "Suivi Partenaire"}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">UNITEC • {new Date().toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="text-right">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center ml-auto">
                                <FileText className="text-primary" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Détails Partenaire</p>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{partnerName}</h3>
                        <p className="text-sm text-slate-500">{partner.company}</p>
                        <p className="text-sm text-slate-500">{partner.role}</p>
                    </div>

                    {/* Financial Summary Box Mockup */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border-l-4 border-primary mb-8">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase mb-1">Solde Actuel</p>
                                <h4 className="text-3xl font-black text-primary">{Math.abs(balance).toFixed(0)} <span className="text-lg opacity-50">DT</span></h4>
                            </div>
                            <div className="text-right">
                                {partner.is_billing_partner ? (
                                    <>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Facturé: {totalBilled.toFixed(0)} DT</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Encaissé: {totalPaid.toFixed(0)} DT</p>
                                    </>
                                ) : (
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Versé: {totalPaid.toFixed(0)} DT</p>
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                            {balance > 0 ? "Somme restant à régler par UNITEC au partenaire." : "Avance en faveur de UNITEC."}
                        </p>
                    </div>

                    {/* Table Mockup */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Aperçu de la table des interventions</p>
                        <div className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-primary text-white">
                                    <tr>
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Client</th>
                                        <th className="p-2 text-right">Montant</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interventions.slice(0, 5).map(i => {
                                        const iTotal = (i.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0) +
                                            (i.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0);
                                        return (
                                            <tr key={i.id} className="border-b border-slate-50 dark:border-slate-700/50">
                                                <td className="p-2">{new Date(i.visit_date).toLocaleDateString('fr-FR')}</td>
                                                <td className="p-2">{i.client_name}</td>
                                                <td className="p-2 text-right font-bold">{iTotal} DT</td>
                                            </tr>
                                        );
                                    })}
                                    {interventions.length > 5 && (
                                        <tr>
                                            <td colSpan={3} className="p-2 text-center text-slate-400 italic">... et {interventions.length - 5} autres interventions</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="lg:w-72 flex flex-col gap-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h5 className="text-sm font-black uppercase text-slate-800 dark:text-white mb-4">Actions de sortie</h5>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => generatePDF(true)}
                                className="w-full h-14 btn-primary flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                <span>TÉLÉCHARGER PDF</span>
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => window.print()}
                                className="w-full h-12 flex items-center justify-center gap-2"
                            >
                                <Printer size={18} />
                                <span>IMPRIMER</span>
                            </Button>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                            <Share2 size={16} />
                            <span className="text-[11px] font-black uppercase">Conseil</span>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                            Une fois téléchargé, vous pouvez envoyer ce document par email ou WhatsApp comme preuve de règlement.
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="w-full h-12 flex items-center justify-center gap-2 mt-auto"
                    >
                        <X size={18} />
                        <span>FERMER</span>
                    </Button>
                </div>
            </div>
        </ModalLayout>
    );
};

export default PartnerPDFPreviewModal;
