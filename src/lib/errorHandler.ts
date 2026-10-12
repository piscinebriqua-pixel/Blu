import { toast } from 'react-hot-toast';

export interface AppErrorOptions {
    fallbackMessage?: string;
    showToast?: boolean;
}

/**
 * Standardized error handler for Blu application.
 * Logs error with context and displays a non-intrusive toast notification.
 */
export function handleAppError(
    error: unknown,
    options: AppErrorOptions = {}
): string {
    const { fallbackMessage = 'Une erreur inattendue est survenue.', showToast = true } = options;

    let message = fallbackMessage;
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        message = String((error as { message: unknown }).message);
    } else if (typeof error === 'string') {
        message = error;
    }

    console.error('[Blu Error]:', error);

    if (showToast) {
        toast.error(message);
    }

    return message;
}
