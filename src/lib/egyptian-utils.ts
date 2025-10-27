// Currency and localization utilities for Egypt

export const CURRENCY = {
  EGP: 'EGP',
  SYMBOL: 'ج.م',
  DECIMAL_PLACES: 2
};

export const LOCALE = {
  ARABIC_EGYPT: 'ar-EG',
  TIMEZONE: 'Africa/Cairo'
};

export const VAT_RATE = 14; // 14% VAT in Egypt

/**
 * Format amount in Egyptian Pounds
 */
export function formatEGP(amount: number): string {
  // Handle NaN, undefined, or null values
  if (typeof amount !== 'number' || isNaN(amount)) {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      currencyDisplay: 'symbol'
    }).format(0);
  }
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    currencyDisplay: 'symbol'
  }).format(amount);
}

/**
 * Format amount as simple number with EGP symbol
 */
export function formatEGPSimple(amount: number): string {
  // Handle NaN, undefined, or null values
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0 ${CURRENCY.SYMBOL}`;
  }
  return `${amount.toLocaleString('ar-EG')} ${CURRENCY.SYMBOL}`;
}

/**
 * Calculate VAT amount
 */
export function calculateVAT(amount: number, vatRate: number = VAT_RATE): number {
  return (amount * vatRate) / 100;
}

/**
 * Calculate total with VAT
 */
export function calculateTotalWithVAT(amount: number, vatRate: number = VAT_RATE): number {
  return amount + calculateVAT(amount, vatRate);
}

/**
 * Format date in Egyptian Arabic format
 */
export function formatDateArabic(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: LOCALE.TIMEZONE
  }).format(dateObj);
}

/**
 * Format date and time in Egyptian Arabic format
 */
export function formatDateTimeArabic(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: LOCALE.TIMEZONE
  }).format(dateObj);
}

/**
 * Get current date in Cairo timezone
 */
export function getCairoTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: LOCALE.TIMEZONE}));
}

/**
 * Convert number to Arabic numerals
 */
export function toArabicNumerals(num: string | number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/[0-9]/g, (match) => arabicNumerals[parseInt(match)]);
}

/**
 * Egyptian phone number validation
 */
export function isValidEgyptianPhone(phone: string): boolean {
  // Egyptian phone formats: +201xxxxxxxxx or 01xxxxxxxxx
  const egyptianPhoneRegex = /^(\+201|01)[0-9]{9}$/;
  return egyptianPhoneRegex.test(phone.replace(/\s+/g, ''));
}

/**
 * Format Egyptian phone number
 */
export function formatEgyptianPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+201')) {
    return `+20 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
  } else if (cleaned.startsWith('01')) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  return phone;
}

/**
 * Egyptian business tax calculation
 */
export function calculateBusinessTax(income: number): number {
  // Simplified Egyptian business tax brackets
  if (income <= 600000) return 0; // Tax-free threshold
  if (income <= 700000) return (income - 600000) * 0.225;
  if (income <= 800000) return 22500 + (income - 700000) * 0.25;
  return 47500 + (income - 800000) * 0.275; // Simplified for higher brackets
}

/**
 * Working days calculator (excluding Egyptian holidays)
 */
export function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Exclude Fridays (5) and Saturdays (6) - weekend in Egypt
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  
  return workingDays;
}

/**
 * Egyptian company registration number validation
 */
export function isValidEgyptianTaxNumber(taxNumber: string): boolean {
  // Egyptian tax number format: 9 digits
  const taxNumberRegex = /^[0-9]{9}$/;
  return taxNumberRegex.test(taxNumber);
}