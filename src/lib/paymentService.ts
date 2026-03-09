import { supabase } from './supabase';

/**
 * Recalculates the distribution of payments across interventions for a specific client
 * using FIFO (First-In-First-Out) logic.
 */
export async function recalculateVentilation(clientId: string) {
    try {
        console.log(`[FIFO] Recalculating ventilation for client: ${clientId}`);

        // 1. Fetch all interventions for this client sorted by date
        const { data: interventions, error: interError } = await supabase
            .from('interventions')
            .select(`
                id,
                completed_date,
                scheduled_date,
                created_at,
                services:intervention_services(price_at_time),
                products:intervention_products(total_price)
            `)
            .in('pool_id', (
                await supabase.from('pools').select('id').eq('client_id', clientId)
            ).data?.map(p => p.id) || [])
            .order('created_at', { ascending: true });

        if (interError) throw interError;

        // 2. Fetch all payments for this client
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('id, amount, payment_date')
            .eq('client_id', clientId)
            .order('payment_date', { ascending: true });

        if (payError) throw payError;

        // 3. Clear existing distribution for this client
        // First get the IDs of intervention_payments to delete
        const interIds = interventions?.map(i => i.id) || [];
        if (interIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('intervention_payments')
                .delete()
                .in('intervention_id', interIds);

            if (deleteError) throw deleteError;
        }

        // 4. Calculate distributions
        let totalEncaisse = payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
        const distributions: any[] = [];

        // Prepare interventions with their total billed amounts
        const intersWithBilled = interventions?.map(inter => {
            const sTotal = inter.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
            const pTotal = inter.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
            return {
                id: inter.id,
                totalBilled: sTotal + pTotal,
                remainingToPay: sTotal + pTotal
            };
        }) || [];

        // Distribute the totalEncaisse across interventions
        // We use a simplified distribution: we don't necessarily link to a specific payment ID
        // but rather distribute the global "pot" of payments.
        // HOWEVER, the table intervention_payments requires a payment_id.
        // So we will distribute payment by payment for better tracking.

        let remainingPot = totalEncaisse;
        const paymentsSorted = [...(payments || [])];

        for (const payment of paymentsSorted) {
            let paymentRemaining = payment.amount || 0;

            for (const inter of intersWithBilled) {
                if (paymentRemaining <= 0) break;
                if (inter.remainingToPay <= 0) continue;

                const amountToApply = Math.min(paymentRemaining, inter.remainingToPay);

                distributions.push({
                    payment_id: payment.id,
                    intervention_id: inter.id,
                    amount_applied: amountToApply
                });

                paymentRemaining -= amountToApply;
                inter.remainingToPay -= amountToApply;
                remainingPot -= amountToApply;
            }
        }

        // 5. Save new distributions
        if (distributions.length > 0) {
            const { error: insertError } = await supabase
                .from('intervention_payments')
                .insert(distributions);

            if (insertError) throw insertError;
        }

        console.log(`[FIFO] Successfully distributed ${distributions.length} payments across interventions.`);
        return { success: true };

    } catch (error: any) {
        console.error('[FIFO] Recalculation failed:', error);
        return { success: false, error: error.message };
    }
}
