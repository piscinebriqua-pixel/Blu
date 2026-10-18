/**
 * Conversion d'un montant numérique en toutes lettres en français
 * avec gestion spécifique des Dinars Tunisiens et Millimes (3 décimales).
 */

const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'
];

const TENS = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'
];

function convertBelowThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return UNITS[n];

  const hundred = Math.floor(n / 100);
  const remainder = n % 100;

  let result = '';

  if (hundred > 0) {
    if (hundred === 1) {
      result += 'cent';
    } else {
      result += UNITS[hundred] + ' cent';
      if (remainder === 0) result += 's';
    }
    if (remainder > 0) result += ' ';
  }

  if (remainder === 0) return result;

  if (remainder < 20) {
    result += UNITS[remainder];
    return result;
  }

  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;

  if (tens === 7) {
    // 70 to 79
    if (units === 1) {
      result += 'soixante-et-onze';
    } else {
      result += 'soixante-' + UNITS[10 + units];
    }
  } else if (tens === 8) {
    // 80 to 89
    if (units === 0) {
      result += 'quatre-vingts';
    } else {
      result += 'quatre-vingt-' + UNITS[units];
    }
  } else if (tens === 9) {
    // 90 to 99
    result += 'quatre-vingt-' + UNITS[10 + units];
  } else {
    // 20-69
    if (units === 1) {
      result += TENS[tens] + '-et-un';
    } else if (units > 1) {
      result += TENS[tens] + '-' + UNITS[units];
    } else {
      result += TENS[tens];
    }
  }

  return result;
}

export function numberToFrenchWords(num: number): string {
  const integerPart = Math.floor(Math.abs(num));
  if (integerPart === 0) return 'zéro';

  let remaining = integerPart;
  const chunks: { value: number; labelSingular: string; labelPlural: string }[] = [];

  // Millions
  const millions = Math.floor(remaining / 1_000_000);
  remaining %= 1_000_000;
  if (millions > 0) {
    chunks.push({ value: millions, labelSingular: 'million', labelPlural: 'millions' });
  }

  // Milliers
  const thousands = Math.floor(remaining / 1_000);
  remaining %= 1_000;
  if (thousands > 0) {
    chunks.push({ value: thousands, labelSingular: 'mille', labelPlural: 'mille' });
  }

  // Unités
  if (remaining > 0) {
    chunks.push({ value: remaining, labelSingular: '', labelPlural: '' });
  }

  const words: string[] = [];

  for (const chunk of chunks) {
    const text = convertBelowThousand(chunk.value);
    if (!text) continue;

    if (chunk.labelSingular === 'mille') {
      if (chunk.value === 1) {
        words.push('mille');
      } else {
        words.push(text + ' mille');
      }
    } else if (chunk.labelSingular) {
      const label = chunk.value > 1 ? chunk.labelPlural : chunk.labelSingular;
      words.push(text + ' ' + label);
    } else {
      words.push(text);
    }
  }

  return words.join(' ');
}

/**
 * Convertit un montant en Dinars Tunisiens (3 décimales) en toutes lettres
 * Ex: 643.600 -> "Six cent quarante-trois Dinars et six cents Millimes"
 */
export function amountInWordsDT(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'Zéro Dinar';
  }

  const dinars = Math.floor(amount);
  const millimes = Math.round((amount - dinars) * 1000);

  let result = '';

  if (dinars > 0) {
    const dinarWords = numberToFrenchWords(dinars);
    result += dinarWords.charAt(0).toUpperCase() + dinarWords.slice(1);
    result += dinars > 1 ? ' Dinars' : ' Dinar';
  }

  if (millimes > 0) {
    const millimeWords = numberToFrenchWords(millimes);
    if (dinars > 0) {
      result += ' et ' + millimeWords + (millimes > 1 ? ' Millimes' : ' Millime');
    } else {
      result += millimeWords.charAt(0).toUpperCase() + millimeWords.slice(1) + (millimes > 1 ? ' Millimes' : ' Millime');
    }
  }

  return result.trim();
}
