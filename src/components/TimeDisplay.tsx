import React, { useEffect, useState } from 'react';

interface TimeDisplayProps {
    className?: string;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ className = "" }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <span className={className}>
            {time.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })}
        </span>
    );
};

export default TimeDisplay;
