import React from 'react';
import BccpLogo from './BccpLogo';

const PageLoadingSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-[#0f141e] gap-6 px-10 animate-in fade-in duration-300">
            <BccpLogo width={80} fillColor="white" className="animate-pulse mb-2" />
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-white/70 text-xs font-black uppercase tracking-widest">Chargement en cours...</p>
        </div>
    );
};

export default PageLoadingSkeleton;
