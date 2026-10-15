import { supabase } from './supabase';
import { addWeeks, setDay, startOfDay, parseISO, format, isBefore, isAfter } from 'date-fns';

export interface RecurrenceConfig {
  label: string;
  weeks: number;
  days: number;
}

export const FREQUENCY_CONFIG: Record<string, RecurrenceConfig> = {
  weekly: { label: 'Hebdomadaire (1 semaine)', weeks: 1, days: 7 },
  biweekly: { label: 'Quinzaine (2 semaines)', weeks: 2, days: 14 },
  triweekly: { label: 'Toutes les 3 semaines', weeks: 3, days: 21 },
  monthly: { label: 'Mensuel (4 semaines)', weeks: 4, days: 28 },
};

/**
 * Calcule la prochaine date d'ancrage en ajoutant le nombre exact de semaines défini
 * par la fréquence (7j, 14j, 21j ou 28j), garantissant que le jour de la semaine
 * reste STRICTEMENT IDENTIQUE sans aucune dérive calendaire.
 */
export function calculateNextAnchorDate(baseAnchorDate: Date, frequency: string): Date {
  const normFreq = frequency === 'hebdomadaire' ? 'weekly' : frequency;
  const config = FREQUENCY_CONFIG[normFreq] || FREQUENCY_CONFIG.weekly;
  return addWeeks(startOfDay(baseAnchorDate), config.weeks);
}

/**
 * Extrait la date d'ancrage nominale d'une intervention à partir de ses notes
 * ou calcule la date du jour d'ancrage nominal dans la semaine concernée.
 */
export function extractNominalAnchorDate(
  intervention: { scheduled_date?: string | null; notes?: string | null },
  ruleDayOfWeek?: number | null
): Date {
  if (intervention.notes) {
    const match = intervention.notes.match(/\[Ancrage:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\]/);
    if (match && match[1]) {
      return startOfDay(parseISO(match[1]));
    }
  }

  const baseDate = intervention.scheduled_date ? parseISO(intervention.scheduled_date) : new Date();
  if (ruleDayOfWeek !== undefined && ruleDayOfWeek !== null) {
    return startOfDay(setDay(baseDate, ruleDayOfWeek, { weekStartsOn: 0 }));
  }
  return startOfDay(baseDate);
}

/**
 * Récupère ou synchronise la règle de récurrence active pour un bassin.
 */
export async function getActiveRecurrenceRule(poolId: string) {
  // 1. Chercher dans recurrence_rules
  const { data: rule, error: ruleError } = await supabase
    .from('recurrence_rules')
    .select('*, template:intervention_templates(*)')
    .eq('pool_id', poolId)
    .eq('active', true)
    .maybeSingle();

  if (ruleError) throw ruleError;
  if (rule) return rule;

  // 2. Repli sur pools.is_contracted si la règle n'est pas encore instanciée
  const { data: poolData } = await supabase
    .from('pools')
    .select('id, is_contracted, maintenance_frequency, preferred_day')
    .eq('id', poolId)
    .maybeSingle();

  if (poolData && poolData.is_contracted) {
    const normFreq = poolData.maintenance_frequency === 'hebdomadaire' ? 'weekly' : (poolData.maintenance_frequency || 'weekly');
    const dayOfWeek = poolData.preferred_day !== null && poolData.preferred_day !== undefined ? poolData.preferred_day : 1;

    // Créer la règle automatiquement pour pérenniser le système
    const { data: createdRule } = await supabase
      .from('recurrence_rules')
      .insert([{
        pool_id: poolId,
        frequency: normFreq,
        day_of_week: dayOfWeek,
        active: true
      }])
      .select('*, template:intervention_templates(*)')
      .maybeSingle();

    return createdRule;
  }

  return null;
}

/**
 * Génère la prochaine intervention pour un bassin après validation ou annulation,
 * en s'assurant que la date calculée est ancrée sur le jour nominal et confiée au même technicien.
 */
export async function handlePoolRecurrence(poolId: string, baseDate?: string, nominalAnchorDateStr?: string) {
  try {
    const rule = await getActiveRecurrenceRule(poolId);
    if (!rule || !rule.active) return null;

    // Déterminer la date d'ancrage de base
    let baseAnchor: Date;
    if (nominalAnchorDateStr) {
      baseAnchor = startOfDay(parseISO(nominalAnchorDateStr));
    } else if (baseDate) {
      baseAnchor = extractNominalAnchorDate({ scheduled_date: baseDate }, rule.day_of_week);
    } else {
      baseAnchor = extractNominalAnchorDate({ scheduled_date: new Date().toISOString() }, rule.day_of_week);
    }

    // Calcul de la date d'ancrage suivante (J + N semaines selon la fréquence)
    let nextAnchorDate = calculateNextAnchorDate(baseAnchor, rule.frequency);

    // Si la date calculée est déjà passée par rapport à aujourd'hui, on avance jusqu'au prochain cycle futur
    const today = startOfDay(new Date());
    while (isBefore(nextAnchorDate, today)) {
      nextAnchorDate = calculateNextAnchorDate(nextAnchorDate, rule.frequency);
    }

    const scheduledDateStr = format(nextAnchorDate, 'yyyy-MM-dd');

    // Vérifier si une intervention existe déjà pour ce bassin à cette date ou après
    const { data: existingInter } = await supabase
      .from('interventions')
      .select('id')
      .eq('pool_id', poolId)
      .eq('scheduled_date', scheduledDateStr)
      .maybeSingle();

    if (existingInter) {
      console.log(`[Recurrence] Intervention déjà planifiée pour le ${scheduledDateStr}.`);
      return null;
    }

    const anchorTag = `[Ancrage: ${scheduledDateStr}]`;

    // Créer la nouvelle intervention
    const { data: newInter, error: interError } = await supabase
      .from('interventions')
      .insert([{
        pool_id: poolId,
        technician_id: rule.technician_id,
        scheduled_date: scheduledDateStr,
        status: 'scheduled',
        notes: anchorTag,
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

    // Mettre à jour last_generated_date sur la règle
    await supabase.from('recurrence_rules').update({
      last_generated_date: scheduledDateStr
    }).eq('id', rule.id);

    return newInter;
  } catch (error) {
    console.error('Error in handlePoolRecurrence:', error);
    return null;
  }
}

/**
 * Synchronise et génère les tournées pour tous les contrats actifs qui n'ont pas
 * encore d'intervention planifiée pour le cycle en cours.
 */
export async function syncActiveTours(technicianId?: string | null) {
  try {
    let query = supabase
      .from('recurrence_rules')
      .select('*, pool:pools(id, name, client_id, is_contracted)')
      .eq('active', true);

    if (technicianId) {
      query = query.eq('technician_id', technicianId);
    }

    const { data: rules } = await query;
    if (!rules || rules.length === 0) return;

    const today = startOfDay(new Date());

    for (const rule of rules) {
      if (!rule.pool_id) continue;

      // Calculer le jour d'ancrage le plus proche (aujourd'hui ou cette semaine)
      const dayOfWeek = rule.day_of_week !== null && rule.day_of_week !== undefined ? rule.day_of_week : 1;
      let targetDate = startOfDay(setDay(today, dayOfWeek, { weekStartsOn: 0 }));

      // Si le jour de cette semaine est passé, on vérifie s'il existe une intervention
      const targetDateStr = format(targetDate, 'yyyy-MM-dd');

      const { data: existing } = await supabase
        .from('interventions')
        .select('id, status, scheduled_date')
        .eq('pool_id', rule.pool_id)
        .gte('scheduled_date', targetDateStr)
        .limit(1);

      if (!existing || existing.length === 0) {
        // Aucune intervention future ou en cours : en créer une pour ce jour d'ancrage
        await handlePoolRecurrence(rule.pool_id, undefined, targetDateStr);
      }
    }
  } catch (err) {
    console.error('Error syncing active tours:', err);
  }
}

/**
 * Action Technicien : Valider une intervention en 1 clic (terminée avec succès).
 */
export async function completeTourInterventionQuick(interventionId: string, poolId: string, nominalDateStr?: string) {
  const { error } = await supabase
    .from('interventions')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString()
    })
    .eq('id', interventionId);

  if (error) throw error;

  // Générer la prochaine visite nominale ancrée
  await handlePoolRecurrence(poolId, undefined, nominalDateStr);
}

/**
 * Action Technicien : Marquer un client non visité avec motif obligatoire (laissé en attente dans le bac).
 */
export async function markTourInterventionUnvisited(interventionId: string, reason: string, existingNotes?: string | null) {
  const cleanReason = reason.trim();
  const dateFormatted = format(new Date(), 'dd/MM/yyyy');
  const logEntry = `[Non visité le ${dateFormatted} : ${cleanReason}]`;
  const updatedNotes = existingNotes ? `${existingNotes}\n${logEntry}` : logEntry;

  const { error } = await supabase
    .from('interventions')
    .update({
      status: 'unvisited',
      notes: updatedNotes
    })
    .eq('id', interventionId);

  if (error) throw error;
}

/**
 * Action Technicien : Reporter la visite ponctuelle à une date ultérieure choisie.
 * La prochaine récurrence restera ancrée sur le jour nominal normal.
 */
export async function postponeTourIntervention(
  interventionId: string,
  newScheduledDate: string,
  reason: string,
  existingNotes?: string | null
) {
  const cleanReason = reason.trim();
  const dateFormatted = format(new Date(), 'dd/MM/yyyy');
  const logEntry = `[Reporté le ${dateFormatted} au ${newScheduledDate} : ${cleanReason}]`;
  const updatedNotes = existingNotes ? `${existingNotes}\n${logEntry}` : logEntry;

  const { error } = await supabase
    .from('interventions')
    .update({
      status: 'scheduled',
      scheduled_date: newScheduledDate,
      notes: updatedNotes
    })
    .eq('id', interventionId);

  if (error) throw error;
}

/**
 * Action Technicien : Annuler uniquement cette occurrence ponctuelle.
 * La prochaine occurrence normale est immédiatement programmée sur le jour d'ancrage suivant.
 */
export async function cancelTourInterventionOccurrence(
  interventionId: string,
  poolId: string,
  reason: string,
  nominalDateStr?: string,
  existingNotes?: string | null
) {
  const cleanReason = reason.trim();
  const dateFormatted = format(new Date(), 'dd/MM/yyyy');
  const logEntry = `[Visite annulée le ${dateFormatted} : ${cleanReason}]`;
  const updatedNotes = existingNotes ? `${existingNotes}\n${logEntry}` : logEntry;

  const { error } = await supabase
    .from('interventions')
    .update({
      status: 'cancelled',
      notes: updatedNotes
    })
    .eq('id', interventionId);

  if (error) throw error;

  // Repositionner le prochain passage régulier
  await handlePoolRecurrence(poolId, undefined, nominalDateStr);
}

/**
 * Action Technicien : Suspendre la boucle récurrente du client (mise en pause du contrat).
 */
export async function suspendTourRecurrence(
  poolId: string,
  interventionId: string,
  reason: string,
  existingNotes?: string | null
) {
  const cleanReason = reason.trim();
  const dateFormatted = format(new Date(), 'dd/MM/yyyy');
  const logEntry = `[Contrat suspendu le ${dateFormatted} : ${cleanReason}]`;
  const updatedNotes = existingNotes ? `${existingNotes}\n${logEntry}` : logEntry;

  // 1. Annuler l'intervention courante
  await supabase
    .from('interventions')
    .update({
      status: 'cancelled',
      notes: updatedNotes
    })
    .eq('id', interventionId);

  // 2. Désactiver la règle de récurrence
  await supabase
    .from('recurrence_rules')
    .update({ active: false })
    .eq('pool_id', poolId);

  // 3. Mettre à jour le statut sur le bassin
  await supabase
    .from('pools')
    .update({ is_contracted: false })
    .eq('id', poolId);
}

/**
 * Calcule la date exacte du jour cible (0=Dimanche, 1=Lundi, ..., 6=Samedi)
 * pour la semaine de base donnée (semaine commençant le lundi).
 */
export function getDayInWeek(baseDate: Date, targetDayOfWeek: number): Date {
  const currentDay = baseDate.getDay();
  const currentOffset = currentDay === 0 ? 6 : currentDay - 1;
  const targetOffset = targetDayOfWeek === 0 ? 6 : targetDayOfWeek - 1;
  const diffDays = targetOffset - currentOffset;
  const result = new Date(baseDate);
  result.setDate(result.getDate() + diffDays);
  return startOfDay(result);
}

export interface BatchGenerationOptions {
  weeksAhead?: number;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface BatchGenerationResult {
  success: boolean;
  createdCount: number;
  alreadyExistingCount: number;
  totalChecked: number;
  error?: string;
}

/**
 * Génère en lot les visites récurrentes pour tous les bassins sous contrat actif
 * sur un horizon de N semaines ou jusqu'à une date de fin personnalisée.
 * 
 * GARANTIE STRICTE ANTI-DOUBLON (IDEMPOTENCE) :
 * Vérifie l'existence préalable d'interventions par :
 *  1. Date exacte planifiée (scheduled_date)
 *  2. Tag d'ancrage nominal dans les notes ([Ancrage: YYYY-MM-DD])
 * Si un administrateur clique plusieurs fois, aucun doublon n'est créé.
 */
export async function generateRecurringInterventionsBatch(
  optionsOrWeeks: number | BatchGenerationOptions = 4
): Promise<BatchGenerationResult> {
  try {
    const today = startOfDay(new Date());
    let horizon: Date;
    let weeksAhead: number;

    if (typeof optionsOrWeeks === 'number') {
      weeksAhead = optionsOrWeeks;
      horizon = addWeeks(today, weeksAhead);
    } else {
      if (optionsOrWeeks.endDate) {
        horizon = startOfDay(
          typeof optionsOrWeeks.endDate === 'string'
            ? parseISO(optionsOrWeeks.endDate)
            : optionsOrWeeks.endDate
        );
        const diffMs = horizon.getTime() - today.getTime();
        weeksAhead = Math.max(1, Math.ceil(diffMs / (7 * 24 * 3600 * 1000)));
      } else {
        weeksAhead = optionsOrWeeks.weeksAhead || 4;
        horizon = addWeeks(today, weeksAhead);
      }
    }

    // 1. Récupérer tous les bassins avec contrat actif
    const { data: pools, error: poolsError } = await supabase
      .from('pools')
      .select('id, name, client_id, is_contracted, maintenance_frequency, preferred_day, last_maintenance_date')
      .eq('is_contracted', true);

    if (poolsError) throw poolsError;
    if (!pools || pools.length === 0) {
      return { success: true, createdCount: 0, alreadyExistingCount: 0, totalChecked: 0 };
    }

    const poolIds = pools.map((p) => p.id);

    // 2. Récupérer les règles de récurrence actives existantes
    const { data: rules } = await supabase
      .from('recurrence_rules')
      .select('*, template:intervention_templates(*)')
      .in('pool_id', poolIds)
      .eq('active', true);

    const rulesByPoolId = new Map<string, any>();
    if (rules) {
      for (const r of rules) {
        rulesByPoolId.set(r.pool_id, r);
      }
    }

    // 3. Récupérer toutes les interventions existantes pour ces bassins
    const { data: existingInters, error: intersError } = await supabase
      .from('interventions')
      .select('id, pool_id, scheduled_date, notes, status, technician_id')
      .in('pool_id', poolIds);

    if (intersError) throw intersError;

    const intersByPoolId = new Map<string, any[]>();
    for (const inter of existingInters || []) {
      const list = intersByPoolId.get(inter.pool_id) || [];
      list.push(inter);
      intersByPoolId.set(inter.pool_id, list);
    }

    const interventionsToInsert: any[] = [];
    const rulesToSync: any[] = [];
    let alreadyExistingCount = 0;

    for (const pool of pools) {
      const rule = rulesByPoolId.get(pool.id);
      const rawFreq = pool.maintenance_frequency === 'hebdomadaire'
        ? 'weekly'
        : (pool.maintenance_frequency || rule?.frequency || 'weekly');
      const stepWeeks = rawFreq === 'biweekly' ? 2 : rawFreq === 'triweekly' ? 3 : rawFreq === 'monthly' ? 4 : 1;
      const prefDay = pool.preferred_day !== null && pool.preferred_day !== undefined
        ? pool.preferred_day
        : (rule?.day_of_week ?? 1);

      const poolInters = intersByPoolId.get(pool.id) || [];
      const sortedInters = [...poolInters]
        .filter((i) => i.scheduled_date)
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

      const lastInter = sortedInters[0];
      const techId = rule?.technician_id || lastInter?.technician_id || null;

      // Calcul des dates cibles candidates dans l'horizon [today, horizon]
      const candidateDates: Date[] = [];
      if (stepWeeks === 1) {
        // Hebdomadaire : chaque semaine jusqu'à l'horizon
        for (let w = 0; w <= weeksAhead + 1; w++) {
          const weekBase = addWeeks(today, w);
          const target = getDayInWeek(weekBase, prefDay);
          if (!isBefore(target, today) && !isAfter(target, horizon)) {
            candidateDates.push(target);
          }
        }
      } else {
        // Quinzaine / Mensuel / etc. : ancrage régulier
        let anchor: Date;
        if (lastInter && lastInter.scheduled_date) {
          anchor = startOfDay(parseISO(lastInter.scheduled_date.split('T')[0]));
          while (isBefore(anchor, today)) {
            anchor = addWeeks(anchor, stepWeeks);
          }
        } else {
          anchor = getDayInWeek(today, prefDay);
          if (isBefore(anchor, today)) {
            anchor = addWeeks(anchor, 1);
          }
        }

        while (!isAfter(anchor, horizon)) {
          if (!isBefore(anchor, today)) {
            candidateDates.push(anchor);
          }
          anchor = addWeeks(anchor, stepWeeks);
        }
      }

      let maxGeneratedDateStr: string | null = null;

      // Filtrage anti-doublon strict pour chaque date cible
      for (const targetDate of candidateDates) {
        const dateStr = format(targetDate, 'yyyy-MM-dd');
        const anchorTag = `[Ancrage: ${dateStr}]`;

        // Vérifier si une intervention existe déjà pour ce bassin à cette date ou avec ce tag
        const existsInDb = poolInters.some((i) => {
          if (!i.scheduled_date) return false;
          const iDate = i.scheduled_date.split('T')[0];
          if (iDate === dateStr) return true;
          if (i.notes && i.notes.includes(anchorTag)) return true;
          return false;
        });

        // Vérifier aussi si on ne l'a pas déjà ajoutée dans le lot courant
        const existsInCurrentBatch = interventionsToInsert.some(
          (i) => i.pool_id === pool.id && i.scheduled_date === dateStr
        );

        if (existsInDb || existsInCurrentBatch) {
          alreadyExistingCount++;
        } else {
          interventionsToInsert.push({
            pool_id: pool.id,
            technician_id: techId,
            scheduled_date: dateStr,
            status: 'scheduled',
            notes: `${anchorTag} Visite d'entretien récurrente`,
            task_balai: rule?.template?.task_balai ?? true,
            task_lavage: rule?.template?.task_lavage ?? true,
            task_rincage: rule?.template?.task_rincage ?? true,
            task_test_chlore: rule?.template?.task_test_chlore ?? true,
            task_test_ph: rule?.template?.task_test_ph ?? true,
            task_remplissage: rule?.template?.task_remplissage ?? true,
            task_panier_prefiltre: rule?.template?.task_panier_prefiltre ?? true,
            task_traitement: rule?.template?.task_traitement ?? true,
            task_verif_vanne: rule?.template?.task_verif_vanne ?? true,
            task_temps_fonctionnement: rule?.template?.task_temps_fonctionnement ?? true,
          });

          if (!maxGeneratedDateStr || dateStr > maxGeneratedDateStr) {
            maxGeneratedDateStr = dateStr;
          }
        }
      }

      rulesToSync.push({
        id: rule?.id,
        pool_id: pool.id,
        technician_id: techId,
        frequency: rawFreq,
        day_of_week: prefDay,
        last_generated_date: maxGeneratedDateStr || rule?.last_generated_date || null,
      });
    }

    // 4. Insertion en base des nouvelles interventions (par blocs de 50)
    if (interventionsToInsert.length > 0) {
      for (let i = 0; i < interventionsToInsert.length; i += 50) {
        const chunk = interventionsToInsert.slice(i, i + 50);
        const { error: insertError } = await supabase.from('interventions').insert(chunk);
        if (insertError) throw insertError;
      }
    }

    // 5. Synchroniser recurrence_rules
    for (const ruleItem of rulesToSync) {
      if (ruleItem.id) {
        await supabase
          .from('recurrence_rules')
          .update({
            technician_id: ruleItem.technician_id,
            frequency: ruleItem.frequency,
            day_of_week: ruleItem.day_of_week,
            active: true,
            last_generated_date: ruleItem.last_generated_date,
          })
          .eq('id', ruleItem.id);
      } else {
        const { data: existing } = await supabase
          .from('recurrence_rules')
          .select('id')
          .eq('pool_id', ruleItem.pool_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('recurrence_rules')
            .update({
              technician_id: ruleItem.technician_id,
              frequency: ruleItem.frequency,
              day_of_week: ruleItem.day_of_week,
              active: true,
              last_generated_date: ruleItem.last_generated_date,
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('recurrence_rules').insert([
            {
              pool_id: ruleItem.pool_id,
              technician_id: ruleItem.technician_id,
              frequency: ruleItem.frequency,
              day_of_week: ruleItem.day_of_week,
              active: true,
              last_generated_date: ruleItem.last_generated_date,
            },
          ]);
        }
      }
    }

    return {
      success: true,
      createdCount: interventionsToInsert.length,
      alreadyExistingCount,
      totalChecked: interventionsToInsert.length + alreadyExistingCount,
    };
  } catch (error: any) {
    console.error('Error in generateRecurringInterventionsBatch:', error);
    return {
      success: false,
      createdCount: 0,
      alreadyExistingCount: 0,
      totalChecked: 0,
      error: error.message || 'Erreur inconnue',
    };
  }
}

