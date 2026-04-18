import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { Waves, Search, Maximize2, User, MapPin, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface PoolPhoto {
    id: string;
    url: string;
    pool_id: string;
    pool_name: string;
    client_name: string;
    city: string;
    client_id: string;
}

const PoolCatalogue: React.FC = () => {
    const [photos, setPhotos] = useState<PoolPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<PoolPhoto | null>(null);

    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pool_photos')
                .select(`
                    id,
                    url,
                    pool_id,
                    pool:pools(
                        name,
                        client_id,
                        client:clients(
                            first_name,
                            last_name,
                            city
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedPhotos = data?.map((p: any) => ({
                id: p.id,
                url: p.url,
                pool_id: p.pool_id,
                pool_name: p.pool?.name || 'Sans Nom',
                client_id: p.pool?.client_id || '',
                client_name: p.pool?.client ? `${p.pool.client.first_name} ${p.pool.client.last_name}` : 'Anonyme',
                city: p.pool?.client?.city || 'Inconnue'
            })) || [];

            setPhotos(formattedPhotos);
        } catch (error: any) {
            console.error('Error fetching photos:', error);
            toast.error('Erreur lors du chargement de la galerie');
        } finally {
            setLoading(false);
        }
    };

    const filteredPhotos = photos.filter(p => 
        p.pool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageLayout 
            title="Catalogue" 
            subtitle="Galerie des Bassins"
            showBackButton={true}
        >
            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher par client, ville ou bassin..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2rem]" />
                    ))}
                </div>
            ) : filteredPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredPhotos.map((photo) => (
                        <div 
                            key={photo.id} 
                            className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 group cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <div className="relative aspect-square overflow-hidden">
                                <img 
                                    src={photo.url} 
                                    alt={photo.pool_name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform">
                                        <Maximize2 size={24} />
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                     <span className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-[10px] font-black uppercase text-slate-900 dark:text-white px-3 py-1.5 rounded-full shadow-lg">
                                        {photo.city}
                                     </span>
                                </div>
                            </div>
                            <div className="p-4 md:p-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight line-clamp-1">{photo.client_name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <Waves size={12} className="text-blue-500" />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{photo.pool_name}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Waves size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest">Aucune photo trouvée</p>
                </div>
            )}

            {/* Lightbox / Preview */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-in fade-in duration-300 backdrop-blur-sm p-4 text-white">
                    <button 
                        onClick={() => setSelectedPhoto(null)}
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="flex flex-col items-center max-w-5xl w-full">
                        <div className="w-full aspect-video md:aspect-auto md:h-[70vh] rounded-[3rem] overflow-hidden shadow-2xl bg-slate-900 mb-8 border border-white/10">
                            <img 
                                src={selectedPhoto.url} 
                                alt={selectedPhoto.pool_name} 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between w-full px-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <User size={24} className="text-blue-400" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{selectedPhoto.client_name}</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center gap-1">
                                            <MapPin size={12} /> {selectedPhoto.city}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span className="text-blue-400 font-bold uppercase text-xs tracking-widest flex items-center gap-1">
                                            <Waves size={12} /> {selectedPhoto.pool_name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <Link 
                                to={`/clients/${selectedPhoto.client_id}`}
                                className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-blue-500 hover:text-white transition-all transform active:scale-95"
                            >
                                VOIR DOSSIER
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
};

export default PoolCatalogue;
