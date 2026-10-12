import { toast } from 'react-hot-toast';

export interface PhoneCountryInfo {
    country: string;
    code: string;
    flag: string;
    cleanNumber: string;
    isValid: boolean;
    displayHint?: string;
}

/**
 * Nettoie et analyse un numéro de téléphone pour détecter le pays et formater pour WhatsApp
 */
export const detectPhoneInfo = (rawPhone: string): PhoneCountryInfo => {
    if (!rawPhone || !rawPhone.trim()) {
        return {
            country: '',
            code: '',
            flag: '',
            cleanNumber: '',
            isValid: false
        };
    }

    let trimmed = rawPhone.trim();

    // Remplacer 00 en tête par + (standard international)
    if (trimmed.startsWith('00')) {
        trimmed = '+' + trimmed.slice(2);
    }

    // Retirer tous les séparateurs courants (espaces, tirets, points, parenthèses)
    const cleaned = trimmed.replace(/[\s\-\.\(\)]/g, '');

    // Cas 1 : Format avec + explicite (ex: +33..., +216..., etc.)
    if (cleaned.startsWith('+')) {
        const withoutPlus = cleaned.slice(1);

        // Tunisie avec +216
        if (withoutPlus.startsWith('216')) {
            const localPart = withoutPlus.slice(3);
            const isValid = localPart.length === 8;
            return {
                country: 'Tunisie',
                code: '+216',
                flag: '🇹🇳',
                cleanNumber: `216${localPart}`,
                isValid,
                displayHint: isValid ? '+216 ' + localPart : 'Numéro tunisien (8 chiffres requis)'
            };
        }

        // France avec +33
        if (withoutPlus.startsWith('33')) {
            let localPart = withoutPlus.slice(2);
            // Si l'utilisateur a tapé +3306... au lieu de +336...
            if (localPart.startsWith('0')) {
                localPart = localPart.slice(1);
            }
            const isValid = localPart.length === 9;
            return {
                country: 'France',
                code: '+33',
                flag: '🇫🇷',
                cleanNumber: `33${localPart}`,
                isValid,
                displayHint: isValid ? '+33 ' + localPart : 'Numéro français (9 chiffres requis)'
            };
        }

        // Italie (+39)
        if (withoutPlus.startsWith('39')) {
            const localPart = withoutPlus.slice(2);
            return {
                country: 'Italie',
                code: '+39',
                flag: '🇮🇹',
                cleanNumber: withoutPlus,
                isValid: localPart.length >= 9 && localPart.length <= 11,
                displayHint: '+39 ' + localPart
            };
        }

        // Allemagne (+49)
        if (withoutPlus.startsWith('49')) {
            const localPart = withoutPlus.slice(2);
            return {
                country: 'Allemagne',
                code: '+49',
                flag: '🇩🇪',
                cleanNumber: withoutPlus,
                isValid: localPart.length >= 9 && localPart.length <= 12,
                displayHint: '+49 ' + localPart
            };
        }

        // Belgique (+32)
        if (withoutPlus.startsWith('32')) {
            let localPart = withoutPlus.slice(2);
            if (localPart.startsWith('0')) localPart = localPart.slice(1);
            return {
                country: 'Belgique',
                code: '+32',
                flag: '🇧🇪',
                cleanNumber: `32${localPart}`,
                isValid: localPart.length >= 8 && localPart.length <= 9,
                displayHint: '+32 ' + localPart
            };
        }

        // Suisse (+41)
        if (withoutPlus.startsWith('41')) {
            let localPart = withoutPlus.slice(2);
            if (localPart.startsWith('0')) localPart = localPart.slice(1);
            return {
                country: 'Suisse',
                code: '+41',
                flag: '🇨🇭',
                cleanNumber: `41${localPart}`,
                isValid: localPart.length === 9,
                displayHint: '+41 ' + localPart
            };
        }

        // Royaume-Uni (+44)
        if (withoutPlus.startsWith('44')) {
            let localPart = withoutPlus.slice(2);
            if (localPart.startsWith('0')) localPart = localPart.slice(1);
            return {
                country: 'Royaume-Uni',
                code: '+44',
                flag: '🇬🇧',
                cleanNumber: `44${localPart}`,
                isValid: localPart.length === 10,
                displayHint: '+44 ' + localPart
            };
        }

        // USA / Canada (+1)
        if (withoutPlus.startsWith('1')) {
            const localPart = withoutPlus.slice(1);
            return {
                country: 'USA / Canada',
                code: '+1',
                flag: '🇺🇸',
                cleanNumber: withoutPlus,
                isValid: localPart.length === 10,
                displayHint: '+1 ' + localPart
            };
        }

        // Autre pays avec indicatif +
        const digitsOnly = withoutPlus.replace(/\D/g, '');
        const isValid = digitsOnly.length >= 8 && digitsOnly.length <= 15;
        return {
            country: 'International',
            code: '+' + digitsOnly.slice(0, 3),
            flag: '🌍',
            cleanNumber: digitsOnly,
            isValid,
            displayHint: '+' + digitsOnly
        };
    }

    // Chiffres uniquement (sans +)
    const digits = cleaned.replace(/\D/g, '');

    // Cas 2 : Numéro avec 216 déjà inclus (11 chiffres : 216 + 8 chiffres)
    if (digits.startsWith('216') && digits.length === 11) {
        const localPart = digits.slice(3);
        return {
            country: 'Tunisie',
            code: '+216',
            flag: '🇹🇳',
            cleanNumber: digits,
            isValid: true,
            displayHint: '+216 ' + localPart
        };
    }

    // Cas 3 : Numéro tunisien standard à 8 chiffres sans indicatif
    if (digits.length === 8) {
        return {
            country: 'Tunisie',
            code: '+216',
            flag: '🇹🇳',
            cleanNumber: `216${digits}`,
            isValid: true,
            displayHint: '+216 ' + digits
        };
    }

    // Cas 4 : Numéro mobile français sans indicatif (06... ou 07... sur 10 chiffres)
    if (digits.length === 10 && (digits.startsWith('06') || digits.startsWith('07'))) {
        const localPart = digits.slice(1); // Enlever le 0 initial
        return {
            country: 'France',
            code: '+33',
            flag: '🇫🇷',
            cleanNumber: `33${localPart}`,
            isValid: true,
            displayHint: '+33 ' + localPart
        };
    }

    // Cas 5 : Saisie en cours ou numéro incomplet
    if (digits.length < 8) {
        return {
            country: 'En cours...',
            code: '',
            flag: '⏳',
            cleanNumber: digits,
            isValid: false,
            displayHint: 'Minimum 8 chiffres requis'
        };
    }

    // Cas par défaut : Si commence par 216 mais mauvaise longueur
    if (digits.startsWith('216')) {
        return {
            country: 'Tunisie',
            code: '+216',
            flag: '🇹🇳',
            cleanNumber: digits,
            isValid: digits.length === 11,
            displayHint: 'Doit comporter 8 chiffres après 216'
        };
    }

    // Numéro étranger sans signe +, longueur entre 9 et 15 chiffres
    if (digits.length >= 9 && digits.length <= 15) {
        return {
            country: 'International',
            code: '',
            flag: '🌍',
            cleanNumber: digits,
            isValid: true,
            displayHint: digits
        };
    }

    return {
        country: 'Invalide',
        code: '',
        flag: '⚠️',
        cleanNumber: digits,
        isValid: false,
        displayHint: 'Format de téléphone non reconnu'
    };
};

/**
 * Génère l'URL WhatsApp nettoyée ou null si invalide
 */
export const getWhatsAppUrl = (phone: string, message?: string): string | null => {
    if (!phone) return null;
    const info = detectPhoneInfo(phone);
    if (!info.isValid || !info.cleanNumber) return null;

    const base = `https://wa.me/${info.cleanNumber}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

/**
 * Ouvre une conversation WhatsApp dans un nouvel onglet avec notification d'erreur automatique si invalide
 */
export const openWhatsAppChat = (phone: string, message?: string): boolean => {
    const url = getWhatsAppUrl(phone, message);
    if (!url) {
        toast.error('Numéro de téléphone invalide pour WhatsApp');
        return false;
    }
    window.open(url, '_blank');
    return true;
};
