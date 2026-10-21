/**
 * Helpers pour la validation et le formatage du Matricule Fiscal Tunisien (Norme DGI).
 * Structure officielle : 7 ou 8 chiffres / Clé de contrôle (1 lettre) / Catégorie TVA (1 lettre) / N° Établissement (3 chiffres)
 * Exemple type : 1234567/A/M/000 (M = Personne morale / Société, P = Personne physique)
 */

export const TUNISIAN_TAX_ID_EXAMPLE = '1234567/A/M/000';

export const TUNISIAN_BANKS = [
  'BIAT',
  'Attijari Bank',
  'Amen Bank',
  'BNA (Banque Nationale Agricole)',
  'STB (Société Tunisienne de Banque)',
  'BH Bank',
  'UIB (Union Internationale de Banques)',
  'UBCI',
  'Banque de Tunisie (BT)',
  'ATB (Arab Tunisian Bank)',
  'Banque Zitouna',
  'Al Baraka Bank',
  'WIFAK Bank',
  'QNB Tunisie',
  'BTK (Banque Tuniso-Koweitienne)',
  'BTL (Banque Tuniso-Libyenne)',
  'TSB (Tunisian Saudi Bank)',
  'Autre / Saisie libre'
];

/**
 * Nettoie et formate automatiquement une chaîne pour correspondre à la norme tunisienne
 * Ex: '1234567am000' -> '1234567/A/M/000'
 * Ex: '1234567-a-m-000' -> '1234567/A/M/000'
 */
export function formatTunisianTaxId(val: string): string {
  if (!val) return '';
  let cleaned = val.toUpperCase().trim();

  // Si l'utilisateur saisit avec des tirets ou espaces au lieu de slashs
  cleaned = cleaned.replace(/\s*[\/\-\.]\s*/g, '/');

  // Si l'utilisateur a saisi d'une traite sans séparateurs (ex: 1234567AM000 ou 12345678AM000)
  const compactMatch = cleaned.match(/^(\d{7,8})([A-Z])([A-Z])(\d{3})$/);
  if (compactMatch) {
    return `${compactMatch[1]}/${compactMatch[2]}/${compactMatch[3]}/${compactMatch[4]}`;
  }

  // Format partiel lors de la frappe fluide : 7 chiffres suivis de lettres
  const partialMatch = cleaned.match(/^(\d{7,8})([A-Z])([A-Z])?(\d{1,3})?$/);
  if (partialMatch && !cleaned.includes('/')) {
    const p1 = partialMatch[1];
    const p2 = partialMatch[2];
    const p3 = partialMatch[3] ? `/${partialMatch[3]}` : '';
    const p4 = partialMatch[4] ? `/${partialMatch[4]}` : '';
    return `${p1}/${p2}${p3}${p4}`;
  }

  return cleaned;
}

/**
 * Vérifie si le matricule fiscal respecte rigoureusement la norme tunisienne
 */
export function isTunisianTaxId(val: string): boolean {
  if (!val) return false;
  return /^\d{7,8}\/[A-Z]\/[A-Z]\/\d{3}$/.test(val.trim());
}
