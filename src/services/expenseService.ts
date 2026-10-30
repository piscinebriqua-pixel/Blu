import { supabase, type ExpenseRow, type ExpenseCategoryRow, type ExpensePaymentMethod, type ExpenseStatus } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

export interface ExpenseInput {
    technician_id?: string | null;
    category_id: string;
    amount: number;
    expense_date?: string;
    payment_method: ExpensePaymentMethod;
    supplier?: string | null;
    description?: string | null;
    receipt_url?: string | null;
    vat_rate?: number;
    tax_amount?: number;
    client_id?: string | null;
    vehicle_id?: string | null;
    kilometers?: number | null;
    liters?: number | null;
    status?: ExpenseStatus;
}

export interface ExpenseFilters {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    technicianId?: string;
    paymentMethod?: string;
    status?: string;
    search?: string;
}

/**
 * Récupère la liste des catégories de dépenses disponibles
 */
export async function getExpenseCategories(): Promise<ExpenseCategoryRow[]> {
    try {
        const { data, error } = await supabase
            .from('expense_categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return (data as ExpenseCategoryRow[]) || [];
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur chargement catégories';
        toast.error(msg);
        return [];
    }
}

/**
 * Récupère la liste des dépenses avec relations et filtres
 */
export async function getExpenses(filters?: ExpenseFilters): Promise<ExpenseRow[]> {
    try {
        let query = supabase
            .from('expenses')
            .select(`
                *,
                technician:technicians(id, full_name),
                category:expense_categories(id, name, icon),
                client:clients(id, first_name, last_name),
                vehicle:vehicles(id, name, plate)
            `)
            .order('expense_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (filters?.startDate) {
            query = query.gte('expense_date', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('expense_date', filters.endDate);
        }
        if (filters?.categoryId && filters.categoryId !== 'all') {
            query = query.eq('category_id', filters.categoryId);
        }
        if (filters?.technicianId) {
            if (filters.technicianId === 'company') {
                query = query.is('technician_id', null);
            } else if (filters.technicianId !== 'all') {
                query = query.eq('technician_id', filters.technicianId);
            }
        }
        if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
            query = query.eq('payment_method', filters.paymentMethod);
        }
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) throw error;

        let results = (data as ExpenseRow[]) || [];

        // Filtre textuel si spécifié (recherche sur fournisseur ou description)
        if (filters?.search && filters.search.trim() !== '') {
            const s = filters.search.toLowerCase().trim();
            results = results.filter(item => 
                (item.supplier && item.supplier.toLowerCase().includes(s)) ||
                (item.description && item.description.toLowerCase().includes(s)) ||
                (item.category?.name && item.category.name.toLowerCase().includes(s))
            );
        }

        return results;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur chargement dépenses';
        toast.error(msg);
        return [];
    }
}

/**
 * Crée une nouvelle dépense
 */
export async function createExpense(input: ExpenseInput): Promise<ExpenseRow | null> {
    try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id || null;

        const payload = {
            technician_id: input.technician_id || null,
            category_id: input.category_id,
            amount: Number(input.amount),
            expense_date: input.expense_date || new Date().toISOString().split('T')[0],
            payment_method: input.payment_method,
            supplier: input.supplier?.trim() || null,
            description: input.description?.trim() || null,
            receipt_url: input.receipt_url || null,
            vat_rate: Number(input.vat_rate || 0),
            tax_amount: Number(input.tax_amount || 0),
            client_id: input.client_id || null,
            vehicle_id: input.vehicle_id || null,
            kilometers: input.kilometers ? Number(input.kilometers) : null,
            liters: input.liters ? Number(input.liters) : null,
            status: input.status || 'validated',
            validated_by: userId,
            validated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('expenses')
            .insert(payload)
            .select(`
                *,
                technician:technicians(id, full_name),
                category:expense_categories(id, name, icon),
                client:clients(id, first_name, last_name),
                vehicle:vehicles(id, name, plate)
            `)
            .single();

        if (error) throw error;

        toast.success('Dépense enregistrée avec succès');
        return data as ExpenseRow;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la création de la dépense';
        toast.error(msg);
        return null;
    }
}

/**
 * Met à jour une dépense existante
 */
export async function updateExpense(id: string, input: Partial<ExpenseInput>): Promise<ExpenseRow | null> {
    try {
        const payload: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (input.technician_id !== undefined) payload.technician_id = input.technician_id;
        if (input.category_id !== undefined) payload.category_id = input.category_id;
        if (input.amount !== undefined) payload.amount = Number(input.amount);
        if (input.expense_date !== undefined) payload.expense_date = input.expense_date;
        if (input.payment_method !== undefined) payload.payment_method = input.payment_method;
        if (input.supplier !== undefined) payload.supplier = input.supplier?.trim() || null;
        if (input.description !== undefined) payload.description = input.description?.trim() || null;
        if (input.receipt_url !== undefined) payload.receipt_url = input.receipt_url;
        if (input.vat_rate !== undefined) payload.vat_rate = Number(input.vat_rate);
        if (input.tax_amount !== undefined) payload.tax_amount = Number(input.tax_amount);
        if (input.client_id !== undefined) payload.client_id = input.client_id;
        if (input.vehicle_id !== undefined) payload.vehicle_id = input.vehicle_id;
        if (input.kilometers !== undefined) payload.kilometers = input.kilometers ? Number(input.kilometers) : null;
        if (input.liters !== undefined) payload.liters = input.liters ? Number(input.liters) : null;
        if (input.status !== undefined) payload.status = input.status;

        const { data, error } = await supabase
            .from('expenses')
            .update(payload)
            .eq('id', id)
            .select(`
                *,
                technician:technicians(id, full_name),
                category:expense_categories(id, name, icon),
                client:clients(id, first_name, last_name),
                vehicle:vehicles(id, name, plate)
            `)
            .single();

        if (error) throw error;

        toast.success('Dépense modifiée avec succès');
        return data as ExpenseRow;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur modification dépense';
        toast.error(msg);
        return null;
    }
}

/**
 * Supprime une dépense
 */
export async function deleteExpense(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;

        toast.success('Dépense supprimée');
        return true;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur suppression dépense';
        toast.error(msg);
        return false;
    }
}

/**
 * Compresse et uploade une photo de reçu dans le bucket 'expenses-receipts'
 */
export async function uploadReceiptFile(file: File): Promise<string | null> {
    try {
        const options = {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 1400,
            useWebWorker: false,
            initialQuality: 0.75,
        };

        let fileToUpload: File = file;
        try {
            fileToUpload = await imageCompression(file, options);
        } catch (compressionError) {
            console.warn('Image compression fallback to original:', compressionError);
            fileToUpload = file;
        }

        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('expenses-receipts')
            .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('expenses-receipts')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Échec upload du justificatif';
        toast.error(msg);
        return null;
    }
}

