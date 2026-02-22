import React from 'react';

interface BccpLogoProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    fillColor?: string;
    showBackground?: boolean;
    bgColor?: string;
}

export const BccpLogo: React.FC<BccpLogoProps> = ({
    width = '100%',
    height = '100%',
    className = '',
    fillColor = '#1a202c', // Couleur par défaut (sombre) pour le logo
    showBackground = false, // Fond transparent par défaut
    bgColor = '#2d3748',
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 200"
            width={width}
            height={height}
            className={className}
        >
            {/* Arrière-plan optionnel */}
            {showBackground && (
                <rect width="100%" height="100%" fill={bgColor} rx="12" />
            )}

            {/* Groupe principal (Icône + Texte) */}
            <g fill={fillColor}>

                {/* Icône du nageur */}
                <g transform="translate(45, 50)">
                    {/* Vague */}
                    <path d="M0,70 C35,40 75,90 120,55 C80,90 40,85 0,70 Z" />

                    {/* Bras / Corps */}
                    <path d="M25,0 C35,25 50,55 95,50 C80,35 60,25 45,0 Z" />

                    {/* Tête */}
                    <circle cx="100" cy="25" r="12" />
                </g>

                {/* Sigle BCCP */}
                <text
                    x="180"
                    y="115"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="76"
                    fontWeight="700"
                    letterSpacing="2"
                >
                    BCCP
                </text>

                {/* Slogan */}
                <text
                    x="45"
                    y="165"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="32"
                    fontWeight="500"
                    letterSpacing="0.5"
                >
                    Clean and Clean Pool
                </text>

            </g>
        </svg>
    );
};

export default BccpLogo;
