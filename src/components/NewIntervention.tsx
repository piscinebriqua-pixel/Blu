import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Check,
    X,
    Droplets,
    FileText,
    Save,
    Loader2,
    CheckSquare,
    Square,
    User,
    Plus,
    Minus,
    Wallet,
    Calculator,
    ThermometerSun,
    FlaskConical
} from 'lucide-react';

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

    const [selectedServices, setSelectedServices] = useState<string[]>([]);
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
        const [sv, tc, pr] = await Promise.all([
            supabase.from('services').select('*').order('name'),
            supabase.from('technicians').select('id, full_name').eq('active', true).order('full_name'),
            supabase.from('inventory_products').select('*').order('name')
        ]);
        if (sv.data) setDbServices(sv.data);
        if (tc.data) setDbTechnicians(tc.data);
        if (pr.data) setDbProducts(pr.data);
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
        const servicesTotal = selectedServices.reduce((acc, sId) => {
            const service = dbServices.find(s => s.id === sId);
            return acc + (service?.price || 0);
        }, 0);

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

            if (selectedServices.length > 0) {
                await supabase.from('intervention_services').insert(
                    selectedServices.map(sId => {
                        const s = dbServices.find(srv => srv.id === sId);
                        return {
                            intervention_id: interData.id,
                            service_id: sId,
                            price_at_time: s?.price || 0
                        };
                    })
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

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '90vh' }}>
                {/* Header */}
                <div className="p-8 border-b border-border flex justify-between items-center bg-[#1c222d]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                            <FileText className="text-indigo-500" size={20} />
                        </div>
                        <h2 className="welcome-text" style={{ fontSize: '1.25rem', margin: 0 }}>Rapport d'entretien</h2>
                    </div>
                    <button className="bg-[#242b38] p-2 rounded-lg text-muted hover:text-white transition-colors border-none" onClick={onClose}><X size={24} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-[#1c222d] overflow-x-auto no-scrollbar">
                    {['tech', 'services', 'products', 'summary'].map((t: any) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 min-w-[120px] py-5 text-[10px] font-black uppercase tracking-[0.15em] border-b-4 transition-all ${tab === t ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-muted'}`}
                        >
                            {t === 'tech' ? 'Mesures' : t === 'services' ? 'Services' : t === 'products' ? 'Produits' : 'Résumé'}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#0f141e]">
                    {tab === 'tech' && (
                        <div className="space-y-8">
                            <div>
                                <label className="mini-stat-label">Technicien Responsable</label>
                                <select className="form-input" required value={formData.technician_id} onChange={e => setFormData({ ...formData, technician_id: e.target.value })} style={{ paddingLeft: '1.25rem' }}>
                                    <option value="">Sélectionner un membre de l'équipe...</option>
                                    {dbTechnicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="mini-stat-label">Niveau pH</label>
                                    <div className="relative">
                                        <FlaskConical className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                        <input type="number" step="0.1" className="form-input" placeholder="7.2" value={formData.ph_level} onChange={e => setFormData({ ...formData, ph_level: e.target.value })} style={{ paddingLeft: '3.5rem' }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="mini-stat-label">Taux Chlore</label>
                                    <div className="relative">
                                        <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                        <input type="number" step="0.1" className="form-input" placeholder="1.5" value={formData.chlorine_level} onChange={e => setFormData({ ...formData, chlorine_level: e.target.value })} style={{ paddingLeft: '3.5rem' }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="mini-stat-label">Température Eau</label>
                                    <div className="relative">
                                        <ThermometerSun className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                        <input type="number" className="form-input" placeholder="28" value={formData.water_temp} onChange={e => setFormData({ ...formData, water_temp: e.target.value })} style={{ paddingLeft: '3.5rem' }} />
                                    </div>
                                </div>
                                <div className="flex items-center pt-8">
                                    <button type="button" onClick={() => setFormData({ ...formData, water_level_adjusted: !formData.water_level_adjusted })} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white tracking-widest bg-transparent border-none">
                                        {formData.water_level_adjusted ? <CheckSquare className="text-indigo-500" size={24} /> : <Square className="text-muted" size={24} />}
                                        Niveau Eau OK
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mini-stat-label">Notes & Observations</label>
                                <textarea className="form-input" rows={4} placeholder="Ex: Lavage filtre effectué, remplacement skimmer..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ paddingLeft: '1.25rem' }} />
                            </div>
                        </div>
                    )}

                    {tab === 'services' && (
                        <div className="space-y-3">
                            {dbServices.map(s => (
                                <button key={s.id} type="button" onClick={() => setSelectedServices(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])}
                                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${selectedServices.includes(s.id) ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-[#1c222d] border-border text-muted'} text-left`}>
                                    <div className="flex items-center gap-4">
                                        {selectedServices.includes(s.id) ? <CheckSquare size={22} className="text-indigo-500" /> : <Square size={22} />}
                                        <div>
                                            <span className="text-sm font-black uppercase tracking-tight">{s.name}</span>
                                            <p className="text-[10px] text-muted font-bold mt-1">SÉLECTIONNÉ POUR LE RAPPORT</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black bg-[#242b38] px-3 py-1.5 rounded-lg border border-border">{s.price.toFixed(0)} TND</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {tab === 'products' && (
                        <div className="space-y-4">
                            {dbProducts.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-5 bg-[#1c222d] rounded-2xl border border-border">
                                    <div className="flex-1">
                                        <p className="font-black text-sm text-white uppercase tracking-tight">{p.name}</p>
                                        <p className="text-[10px] text-indigo-500 font-black mt-1">{p.price_per_unit.toFixed(3)} TND / {p.unit}</p>
                                    </div>
                                    <div className="flex items-center gap-6 bg-[#242b38] rounded-2xl px-6 py-2 border border-border">
                                        <button type="button" onClick={() => handleProductQty(p.id, -1)} className="p-1 hover:text-pink-500 transition-colors border-none bg-transparent"><Minus size={22} /></button>
                                        <span className="font-black min-w-[20px] text-center text-xl">{usedProducts[p.id] || 0}</span>
                                        <button type="button" onClick={() => handleProductQty(p.id, 1)} className="p-1 hover:text-indigo-500 transition-colors border-none bg-transparent"><Plus size={22} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'summary' && (
                        <div className="space-y-8">
                            <div className="bg-[#1c222d] rounded-3xl p-10 border border-border text-center shadow-premium">
                                <Calculator className="text-indigo-500 mx-auto mb-4" size={48} />
                                <p className="mini-stat-label text-center">Estimation du coût d'intervention</p>
                                <p className="text-6xl font-black text-white mt-4">{totalAmount.toFixed(0)} <span className="text-xl">TND</span></p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="mini-stat-label border-b border-border pb-3">Détails des prestations</h3>
                                {selectedServices.map(sId => {
                                    const s = dbServices.find(srv => srv.id === sId);
                                    return (
                                        <div key={sId} className="flex justify-between text-sm items-center">
                                            <span className="text-muted font-bold uppercase tracking-tight text-xs">{s?.name}</span>
                                            <span className="font-black text-white">{s?.price.toFixed(0)} DT</span>
                                        </div>
                                    );
                                })}

                                {Object.entries(usedProducts).map(([pId, qty]) => {
                                    const p = dbProducts.find(prod => prod.id === pId);
                                    return (
                                        <div key={pId} className="flex justify-between text-sm items-center">
                                            <span className="text-muted font-bold uppercase tracking-tight text-xs">{p?.name} (x{qty})</span>
                                            <span className="font-black text-white">{((p?.price_per_unit || 0) * qty).toFixed(0)} DT</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex gap-4 text-xs font-bold text-indigo-400">
                                <Wallet size={20} className="shrink-0" />
                                <p>L'enregistrement du rapport déduit automatiquement <strong>{totalAmount.toFixed(0)} TND</strong> du solde de {clientId.slice(0, 8)}...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-border bg-[#1c222d] shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex justify-between items-center mb-6">
                        <span className="mini-stat-label m-0">COÛT TOTAL</span>
                        <span className="text-3xl font-black text-white tracking-tight">{totalAmount.toFixed(0)} TND</span>
                    </div>
                    <button
                        type="button"
                        onClick={tab === 'summary' ? handleSubmit : () => setTab('summary')}
                        className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all border-none cursor-pointer flex items-center justify-center gap-4 ${tab === 'summary' ? 'bg-green-500 text-white shadow-[0_10px_30px_rgba(48,209,88,0.3)]' : 'bg-indigo-500 text-white shadow-[0_10px_30px_rgba(88,86,214,0.3)]'}`}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                            tab === 'summary' ? <><Save size={24} /> Enregistrer & Débiter</> : <><Calculator size={24} /> Suivant : Résumé</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewIntervention;
