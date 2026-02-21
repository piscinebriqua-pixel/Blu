import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Crosshair, MapPin, Loader2 } from 'lucide-react';

interface MapPickerProps {
    lat: number | null;
    lng: number | null;
    onPositionChange?: (lat: number, lng: number) => void;
    readonly?: boolean;
}

const containerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '1.5rem'
};

const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onPositionChange, readonly = false }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState({ lat: lat || 36.8065, lng: lng || 10.1815 });
    const [isLocating, setIsLocating] = useState(false);

    // Update center when lat/lng props change (e.g. initial load)
    useEffect(() => {
        if (lat && lng) {
            setCenter({ lat, lng });
        }
    }, [lat, lng]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (!readonly && e.latLng && onPositionChange) {
            onPositionChange(e.latLng.lat(), e.latLng.lng());
        }
    }, [onPositionChange, readonly]);

    const handleGetCurrentPosition = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLat = position.coords.latitude;
                const newLng = position.coords.longitude;
                if (onPositionChange) {
                    onPositionChange(newLat, newLng);
                }
                setCenter({ lat: newLat, lng: newLng });
                map?.panTo({ lat: newLat, lng: newLng });
                setIsLocating(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Impossible de récupérer votre position");
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    if (!isLoaded) {
        return (
            <div className="w-full h-[300px] bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="relative group">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={15}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={onMapClick}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: !readonly,
                        gestureHandling: readonly ? 'none' : 'auto',
                        styles: [
                            {
                                "featureType": "administrative",
                                "elementType": "geometry",
                                "stylers": [{ "visibility": "off" }]
                            },
                            {
                                "featureType": "poi",
                                "stylers": [{ "visibility": "off" }]
                            },
                            {
                                "featureType": "road",
                                "elementType": "labels.icon",
                                "stylers": [{ "visibility": "off" }]
                            },
                            {
                                "featureType": "transit",
                                "stylers": [{ "visibility": "off" }]
                            }
                        ]
                    }}
                >
                    {lat && lng && (
                        <Marker
                            position={{ lat, lng }}
                        />
                    )}
                </GoogleMap>

                {/* Overlays */}
                <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                    <div className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 dark:border-white/10 flex items-center gap-2 pointer-events-auto transition-transform hover:scale-105">
                        <MapPin size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white">
                            {lat ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : "Cliquez sur la carte"}
                        </span>
                    </div>
                </div>

                {!readonly && (
                    <button
                        type="button"
                        onClick={handleGetCurrentPosition}
                        disabled={isLocating}
                        className="absolute bottom-4 right-4 w-12 h-12 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto"
                        title="Ma position actuelle"
                    >
                        {isLocating ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <Crosshair size={24} />
                        )}
                    </button>
                )}
            </div>
            {!readonly && (
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest">
                    Cliquez pour placer le marqueur ou utilisez le bouton GPS
                </p>
            )}
        </div>
    );
};

export default MapPicker;
