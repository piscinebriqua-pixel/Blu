import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Check,
    Droplets,
    Save,
    Loader2,
    CheckSquare,
    Square,
    Plus,
    Minus,
    Wallet,
    Calculator,
    ThermometerSun,
    FlaskConical,
    ArrowRight,
    User
} from 'lucide-react';
import ModalLayout from './ModalLayout';

interface Service { id: string; name: string; price: number; }
interface Technician { id: string; full_name: string; }
interface Product { id: string; name: string; unit: string; price_per_unit: number; }

interface NewInterventionProps {
    poolId: string;
    clientId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const NewIntervention: React.FC<NewInterventionProps> = ({ poolId, clientId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'tech' | 'services' | 'products' | 'summary'>('tech');

    const [dbServices, setDbServices] = useState<Service[]>([]);
    const [dbTechnicians, setDbTechnicians] = useState<Technician[]>([]);
    const [dbProducts, setDbProducts] = useState<Product[]>([]);

    // Auth & Permissions

    const [isTechnician, setIsTechnician] = useState(false);

    const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
    const [referencePrices, setReferencePrices] = useState<Record<string, number>>({});
    const [serviceToAdd, setServiceToAdd] = useState(''); // New state for dropdown
    const [usedProducts, setUsedProducts] = useState<{ [key: string]: number }>({});
    const [formData, setFormData] = useState({
        technician_id: '',
        ph_level: '',
        chlorine_level: '',
        water_temp: '',
        notes: '',
        water_level_adjusted: false
    });

    useEffect(() => {
        fetchInitialData();
    }, []);



    const fetchInitialData = async () => {
        const [sv, tc, pr, session] = await Promise.all([
            supabase.from('services').select('*').order('name'),
            supabase.from('technicians').select('id, full_name, email').order('full_name'),
            supabase.from('inventory_products').select('*').order('name'),
            supabase.auth.getSession()
        ]);

        const userEmail = session.data.session?.user?.email;


        if (sv.data) setDbServices(sv.data);

        let techList = tc.data || [];
        if (tc.data) setDbTechnicians(techList);
        if (pr.data) setDbProducts(pr.data);

        // Auto-assign if user is a technician
        if (userEmail && techList.length > 0) {
            const matchedTech = techList.find(t => t.email === userEmail);
            if (matchedTech) {
                setFormData(prev => ({ ...prev, technician_id: matchedTech.id }));
                setIsTechnician(true);
                // Optional: Auto-switch to services tab if tech is auto-assigned
                // setTab('services'); 
            }
        }
    };

    useEffect(() => {
        if (clientId) fetchClientHistory();
    }, [clientId]);

    const fetchClientHistory = async () => {
        // Fetch last 50 intervention services for this client to find last paid prices
        const { data } = await supabase
            .from('interventions')
            .select('id, intervention_services(service_id, price_at_time)')
            .eq('pool_id', poolId) // Optionally filter by pool, but request implies client-level
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            const history: Record<string, number> = {};
            // Iterate in reverse to let newer overwrite older (though we fetched desc, we want the *first* occurrence found)
            // Actually, we want the MOST RECENT usage. data is desc.
            data.forEach((intervention: any) => {
                if (intervention.intervention_services) {
                    intervention.intervention_services.forEach((is: any) => {
                        // If we haven't seen this service yet, it's the most recent one
                        if (history[is.service_id] === undefined) {
                            history[is.service_id] = is.price_at_time;
                        }
                    });
                }
            });
            setReferencePrices(history);
        }
    };

    const handleProductQty = (pId: string, delta: number) => {
        setUsedProducts(prev => {
            const current = prev[pId] || 0;
            const newVal = Math.max(0, current + delta);
            if (newVal === 0) {
                const { [pId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [pId]: newVal };
        });
    };

    const calculateTotal = () => {
        const servicesTotal = Object.values(selectedServices).reduce((acc, price) => acc + price, 0);

        const productsTotal = Object.entries(usedProducts).reduce((acc, [pId, qty]) => {
            const product = dbProducts.find(p => p.id === pId);
            return acc + (product?.price_per_unit || 0) * qty;
        }, 0);

        return servicesTotal + productsTotal;
    };

    const handleSubmit = async () => {
        if (!formData.technician_id) {
            alert('Veuillez sélectionner un technicien');
            setTab('tech');
            return;
        }
        setLoading(true);

        try {
            const totalAmount = calculateTotal();

            const { data: interData, error: interError } = await supabase
                .from('interventions')
                .insert([{
                    pool_id: poolId,
                    technician_id: formData.technician_id,
                    ph_level: formData.ph_level ? parseFloat(formData.ph_level) : null,
                    chlorine_level: formData.chlorine_level ? parseFloat(formData.chlorine_level) : null,
                    water_temp: formData.water_temp ? parseFloat(formData.water_temp) : null,
                    water_level_adjusted: formData.water_level_adjusted,
                    notes: formData.notes,
                    status: 'completed'
                }])
                .select().single();

            if (interError) throw interError;

            if (Object.keys(selectedServices).length > 0) {
                await supabase.from('intervention_services').insert(
                    Object.entries(selectedServices).map(([sId, price]) => ({
                        intervention_id: interData.id,
                        service_id: sId,
                        price_at_time: price
                    }))
                );
            }

            const productEntries = Object.entries(usedProducts);
            if (productEntries.length > 0) {
                await supabase.from('intervention_products').insert(
                    productEntries.map(([pId, qty]) => {
                        const p = dbProducts.find(prod => prod.id === pId);
                        return {
                            intervention_id: interData.id,
                            product_id: pId,
                            quantity: qty,
                            total_price: (p?.price_per_unit || 0) * qty
                        };
                    })
                );
            }

            const { data: clientData } = await supabase.from('clients').select('balance').eq('id', clientId).single();
            const newBalance = (clientData?.balance || 0) - totalAmount;

            await supabase.from('clients').update({ balance: newBalance }).eq('id', clientId);

            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = calculateTotal();

    const actions = (
        <div className="flex-column w-full gap-3">
            <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Coût estimé</span>
                <span className="text-xl font-black text-white">{totalAmount.toFixed(0)} DT</span>
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 bg-white/5 text-muted font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors flex-1"
                    disabled={loading}
                >
                    Fermer
                </button>
                <button
                    type="button"
                    onClick={tab === 'summary' ? handleSubmit : () => setTab('summary')}
                    className={`btn-primary h-[54px] flex-[2] ${tab === 'summary' ? '!bg-status-green' : ''} ${!formData.technician_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading || !formData.technician_id}
                    title={!formData.technician_id ? "Veuillez sélectionner un technicien d'abord" : (tab === 'summary' ? "Enregistrer l'intervention" : "Aller au résumé")}
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                        tab === 'summary' ? <><Save size={20} /> ENREGISTRER</> : <><ArrowRight size={20} /> SUIVANT</>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <ModalLayout
            title="Rapport d'entretien"
            onClose={onClose}
            actions={actions}
        >
            <div className="flex-column gap-6">
                {/* Custom Tabs Slider */}
                <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl overflow-x-auto no-scrollbar">
                    {['tech', 'services', 'products', 'summary'].map((t: any) => (
                        <button
                            key={t}
                            onClick={() => {
                                if (t !== 'tech' && !formData.technician_id) {
                                    alert("Veuillez sélectionner un technicien avant de continuer.");
                                    return;
                                }
                                setTab(t);
                            }}
                            className={`flex-1 min-w-[80px] py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${tab === t ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'} ${t !== 'tech' && !formData.technician_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={t !== 'tech' && !formData.technician_id}
                            title={t !== 'tech' && !formData.technician_id ? "Sélectionnez un technicien d'abord" : ""}
                        >
                            {t === 'tech' ? 'Technicien' : t === 'services' ? 'Services' : t === 'products' ? 'Produits' : 'Résumé'}
                        </button>
                    ))}
                </div>

                {/* Tab Content Area */}
                <div className="flex-column gap-5 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {tab === 'tech' && (
                        <div className="flex-column gap-5">
                            <div className="flex-column gap-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Technicien</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                    <select
                                        className={`search-input !pl-12 ${isTechnician ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                        required
                                        value={formData.technician_id}
                                        onChange={e => setFormData({ ...formData, technician_id: e.target.value })}
                                        title="Sélectionner un technicien"
                                        disabled={isTechnician}
                                    >
                                        <option value="" className="bg-bg-card">Sélectionner un agent...</option>
                                        {dbTechnicians.map(t => <option key={t.id} value={t.id} className="bg-bg-card text-white">{t.full_name}</option>)}
                                    </select>
                                    {isTechnician && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">AUTO</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="data-grid grid-2 !gap-4">
                                <div className="flex-column gap-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">pH</label>
                                    <div className="relative">
                                        <FlaskConical className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="number" step="0.1" className="search-input !pl-10" placeholder="7.2" value={formData.ph_level} onChange={e => setFormData({ ...formData, ph_level: e.target.value })} title="Niveau de pH" />
                                    </div>
                                </div>
                                <div className="flex-column gap-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Chlore</label>
                                    <div className="relative">
                                        <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="number" step="0.1" className="search-input !pl-10" placeholder="1.5" value={formData.chlorine_level} onChange={e => setFormData({ ...formData, chlorine_level: e.target.value })} title="Taux de chlore" />
                                    </div>
                                </div>
                            </div>

                            <div className="data-grid grid-2 !gap-4">
                                <div className="flex-column gap-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Temp. Eau</label>
                                    <div className="relative">
                                        <ThermometerSun className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="number" className="search-input !pl-10" placeholder="28°" value={formData.water_temp} onChange={e => setFormData({ ...formData, water_temp: e.target.value })} title="Température de l'eau" />
                                    </div>
                                </div>
                                <div className="flex items-end pb-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, water_level_adjusted: !formData.water_level_adjusted })}
                                        className={`flex items-center gap-2 w-full h-[40px] px-4 rounded-xl border transition-all ${formData.water_level_adjusted ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-muted'}`}
                                        title="Ajustement du niveau d'eau"
                                    >
                                        {formData.water_level_adjusted ? <CheckSquare size={18} /> : <Square size={18} />}
                                        <span className="text-[10px] font-black uppercase">Niveau OK</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-column gap-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Observations</label>
                                <textarea className="search-input !h-auto !py-3" rows={3} placeholder="Notes techniques..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} title="Notes et observations" />
                            </div>
                        </div>
                    )}

                    {tab === 'services' && (
                        <div className="flex-column gap-4">
                            {/* Add Service Section */}
                            <div className="flex gap-2">
                                <select
                                    className="search-input cursor-pointer flex-1"
                                    value={serviceToAdd}
                                    onChange={(e) => setServiceToAdd(e.target.value)}
                                    title="Sélectionner un service à ajouter"
                                >
                                    <option value="">Sélectionner un service...</option>
                                    {dbServices
                                        .filter(s => selectedServices[s.id] === undefined) // Only show unselected services
                                        .map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.price} DT)</option>
                                        ))}
                                </select>
                                <button
                                    type="button"
                                    disabled={!serviceToAdd}
                                    onClick={() => {
                                        if (serviceToAdd) {
                                            const s = dbServices.find(srv => srv.id === serviceToAdd);
                                            if (s) {
                                                setSelectedServices(prev => ({
                                                    ...prev,
                                                    [s.id]: referencePrices[s.id] ?? s.price
                                                }));
                                                setServiceToAdd('');
                                            }
                                        }
                                    }}
                                    className="btn-primary px-4 !h-[42px] disabled:opacity-50 disabled:grayscale"
                                    title="Ajouter le service sélectionné"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Selected Services List */}
                            <div className="flex-column gap-2">
                                {Object.entries(selectedServices).length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-xs text-muted font-bold uppercase tracking-wider">Aucun service sélectionné</p>
                                    </div>
                                ) : (
                                    Object.entries(selectedServices).map(([sId, price]) => {
                                        const s = dbServices.find(srv => srv.id === sId);
                                        if (!s) return null;
                                        const isModified = price !== s.price;

                                        return (
                                            <div
                                                key={sId}
                                                className="flex flex-col p-4 rounded-2xl border bg-primary/20 border-primary shadow-lg transition-all"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-lg flex-center shrink-0 bg-primary text-white">
                                                            <Check size={18} />
                                                        </div>
                                                        <div className="flex-column overflow-hidden">
                                                            <span className="text-xs font-black uppercase text-white truncate">{s.name}</span>
                                                            <span className="text-[8px] font-bold text-muted uppercase">Service technique</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <input
                                                            type="number"
                                                            className="w-20 bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-right text-xs font-black text-white focus:border-primary outline-none"
                                                            value={price}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val)) {
                                                                    setSelectedServices(prev => ({ ...prev, [sId]: val }));
                                                                }
                                                            }}
                                                            title={`Prix pour ${s.name}`}
                                                        />
                                                        <span className="text-[10px] font-bold text-muted">DT</span>

                                                        <button
                                                            onClick={() => {
                                                                const { [sId]: _, ...rest } = selectedServices;
                                                                setSelectedServices(rest);
                                                            }}
                                                            className="w-8 h-8 flex-center rounded-lg hover:bg-white/10 text-muted hover:text-red-400 transition-colors ml-2"
                                                            title="Retirer ce service"
                                                        >
                                                            <Minus size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {(isModified || (referencePrices[sId] !== undefined && referencePrices[sId] !== s.price)) && (
                                                    <div className="mt-2 pl-12 flex gap-2">
                                                        {isModified && (
                                                            <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                                                Prix modifié (Base: {s.price} DT)
                                                            </span>
                                                        )}
                                                        {!isModified && referencePrices[sId] !== undefined && referencePrices[sId] !== s.price && (
                                                            <span className="text-[9px] font-bold text-blue-300">
                                                                Prix habituel client: {referencePrices[sId]} DT
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'products' && (
                        <div className="flex-column gap-3">
                            {dbProducts.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex-column">
                                        <p className="font-black text-xs text-white uppercase truncate max-w-[140px]">{p.name}</p>
                                        <p className="text-[9px] text-primary font-black mt-1">{p.price_per_unit.toFixed(2)} DT / {p.unit}</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-secondary/30 rounded-xl px-3 py-1.5">
                                        <button type="button" onClick={() => handleProductQty(p.id, -1)} className="p-1 hover:text-status-red transition-colors text-muted" title="Diminuer quantité"><Minus size={18} /></button>
                                        <span className="font-black min-w-[20px] text-center text-sm text-white">{usedProducts[p.id] || 0}</span>
                                        <button type="button" onClick={() => handleProductQty(p.id, 1)} className="p-1 hover:text-primary transition-colors text-muted" title="Augmenter quantité"><Plus size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'summary' && (
                        <div className="flex-column gap-6">
                            <div className="card-premium grad-violet vibrant items-center py-8">
                                <Calculator className="text-white/30 absolute left-4 top-4" size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Coût d'intervention</p>
                                <p className="text-5xl font-black text-white mt-2">{totalAmount.toFixed(0)} <span className="text-xl">DT</span></p>
                            </div>

                            <div className="flex-column gap-3">
                                <h4 className="text-[10px] font-black text-muted uppercase tracking-widest border-b border-border-subtle pb-2">Résumé des coûts</h4>
                                {Object.entries(selectedServices).map(([sId, price]) => {
                                    const s = dbServices.find(srv => srv.id === sId);
                                    return (
                                        <div key={sId} className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted font-bold uppercase">{s?.name}</span>
                                            <span className="font-black text-white">{price.toFixed(0)} DT</span>
                                        </div>
                                    );
                                })}
                                {Object.entries(usedProducts).map(([pId, qty]) => {
                                    const p = dbProducts.find(prod => prod.id === pId);
                                    return (
                                        <div key={pId} className="flex justify-between items-center text-[10px]">
                                            <span className="text-muted font-bold uppercase">{p?.name} (x{qty})</span>
                                            <span className="font-black text-white">{((p?.price_per_unit || 0) * qty).toFixed(0)} DT</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex gap-3">
                                <Wallet size={18} className="text-primary shrink-0" />
                                <p className="text-[9px] font-bold text-primary leading-relaxed uppercase">
                                    L'enregistrement du rapport déduira automatiquement <strong>{totalAmount.toFixed(0)} DT</strong> du solde client.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalLayout>
    );
};

export default NewIntervention;
