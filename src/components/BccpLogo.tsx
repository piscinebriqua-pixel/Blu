import React from 'react';

interface BccpLogoProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    fillColor?: 'original' | 'white' | 'dark' | 'blue' | string;
    variant?: 'full' | 'emblem';
    showBackground?: boolean;
    bgColor?: string;
}

/**
 * BccpLogo — uses the real BCCP logo SVG from /public/logo.svg or /public/emblem.svg.
 * Pass variant="emblem" for the swimmer + wave icon without text (ideal for square icons & favicons).
 * Pass fillColor="white" to render the logo in white (e.g. on dark/blue headers).
 * Pass fillColor="blue" to render the logo in primary blue.
 */
export const BccpLogo: React.FC<BccpLogoProps> = ({
    width = 180,
    height = 'auto',
    className = '',
    fillColor = 'original',
    variant = 'full',
}) => {
    const isWhite = fillColor === 'white';
    const isDark = fillColor === 'dark';
    const isBlue = fillColor === 'blue' || fillColor === 'primary';
    const src = variant === 'emblem' ? '/emblem.svg' : '/logo.svg';

    return (
        <img
            src={src}
            width={width}
            height={height}
            className={`${className} logo-img ${isWhite ? 'logo-white' : ''} ${isDark ? 'logo-dark' : ''} ${isBlue ? 'logo-blue' : ''}`.trim()}
            alt={variant === 'emblem' ? 'BCCP Emblème' : 'BCCP Logo'}
        />
    );
};

export default BccpLogo;
