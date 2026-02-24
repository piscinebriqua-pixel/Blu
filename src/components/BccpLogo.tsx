import React from 'react';

interface BccpLogoProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    fillColor?: string; // 'white' applies invert filter; any other value = normal colors
    showBackground?: boolean;
    bgColor?: string;
}

/**
 * BccpLogo — uses the real BCCP logo SVG from /public/logo.svg.
 * Pass fillColor="white" to render the logo in white (e.g. on dark/blue headers).
 * Default renders the logo in its original colors.
 */
export const BccpLogo: React.FC<BccpLogoProps> = ({
    width = 180,
    height = 'auto',
    className = '',
    fillColor = 'original',
}) => {
    const isWhite = fillColor === 'white';

    return (
        <img
            src="/logo.svg"
            width={width}
            height={height}
            className={`${className} logo-img ${isWhite ? 'logo-white' : ''}`.trim()}
            alt="BCCP Logo"
        />
    );
};

export default BccpLogo;
