import React, { useState, useRef, useEffect } from 'react';
import ModalLayout from './ModalLayout';
import { Plus, Trash2, Loader2, Upload, FileSignature, UserPlus, GripVertical, ClipboardCopy, Building2, ChevronDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import Button from './ui/Button';
import AddClientModal from './AddClientModal';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use local worker to ensure compatibility and avoid CORS issues on mobile (Android 14)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
// Model will be selected dynamically with fallback in the function

interface DevisItem {
    id?: string;
    designation: string;
    quantity: number;
    unit_price: number;
    unit?: string;
    is_header?: boolean;
    position?: number;
}

interface AddDevisModalProps {
    clientId?: string;
    devisId?: string;
    isTemplateMode?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddDevisModal: React.FC<AddDevisModalProps> = ({ clientId, devisId, isTemplateMode, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [title, setTitle] = useState('');
    const [number, setNumber] = useState('');
    const [selectedClientId, setSelectedClientId] = useState(clientId || '');
    const [clients, setClients] = useState<any[]>([]);
    const [items, setItems] = useState<DevisItem[]>([]);
    const [notes, setNotes] = useState('');
    const [poolDetails, setPoolDetails] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [status, setStatus] = useState<'pending' | 'closed' | 'cancelled'>('pending');
    
    // New fields for Templates & Company Info
    const [headerContent, setHeaderContent] = useState('');
    const [footerContent, setFooterContent] = useState('');
    const [companyInfo, setCompanyInfo] = useState({
        phone: '',
        email: '',
        address: '',
        tax_id: ''
    });
    const [isTemplate, setIsTemplate] = useState(isTemplateMode || false);
    
    const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

    const [extractedClientName, setExtractedClientName] = useState<{ first: string, last: string } | null>(null);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!clientId || devisId) {
            fetchClients();
        }
        if (devisId) {
            fetchDevisToEdit(devisId);
        } else {
            // Fetch company info and default footer by default for new quotes or templates
            fetchDefaultCompanyInfo();
            if (!isTemplateMode) {
                fetchTemplatesList();
            }
        }
    }, [clientId, devisId, isTemplateMode]);

    const fetchTemplatesList = async () => {
        const { data } = await supabase.from('devis').select('id, title').eq('is_template', true);
        if (data) setAvailableTemplates(data);
    };

    const fetchDefaultCompanyInfo = async () => {
        const { data } = await supabase.from('settings').select('value').eq('key', 'company_info').maybeSingle();
        if (data?.value) {
            setCompanyInfo({
                phone: data.value.phone || '',
                email: data.value.email || '',
                address: data.value.address || '',
                tax_id: data.value.tax_id || ''
            });
            if (data.value.default_footer && !footerContent) {
                setFooterContent(data.value.default_footer);
            }
        }
    };

    const applyTemplate = async (templateId: string) => {
        try {
            setLoading(true);
            const { data: tpl, error: tplError } = await supabase.from('devis').select('*').eq('id', templateId).single();
            if (tplError) throw tplError;

            setHeaderContent(tpl.header_content || '');
            setFooterContent(tpl.footer_content || '');
            setPoolDetails(tpl.pool_details || '');
            setPaymentTerms(tpl.payment_terms || '');
            setNotes(tpl.notes || '');
            
            // If current company info is empty, use template's if exists
            if (!companyInfo.phone && tpl.company_phone) {
                setCompanyInfo({
                    phone: tpl.company_phone,
                    email: tpl.company_email,
                    address: tpl.company_address,
                    tax_id: tpl.company_tax_id
                });
            }

            const { data: itemsData } = await supabase.from('devis_items').select('*').eq('devis_id', templateId).order('position');
            if (itemsData) {
                setItems(itemsData.map(it => ({
                    ...it,
                    id: crypto.randomUUID(), // New IDs for clone
                    devis_id: undefined
                })));
            }
            toast.success("Modèle appliqué avec succès");
            setShowTemplatesDropdown(false);
        } catch (err) {
            toast.error("Erreur lors de l'application du modèle");
        } finally {
            setLoading(false);
        }
    };

    const fetchDevisToEdit = async (id: string) => {
        setLoading(true);
        try {
            const { data: devisData, error: devisError } = await supabase
                .from('devis')
                .select('*')
                .eq('id', id)
                .single();

            if (devisError) throw devisError;

            setTitle(devisData.title || '');
            setNumber(devisData.number || '');
            setSelectedClientId(devisData.client_id || '');
            setPoolDetails(devisData.pool_details || '');
            setPaymentTerms(devisData.payment_terms || '');
            setNotes(devisData.notes || '');
            setStatus(devisData.status || 'pending');
            setIsTemplate(devisData.is_template || false);
            setHeaderContent(devisData.header_content || '');
            setFooterContent(devisData.footer_content || '');
            setCompanyInfo({
                phone: devisData.company_phone || '',
                email: devisData.company_email || '',
                address: devisData.company_address || '',
                tax_id: devisData.company_tax_id || ''
            });

            const { data: itemsData, error: itemsError } = await supabase
                .from('devis_items')
                .select('*')
                .eq('devis_id', id)
                .order('position', { ascending: true })
                .order('id', { ascending: true });

            if (itemsError) throw itemsError;

            if (itemsData) {
                setItems(itemsData.map((item: any) => ({
                    id: item.id,
                    designation: item.designation,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    unit: item.unit,
                    is_header: item.is_header
                })));
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Erreur lors du chargement du devis");
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, first_name, last_name').order('last_name');
        if (data) setClients(data);
    };

    // Auto-generate a successive quote number
    useEffect(() => {
        const generateSuccessiveNumber = async () => {
            if (number || devisId) return;

            try {
                const { data } = await supabase
                    .from('devis')
                    .select('number')
                    .like('number', 'DEV-%');

                if (data && data.length > 0) {
                    let maxId = 0;
                    data.forEach(d => {
                        const match = d.number.match(/DEV-(\d+)/);
                        if (match) {
                            const val = parseInt(match[1], 10);
                            if (val > maxId) maxId = val;
                        }
                    });
                    
                    if (maxId > 0) {
                        setNumber(`DEV-${(maxId + 1).toString().padStart(3, '0')}`);
                    } else {
                        setNumber(`DEV-001`);
                    }
                } else {
                    setNumber(`DEV-001`);
                }
            } catch (err) {
                const date = new Date();
                const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                setNumber(`DEV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${suffix}`);
            }
        };

        generateSuccessiveNumber();
    }, [number]);

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), designation: '', quantity: 1, unit_price: 0, unit: 'U', is_header: false }]);
    };

    const addHeader = () => {
        setItems([...items, { id: crypto.randomUUID(), designation: '', quantity: 0, unit_price: 0, unit: '', is_header: true }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof DevisItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.is_header ? 0 : item.quantity * item.unit_price), 0);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Veuillez sélectionner un fichier PDF');
            return;
        }

        try {
            setParsing(true);
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                const rows: { y: number, items: any[] }[] = [];
                textContent.items.forEach((item: any) => {
                    const y = item.transform[5];
                    const existingRow = rows.find(r => Math.abs(r.y - y) < 4);
                    if (existingRow) existingRow.items.push(item);
                    else rows.push({ y, items: [item] });
                });

                rows.sort((a, b) => b.y - a.y);
                rows.forEach(row => {
                    row.items.sort((a, b) => a.transform[4] - b.transform[4]);
                    fullText += row.items.map((it: any) => it.str).join(" ") + "\n";
                });
            }

            // Verify API Key presence (logged for debug)
            console.log("Gemini Key prefix:", import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 7));

            const aiPrompt = `Tu es un expert en lecture de devis de piscine. Voici le texte extrait d'un PDF de devis. Ton but est d'extraire les informations structurées de manière ultra-précise.
            Instructions :
            1. Ignore les informations de la société (adresse Nabeul, Tél, MF).
            2. Identifie de manière ultra-précise le prénom et le nom du client (le texte qui se trouve généralement juste après le mot "Client:"). Ne mets pas Madame/Monsieur/Mr/Mme. Sépare le prénom et le nom si possible.
            3. Identifie le titre du projet (ex: Projet Piscine 6x3).
            4. Extrais tous les articles du tableau. Pour chaque article, donne : désignation (nom complet), quantité, unité (ex: U, Forfait, ml, m2, Ensemble), et prix unitaire.
            5. Identifie les titres de section (ex: GROUPES DE FILTRATION) et mets le flag "is_header" à true pour eux (quantité et prix à 0).
            6. "pool_details" : Extrais les caractéristiques de la piscine (Dimensions, Surface, Profondeur, Volume, etc.).
            7. "payment_terms" : Extrais les modalités de paiement (ex: 40% à la commande, etc.).
            8. "notes" : Autres remarques importantes.
            ⚠️ ATTENTION EXTRÊME : N'oublie AUCUN article de la liste. Le total cumulé doit correspondre EXACTEMENT au total du devis. Parfois une ligne peut coûter 100 DT (par exemple un accessoire) qu'il ne faut pas oublier.

            Réponds UNIQUEMENT au format JSON comme ceci :
            {
              "extracted_client_firstname": "...",
              "extracted_client_lastname": "...",
              "project_title": "...",
              "pool_details": "...",
              "payment_terms": "...",
              "items": [
                { "designation": "...", "unit": "U", "quantity": 1, "unit_price": 500.0, "is_header": false }
              ],
              "notes": "..."
            }

            TEXTE DU PDF :
            ${fullText}`;

            // --- AI Analysis Selection (Groq FIRST, Gemini fallback) ---
            let aiText = "";
            let success = false;

            // 1. Try GROQ (Ultra-fast and reliable)
            const groqKey = import.meta.env.VITE_GROQ_API_KEY;
            if (groqKey) {
                try {
                    console.log("Essai avec GROQ...");
                    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${groqKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: "llama-3.3-70b-versatile",
                            messages: [
                                { role: "system", content: "Tu es un expert en lecture de devis de piscine. Tu réponds UNIQUEMENT en JSON." },
                                { role: "user", content: aiPrompt }
                            ],
                            temperature: 0.1,
                            response_format: { type: "json_object" }
                        })
                    });

                    const groqData = await groqResponse.json();
                    if (groqData.choices?.[0]?.message?.content) {
                        aiText = groqData.choices[0].message.content;
                        console.log("Succès avec GROQ");
                        success = true;
                    }
                } catch (groqErr) {
                    console.warn("Échec de GROQ, passage à Gemini...", groqErr);
                }
            }

            // 2. Try Gemini (Fallback)
            if (!success) {
                const geminiConfigs = [
                    { model: "gemini-1.5-flash", version: 'v1' },
                    { model: "gemini-1.5-pro", version: 'v1' },
                    { model: "gemini-pro", version: 'v1' }
                ];

                for (const config of geminiConfigs) {
                    try {
                        console.log(`Essai: ${config.model} (${config.version})`);
                        const genModel = genAI.getGenerativeModel({ model: config.model }, { apiVersion: config.version as any });
                        const result = await genModel.generateContent(aiPrompt);
                        const response = await result.response;
                        aiText = response.text();

                        if (aiText) {
                            console.log(`Succès avec ${config.model}`);
                            success = true;
                            break;
                        }
                    } catch (err: any) {
                        console.warn(`Échec ${config.model} (${config.version}):`, err.message);
                    }
                }
            }

            if (!success) {
                toast.error("L'IA n'est pas disponible pour le moment. Veuillez remplir le devis manuellement.");
                return;
            }

            console.log("AI Response Raw:", aiText);

            // Clean JSON response (remove markdown if present)
            const cleanJsonText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            const extractedData = JSON.parse(cleanJsonText);

            // 1. Set Extracted Client Info
            if (extractedData.extracted_client_firstname || extractedData.extracted_client_lastname) {
                setExtractedClientName({
                    first: extractedData.extracted_client_firstname || '',
                    last: extractedData.extracted_client_lastname || ''
                });
                toast.success(`Client détecté : ${extractedData.extracted_client_firstname} ${extractedData.extracted_client_lastname}. Vous pouvez le créer si nécessaire.`, { duration: 5000 });
            }

            // 2. Set Project Title
            if (extractedData.project_title) setTitle(extractedData.project_title || '');

            // 3. Set Items
            if (extractedData.items && extractedData.items.length > 0) {
                const aiItems = extractedData.items.map((it: any) => ({ ...it, id: crypto.randomUUID() }));
                setItems(aiItems);
                toast.success(`${extractedData.items.length} prestations importées.`);
            }

            // 4. Set Details and Notes
            if (extractedData.pool_details) {
                const details = typeof extractedData.pool_details === 'object'
                    ? JSON.stringify(extractedData.pool_details, null, 2).replace(/[\{\}\"]/g, '')
                    : String(extractedData.pool_details);
                setPoolDetails(details.trim());
            }
            if (extractedData.payment_terms) {
                const terms = typeof extractedData.payment_terms === 'object'
                    ? JSON.stringify(extractedData.payment_terms, null, 2).replace(/[\{\}\"]/g, '')
                    : String(extractedData.payment_terms);
                setPaymentTerms(terms.trim());
            }
            if (extractedData.notes) {
                const txtNotes = typeof extractedData.notes === 'object'
                    ? JSON.stringify(extractedData.notes, null, 2).replace(/[\{\}\"]/g, '')
                    : String(extractedData.notes);
                setNotes(txtNotes.trim());
            }

        } catch (error) {
            console.error('PDF Parsing error:', error);
            toast.error('Erreur lors de l\'importation AI.');
        } finally {
            setParsing(false);
        }
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const startIndex = result.source.index;
        const endIndex = result.destination.index;

        const newItems = Array.from(items);
        const [reorderedItem] = newItems.splice(startIndex, 1);
        newItems.splice(endIndex, 0, reorderedItem);

        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!title || (!isTemplate && !number) || (!isTemplate && !selectedClientId) || items.length === 0) {
            toast.error(isTemplate ? 'Veuillez remplir le titre et ajouter des items' : 'Veuillez remplir tous les champs (Client, Titre, Numéro et Items)');
            return;
        }

        setLoading(true);
        try {
            const total = calculateTotal();

            let devisDataId = devisId;

            const baseData = {
                client_id: isTemplate ? null : selectedClientId,
                number: isTemplate ? 'TEMPLATE' : number,
                title,
                total_amount: total,
                status: isTemplate ? 'closed' : status,
                pool_details: poolDetails,
                payment_terms: paymentTerms,
                notes,
                is_template: isTemplate,
                header_content: headerContent,
                footer_content: footerContent,
                company_phone: companyInfo.phone,
                company_email: companyInfo.email,
                company_address: companyInfo.address,
                company_tax_id: companyInfo.tax_id
            };

            if (devisId) {
                const { error: devisError } = await supabase
                    .from('devis')
                    .update(baseData)
                    .eq('id', devisId);

                if (devisError) throw devisError;

                // Delete old items to fully recreate them
                const { error: deleteError } = await supabase
                    .from('devis_items')
                    .delete()
                    .eq('devis_id', devisId);
                if (deleteError) throw deleteError;

            } else {
                const { data: devis, error: devisError } = await supabase
                    .from('devis')
                    .insert([baseData])
                    .select()
                    .single();

                if (devisError) throw devisError;
                devisDataId = devis.id;
            }

            // 2. Create Items
            const itemsToInsert = items.map((item, index) => ({
                devis_id: devisDataId,
                designation: item.designation,
                quantity: item.is_header ? 0 : item.quantity,
                unit_price: item.is_header ? 0 : item.unit_price,
                unit: item.unit || '',
                is_header: !!item.is_header,
                position: index
            }));

            const { error: itemsError } = await supabase
                .from('devis_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            toast.success(devisId ? 'Devis mis à jour avec succès' : 'Devis enregistré avec succès');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout
            title={devisId ? (isTemplate ? "MODIFIER LE MODÈLE" : "MODIFIER LE DEVIS") : (isTemplate ? "NOUVEAU MODÈLE DE DEVIS" : "NOUVEAU CHANTIER (DEVIS)")}
            onClose={onClose}
            className="max-w-5xl"
            actions={
                <div className="flex gap-4 w-full">
                    <Button variant="secondary" onClick={onClose} className="flex-1 btn-flow font-black tracking-widest text-[11px] h-14">ANNULER</Button>
                    <Button onClick={handleSubmit} loading={loading} className="flex-[2] btn-flow btn-primary font-black tracking-widest text-[11px] h-14">
                        {devisId ? "METTRE À JOUR" : (isTemplate ? "ENREGISTRER LE MODÈLE" : "ENREGISTRER LE DEVIS")}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-6 pb-20">
                {!isTemplate && (
                    <div className="flex flex-col md:flex-row gap-4 mb-2">
                        {/* PDF IMPORT BOX */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 p-4 border-2 border-dashed border-blue-500/30 rounded-3xl bg-blue-50/20 dark:bg-blue-900/10 flex items-center justify-between gap-4 cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-all group shadow-sm shadow-blue-500/5"
                        >
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-blue-500 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                    {parsing ? <Loader2 className="animate-spin" size={26} /> : <Upload size={26} />}
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-[14px] font-black text-blue-900 dark:text-white uppercase tracking-tight">Importer PDF</h4>
                                    <p className="text-[10px] text-blue-500/80 font-black uppercase tracking-widest mt-0.5">Extraction IA</p>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" title="Sélectionner PDF" />
                        </div>

                        {/* TEMPLATE IMPORT BOX */}
                        <div className="flex-1 relative">
                            <button
                                onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
                                className="w-full h-full p-4 border-2 border-dashed border-emerald-500/30 rounded-3xl bg-emerald-50/20 dark:bg-emerald-900/10 flex items-center justify-between gap-4 cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20 transition-all group shadow-sm shadow-emerald-500/5"
                            >
                                <div className="flex items-center gap-5 text-left">
                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        <ClipboardCopy size={26} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-[14px] font-black text-emerald-900 dark:text-white uppercase tracking-tight">Appliquer Modèle</h4>
                                        <p className="text-[10px] text-emerald-500/80 font-black uppercase tracking-widest mt-0.5">{availableTemplates.length} modèles dispos</p>
                                    </div>
                                </div>
                                <ChevronDown size={20} className={`text-emerald-500 transition-transform ${showTemplatesDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showTemplatesDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                    {availableTemplates.length === 0 ? (
                                        <div className="p-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Aucun modèle créé</div>
                                    ) : (
                                        <div className="max-h-60 overflow-y-auto no-scrollbar">
                                            {availableTemplates.map(tpl => (
                                                <button
                                                    key={tpl.id}
                                                    onClick={() => applyTemplate(tpl.id)}
                                                    className="w-full p-4 text-left hover:bg-emerald-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0 transition-colors flex items-center gap-3"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                                                        <ClipboardCopy size={16} />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase truncate">{tpl.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* HEADER BLOCK (ENTÊTE DE CHANTIER) */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                            <div className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl">
                                <FileSignature size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Entête du Devis</h3>
                        </div>
                        {isTemplateMode && (
                            <div className="px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                Mode Modèle
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isTemplate && (
                            <div className="flex flex-col gap-1 md:col-span-1">
                                <input
                                    title="Numéro du Devis"
                                    placeholder="Numéro de Devis (ex: DEV-001)"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    className="w-full h-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-black px-4 text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        )}

                        {/* CLIENT SELECTION */}
                        {!clientId ? (
                            <div className="flex flex-col gap-1 md:col-span-1">
                                <select
                                    title="Sélectionner le Client"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    className="w-full h-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold px-4 text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                                >
                                    <option value="">-- Client (Manuel) --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                    ))}
                                </select>

                                {extractedClientName && !selectedClientId && (
                                    <div className="mt-2 p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Client PDF :</span>
                                            <span className="text-[13px] font-black text-blue-600 dark:text-blue-400">{extractedClientName.first} {extractedClientName.last}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddClientModalOpen(true)}
                                            className="w-full h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <UserPlus size={16} />
                                            Créer ce client
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="md:col-span-1 border border-slate-200 dark:border-slate-700 rounded-2xl h-14 bg-slate-100 dark:bg-slate-800/50 p-4 font-bold text-slate-400 flex items-center">
                                Client Déjà Assigné
                            </div>
                        )}

                        <div className="flex flex-col gap-1 md:col-span-1">
                            <select
                                title="Statut du Devis"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className={`w-full h-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-black px-4 outline-none focus:border-blue-500 transition-all ${status === 'closed' ? 'text-emerald-500' :
                                    status === 'cancelled' ? 'text-rose-500' : 'text-blue-500'
                                    }`}
                            >
                                <option value="pending" className="text-blue-500">EN COURS</option>
                                <option value="closed" className="text-emerald-500">CLÔTURÉ</option>
                                <option value="cancelled" className="text-rose-500">ANNULÉ</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-1">
                            <input
                                title="Titre"
                                placeholder={isTemplate ? "Nom du modèle (ex: PACK FILTRATION)" : "Titre du projet (Ex: Rénovation Piscine)"}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-black px-4 text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* COMPANY INFO BLOCK */}
                        <div className="md:col-span-2 bg-slate-50 dark:bg-white/5 rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 size={18} className="text-emerald-500" />
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Coordonnées Société</span>
                                </div>
                                <button
                                    onClick={fetchDefaultCompanyInfo}
                                    className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline"
                                >
                                    Importer mes infos par défaut
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    title="Tel Société"
                                    placeholder="Tel: +216 -- --- ---"
                                    value={companyInfo.phone}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                                    className="h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                />
                                <input
                                    title="Email Société"
                                    placeholder="Email: contact@xxxx.com"
                                    value={companyInfo.email}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                                    className="h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                />
                                <input
                                    title="Matricule Fiscal"
                                    placeholder="MF: 0000000/A/B/C/000"
                                    value={companyInfo.tax_id}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, tax_id: e.target.value })}
                                    className="h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                />
                                <input
                                    title="Adresse Société"
                                    placeholder="Adresse complète..."
                                    value={companyInfo.address}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                    className="h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* HEADER RICH TEXT (Simplified) */}
                        <div className="flex flex-col gap-1 md:col-span-2">
                            <textarea
                                title="Introduction / Entête personnalisée"
                                placeholder="Texte d'introduction du devis (expliquer le projet, salutations...)"
                                value={headerContent}
                                onChange={(e) => setHeaderContent(e.target.value)}
                                className="w-full p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100/50 dark:border-blue-900/20 font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 h-24 resize-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex flex-col gap-1 md:col-span-2">
                            <textarea
                                title="Caractéristiques de la Piscine"
                                placeholder="Caractéristiques techniques : Dimensions, Volume, Matériaux..."
                                value={poolDetails}
                                onChange={(e) => setPoolDetails(e.target.value)}
                                className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 h-20 resize-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/60" />

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <FileSignature size={18} className="text-blue-500" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Détails des prestations</span>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={addItem} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                                <Plus size={16} /> Ajouter un article
                            </button>
                            <button onClick={addHeader} className="flex-1 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-900/30">
                                <FileSignature size={16} /> Titre de section
                            </button>
                        </div>
                    </div>

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="devis-items">
                            {(provided) => (
                                <div
                                    className="space-y-2"
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {items.length === 0 && (
                                        <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-[2rem]">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aucune ligne saisie</p>
                                        </div>
                                    )}
                                    {items.map((item, index) => (
                                        <Draggable key={item.id || `temp-${index}`} draggableId={item.id || `temp-${index}`} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`relative flex flex-col gap-3 p-4 ${item.is_header ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700'} rounded-[1.5rem] border ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 z-50 opacity-90' : 'shadow-sm'}`}
                                                >
                                                    {/* Top Row: Handle, Description & Delete */}
                                                    <div className="flex items-start justify-between gap-3 w-full">
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-blue-500 transition-colors p-1"
                                                            title="Déplacer"
                                                        >
                                                            <GripVertical size={20} />
                                                        </div>
                                                        <textarea
                                                            title="Désignation"
                                                            placeholder={item.is_header ? "TITRE DE SECTION (EX: FILTRATION)" : "Désignation de la prestation"}
                                                            value={item.designation}
                                                            onChange={(e) => updateItem(index, 'designation', e.target.value)}
                                                            rows={item.is_header ? 1 : 2}
                                                            className={`flex-1 w-full bg-transparent border-none ${item.is_header ? 'font-black text-[15px] uppercase text-blue-900 dark:text-blue-100 mt-1' : 'font-medium text-[14px] text-slate-800 dark:text-white'} outline-none resize-y min-h-[40px] placeholder:text-slate-400 focus:ring-0`}
                                                        />
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-slate-100 dark:border-slate-700 shadow-sm shrink-0 mt-1"
                                                            title="Supprimer la ligne"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Bottom Row: Values & Total (Only for normal items) */}
                                                    {!item.is_header && (
                                                        <div className="flex flex-wrap items-center gap-3 p-1 w-full">
                                                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                                                <input
                                                                    title="Quantité"
                                                                    type="number"
                                                                    placeholder="Qté"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                                    className="w-16 h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-black text-[13px] text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                                                                />
                                                                <span className="text-slate-400 text-sm font-bold">×</span>
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        title="Prix Unitaire"
                                                                        type="number"
                                                                        placeholder="PU"
                                                                        value={item.unit_price}
                                                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                                                        className="w-24 h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-black text-[13px] text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                                                                    />
                                                                    <span className="text-[10px] font-black text-slate-400">DT</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 ml-auto md:ml-2">
                                                                    <input
                                                                        title="Unité"
                                                                        placeholder="Unité (ex: Forfait)"
                                                                        value={item.unit || ''}
                                                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                                        className="w-20 h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-black text-[11px] text-slate-500 uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Row Total Highlight */}
                                                            <div className="h-11 px-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center justify-center gap-1 ml-auto shrink-0 shadow-sm">
                                                                <span className="text-[13px] font-black text-blue-700 dark:text-blue-400">
                                                                    {typeof item.quantity === 'number' && typeof item.unit_price === 'number' ? (item.quantity * item.unit_price).toFixed(2) : '0.00'}
                                                                </span>
                                                                <span className="text-[9px] font-black text-blue-400 uppercase">DT</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {/* FOOTER DETAILS: PAYMENT & NOTES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 md:col-span-2">
                            <textarea
                                title="Pied de Page / Mentions Légales"
                                value={footerContent}
                                onChange={(e) => setFooterContent(e.target.value)}
                                className="w-full p-6 bg-slate-900 text-white rounded-[2rem] border border-slate-800 font-bold text-[12px] outline-none focus:border-primary h-32 resize-none transition-all placeholder:text-slate-500"
                                placeholder="Pied de page : Mentions légales, Validité de l'offre, Signature..."
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <textarea
                                title="Modalités de Paiement"
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(e.target.value)}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 font-bold text-[12px] text-slate-800 dark:text-white outline-none focus:border-blue-500 h-24 resize-none transition-all placeholder:text-slate-400"
                                placeholder="Modalités de Paiement (ex: 40% à la commande...)"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <textarea
                                title="Notes et Remarques"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 font-bold text-[12px] text-slate-800 dark:text-white outline-none focus:border-blue-500 h-24 resize-none transition-all placeholder:text-slate-400"
                                placeholder="Observations supplémentaires..."
                            />
                        </div>
                    </div>

                    {/* TOTAL FOOTER */}
                    <div className="mt-8 flex justify-between items-center bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-900/20">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Total Général</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter">{calculateTotal().toFixed(0)}</span>
                                <span className="text-lg font-bold text-slate-500">DT</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Articles</span>
                            <span className="text-2xl font-black">{items.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {isAddClientModalOpen && extractedClientName && (
                <AddClientModal
                    initialFirstName={extractedClientName.first}
                    initialLastName={extractedClientName.last}
                    onClose={() => setIsAddClientModalOpen(false)}
                    onSuccess={() => {
                        setIsAddClientModalOpen(false);
                        fetchClients(); // Refresh client list after creating
                    }}
                />
            )}
        </ModalLayout>
    );
};

export default AddDevisModal;
