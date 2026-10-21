import React from 'react';

interface BccpLogoProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    fillColor?: 'original' | 'white' | 'dark' | 'blue' | string;
    showBackground?: boolean;
    bgColor?: string;
}

/**
 * BccpLogo — uses the real BCCP logo SVG from /public/logo.svg.
 * Pass fillColor="white" to render the logo in white (e.g. on dark/blue headers).
 * Pass fillColor="blue" to render the logo in primary blue.
 * Default renders the logo in its original colors.
 */
export const BccpLogo: React.FC<BccpLogoProps> = ({
    width = 180,
    height = 'auto',
    className = '',
    fillColor = 'original',
}) => {
    const isWhite = fillColor === 'white';
    const isDark = fillColor === 'dark';
    const isBlue = fillColor === 'blue' || fillColor === 'primary';

    return (
        <img
            src="/logo.svg"
            width={width}
            height={height}
            className={`${className} logo-img ${isWhite ? 'logo-white' : ''} ${isDark ? 'logo-dark' : ''} ${isBlue ? 'logo-blue' : ''}`.trim()}
            alt="BCCP Logo"
        />
    );
};

export default BccpLogo;
