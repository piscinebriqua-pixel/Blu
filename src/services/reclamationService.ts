import { supabase, type ReclamationRow } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface CreateReclamationInput {
    clientId: string;
    poolId?: string | null;
    subject: string;
    category: 'eau' | 'materiel' | 'passage' | 'facturation' | 'autre';
    description: string;
}

/**
 * Récupère toutes les réclamations d'un client (Espace Client)
 */
export async function getClientReclamations(clientId: string): Promise<ReclamationRow[]> {
    try {
        const { data, error } = await supabase
            .from('reclamations')
            .select(`
                *,
                pool:pools!pool_id(id, name)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching client reclamations:', error);
            // Si la table n'est pas encore créée en base, on retourne une liste vide sans crasher l'UI
            return [];
        }
        return (data as ReclamationRow[]) || [];
    } catch (err) {
        console.error('Unexpected error fetching client reclamations:', err);
        return [];
    }
}

/**
 * Création d'une réclamation par le client
 */
export async function createClientReclamation(input: CreateReclamationInput): Promise<ReclamationRow | null> {
    try {
        const { data, error } = await supabase
            .from('reclamations')
            .insert({
                client_id: input.clientId,
                pool_id: input.poolId || null,
                subject: input.subject.trim(),
                category: input.category,
                description: input.description.trim(),
                status: 'en_cours',
                is_read_by_admin: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating reclamation:', error);
            toast.error("Impossible d'enregistrer la réclamation. Veuillez réessayer.");
            return null;
        }

        toast.success("Votre réclamation a été transmise à notre équipe !");
        return data as ReclamationRow;
    } catch (err) {
        console.error('Unexpected error creating reclamation:', err);
        toast.error("Une erreur inattendue est survenue.");
        return null;
    }
}

/**
 * Récupère le nombre de réclamations en cours pour le Dashboard Admin
 */
export async function getPendingReclamationsCount(): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('reclamations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'en_cours');

        if (error) {
            // Table non créée ou RLS
            return 0;
        }
        return count ?? 0;
    } catch {
        return 0;
    }
}

/**
 * Récupère les réclamations en cours pour la tuile de l'accueil Admin
 */
export async function getPendingReclamations(limit: number = 5): Promise<ReclamationRow[]> {
    try {
        const { data, error } = await supabase
            .from('reclamations')
            .select(`
                *,
                client:clients!client_id(id, first_name, last_name, phone, city),
                pool:pools!pool_id(id, name)
            `)
            .eq('status', 'en_cours')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.warn('Error fetching pending reclamations:', error);
            return [];
        }
        return (data as unknown as ReclamationRow[]) || [];
    } catch {
        return [];
    }
}

/**
 * Récupère toutes les réclamations pour la modale Admin (avec filtre optionnel)
 */
export async function getAllReclamations(filter: 'all' | 'en_cours' | 'cloturee' = 'all'): Promise<ReclamationRow[]> {
    try {
        let query = supabase
            .from('reclamations')
            .select(`
                *,
                client:clients!client_id(id, first_name, last_name, phone, city),
                pool:pools!pool_id(id, name)
            `)
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching all reclamations:', error);
            return [];
        }
        return (data as unknown as ReclamationRow[]) || [];
    } catch (err) {
        console.error('Unexpected error in getAllReclamations:', err);
        return [];
    }
}

/**
 * Clôturer une réclamation par l'admin avec réponse optionnelle
 */
export async function closeReclamation(
    id: string, 
    adminResponse?: string, 
    closedByProfileId?: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('reclamations')
            .update({
                status: 'cloturee',
                admin_response: adminResponse?.trim() || null,
                closed_at: new Date().toISOString(),
                closed_by: closedByProfileId || null,
                is_read_by_admin: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error closing reclamation:', error);
            toast.error("Échec lors de la clôture de la réclamation.");
            return false;
        }

        toast.success("Réclamation clôturée avec succès.");
        return true;
    } catch (err) {
        console.error('Unexpected error closing reclamation:', err);
        toast.error("Erreur inattendue.");
        return false;
    }
}

/**
 * Rouvrir une réclamation
 */
export async function reopenReclamation(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('reclamations')
            .update({
                status: 'en_cours',
                closed_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error reopening reclamation:', error);
            toast.error("Impossible de rouvrir la réclamation.");
            return false;
        }

        toast.success("Réclamation rouverte (En cours).");
        return true;
    } catch {
        return false;
    }
}
