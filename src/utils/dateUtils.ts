
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Default Brazilian date formats
export const BR_DATE_FORMAT = 'dd/MM/yyyy';
export const BR_TIME_FORMAT = 'HH:mm';
export const BR_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

/**
 * Format a date string or Date object to Brazilian format (DD/MM/YYYY)
 */
export const formatDateBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, BR_DATE_FORMAT, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format a datetime string or Date object to Brazilian format (DD/MM/YYYY HH:mm)
 */
export const formatDateTimeBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, BR_DATETIME_FORMAT, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

/**
 * Format time only to Brazilian format (HH:mm)
 */
export const formatTimeBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, BR_TIME_FORMAT, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
};

/**
 * Get current date and time formatted in Brazilian timezone
 */
export const getCurrentDateTimeBR = (): string => {
  return formatDateTimeBR(new Date());
};

/**
 * Parse a Brazilian date string (DD/MM/YYYY) to Date object
 */
export const parseBRDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    const [day, month, year] = dateString.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } catch (error) {
    console.error('Error parsing Brazilian date:', error);
    return null;
  }
};
