import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Loader2, Navigation, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    city: string;
    gps_lat: number | null;
    gps_lng: number | null;
}

interface GlobalMapProps {
    clients: Client[];
}

const GlobalMap: React.FC<GlobalMapProps> = ({ clients }) => {
    const navigate = useNavigate();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const validClients = clients.filter(c => c.gps_lat && c.gps_lng);

    const containerStyle = {
        width: '100%',
        height: '100%',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const center = validClients.length > 0
        ? { lat: validClients[0].gps_lat!, lng: validClients[0].gps_lng! }
        : { lat: 36.8065, lng: 10.1815 }; // Default to Tunis

    if (!isLoaded) {
        return (
            <div className="w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center animate-pulse">
                <Loader2 className="w-11 h-11 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className={`relative transition-all duration-500 ease-in-out w-full h-full min-h-[400px] z-0`}>
            <div className="h-full w-full bg-slate-100 dark:bg-slate-800">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={10}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        styles: [
                            {
                                "featureType": "poi",
                                "stylers": [{ "visibility": "off" }]
                            },
                            {
                                "featureType": "transit",
                                "stylers": [{ "visibility": "off" }]
                            }
                        ]
                    }}
                >
                    {validClients.map(client => (
                        <Marker
                            key={client.id}
                            position={{ lat: client.gps_lat!, lng: client.gps_lng! }}
                            onClick={() => setSelectedClient(client)}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                            }}
                        />
                    ))}

                    {selectedClient && (
                        <InfoWindow
                            position={{ lat: selectedClient.gps_lat!, lng: selectedClient.gps_lng! }}
                            onCloseClick={() => setSelectedClient(null)}
                        >
                            <div className="p-2 min-w-[200px]">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <User size={14} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                                            {selectedClient.first_name} {selectedClient.last_name}
                                        </h4>
                                        <p className="text-base text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <MapPin size={10} /> {selectedClient.city}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/client/${selectedClient.id}`)}
                                    className="w-full py-2 bg-blue-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                                >
                                    <Navigation size={12} /> VOIR LE PROFIL
                                </button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>



                {/* Stats Overlay */}
                <div className="absolute bottom-28 left-6 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 dark:border-white/10">
                    <span className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                        {validClients.length} Localisations affichées
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GlobalMap;
