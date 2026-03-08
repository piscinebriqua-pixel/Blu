import { supabase } from './supabase';
import { addDays, setDay, startOfDay } from 'date-fns';

export async function handlePoolRecurrence(poolId: string, baseDate?: string) {
  try {
    // 1. Fetch active recurrence rule
    const { data: rule, error: ruleError } = await supabase
      .from('recurrence_rules')
      .select('*, template:intervention_templates(*)')
      .eq('pool_id', poolId)
      .eq('active', true)
      .maybeSingle();

    if (ruleError) throw ruleError;
    if (!rule) return null; // No active contract

    // 2. Calculate next date
    const startFrom = baseDate ? new Date(baseDate) : new Date();
    let nextDate = startOfDay(startFrom);
    
    // Check for duplicates: if we already generated something for this baseDate or after
    const baseDateStr = startFrom.toISOString().split('T')[0];
    if (rule.last_generated_date && rule.last_generated_date >= baseDateStr) {
      console.log(`[Recurrence] Déjà généré pour cette date (${baseDateStr}).`);
      return null;
    }

    // Frequency logic
    const daysToAdd = rule.frequency === 'weekly' ? 7 : rule.frequency === 'biweekly' ? 14 : 30;
    nextDate = addDays(nextDate, daysToAdd);

    // Day of week adjustment (0-6, where 0 is Sunday, 1 is Monday...)
    if (rule.day_of_week !== null) {
      nextDate = setDay(nextDate, rule.day_of_week, { weekStartsOn: 0 });
      // If the calculated day is in the past compared to the start date + buffer, we add a week
      if (nextDate <= startOfDay(startFrom)) {
         nextDate = addDays(nextDate, 7);
      }
    }

    const scheduledDateStr = nextDate.toISOString().split('T')[0];

    // 3. Create new scheduled intervention
    const { data: newInter, error: interError } = await supabase
      .from('interventions')
      .insert([{
        pool_id: poolId,
        technician_id: rule.technician_id,
        scheduled_date: scheduledDateStr,
        status: 'scheduled',
        // Copy tasks from template
        task_balai: rule.template?.task_balai || false,
        task_lavage: rule.template?.task_lavage || false,
        task_rincage: rule.template?.task_rincage || false,
        task_test_chlore: rule.template?.task_test_chlore || false,
        task_test_ph: rule.template?.task_test_ph || false,
        task_remplissage: rule.template?.task_remplissage || false,
        task_panier_prefiltre: rule.template?.task_panier_prefiltre || false,
        task_traitement: rule.template?.task_traitement || false,
        task_verif_vanne: rule.template?.task_verif_vanne || false,
        task_temps_fonctionnement: rule.template?.task_temps_fonctionnement || false,
      }])
      .select()
      .single();

    if (interError) throw interError;

    // 4. Update last_generated_date to prevent duplicates
    await supabase.from('recurrence_rules').update({
       last_generated_date: baseDateStr
    }).eq('id', rule.id);

    // 5. Copy services from template
    const { data: templateServices } = await supabase
      .from('template_services')
      .select('service_id')
      .eq('template_id', rule.template_id);

    if (templateServices && templateServices.length > 0) {
      const { data: actualServices } = await supabase
        .from('services')
        .select('id, price')
        .in('id', templateServices.map(s => s.service_id));

      if (actualServices) {
        await supabase.from('intervention_services').insert(
          actualServices.map(s => ({
            intervention_id: newInter.id,
            service_id: s.id,
            price_at_time: s.price
          }))
        );
      }
    }

    // 5. Copy products from template
    const { data: templateProducts } = await supabase
      .from('template_products')
      .select('product_id, quantity')
      .eq('template_id', rule.template_id);

    if (templateProducts && templateProducts.length > 0) {
        const { data: actualProducts } = await supabase
            .from('inventory_products')
            .select('id, price_per_unit')
            .in('id', templateProducts.map(p => p.product_id));
        
        if (actualProducts) {
            await supabase.from('intervention_products').insert(
                templateProducts.map(tp => {
                    const price = actualProducts.find(ap => ap.id === tp.product_id)?.price_per_unit || 0;
                    return {
                        intervention_id: newInter.id,
                        product_id: tp.product_id,
                        quantity: tp.quantity,
                        total_price: tp.quantity * price
                    };
                })
            );
        }
    }

    return newInter;
  } catch (error) {
    console.error('Error in handlePoolRecurrence:', error);
    return null;
  }
}
