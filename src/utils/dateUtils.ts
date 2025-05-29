
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
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '';
    
    return format(dateObj, BR_DATE_FORMAT, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a datetime string or Date object to Brazilian format (DD/MM/YYYY HH:mm)
 * Returns an object with separate date and time strings
 */
export const formatDateTimeBR = (date: string | Date | null | undefined): { date: string; time: string } => {
  if (!date) return { date: '', time: '' };
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return { date: '', time: '' };
    
    return {
      date: format(dateObj, BR_DATE_FORMAT, { locale: ptBR }),
      time: format(dateObj, BR_TIME_FORMAT, { locale: ptBR })
    };
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return { date: '', time: '' };
  }
};

/**
 * Format time only to Brazilian format (HH:mm)
 */
export const formatTimeBR = (time: string | null | undefined): string => {
  if (!time) return '';
  
  try {
    // Se o time vem como string no formato HH:mm
    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      return time.substring(0, 5); // Pegar apenas HH:mm
    }
    
    // Se for uma data completa, extrair apenas a hora
    const dateObj = parseISO(time);
    if (isNaN(dateObj.getTime())) return '';
    
    return format(dateObj, BR_TIME_FORMAT, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * Combine separate date and time strings into display format
 * Returns object with separate date and time strings
 */
export const formatDateTimeFromSeparate = (date: string | null | undefined, time: string | null | undefined): { date: string; time: string; combined: string } => {
  const formattedDate = formatDateBR(date);
  const formattedTime = formatTimeBR(time);
  
  let combined = '';
  if (formattedDate && formattedTime) {
    combined = `${formattedDate} ${formattedTime}`;
  } else if (formattedDate) {
    combined = formattedDate;
  }
  
  return {
    date: formattedDate,
    time: formattedTime,
    combined
  };
};

/**
 * Get current date and time formatted in Brazilian timezone
 * Returns object with separate date and time strings
 */
export const getCurrentDateTimeBR = (): { date: string; time: string } => {
  // Use o fuso horário do Brasil (UTC-3)
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  
  return {
    date: format(brazilTime, BR_DATE_FORMAT, { locale: ptBR }),
    time: format(brazilTime, BR_TIME_FORMAT, { locale: ptBR })
  };
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

/**
 * Convert Date object to YYYY-MM-DD format for database storage
 */
export const formatDateForDB = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(dateObj.getTime())) return null;
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for DB:', error);
    return null;
  }
};

/**
 * Convert time string to HH:mm format for database storage
 */
export const formatTimeForDB = (time: string | null | undefined): string | null => {
  if (!time) return null;
  
  try {
    // Se já está no formato HH:mm ou HH:mm:ss
    if (time.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      return time.substring(0, 5); // Garantir formato HH:mm
    }
    
    // Se for uma data completa, extrair apenas a hora
    const dateObj = parseISO(time);
    if (isNaN(dateObj.getTime())) return null;
    
    return format(dateObj, 'HH:mm');
  } catch (error) {
    console.error('Error formatting time for DB:', error);
    return null;
  }
};

/**
 * Parse time string in HH:mm format to proper time value
 */
export const parseTimeForDB = (timeString: string | null | undefined): string | null => {
  if (!timeString) return null;
  
  try {
    // Se já está no formato correto HH:mm
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // Se está no formato HH:mm:ss, remover os segundos
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString.substring(0, 5);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing time for DB:', error);
    return null;
  }
};

/**
 * Get current timestamp formatted for Brazilian timezone
 */
export const getCurrentTimestampBR = (): string => {
  // Criar timestamp no fuso horário do Brasil
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  
  // Retornar no formato ISO mas ajustado para o Brasil
  return brazilTime.toISOString();
};

/**
 * Simple Deno-compatible date formatting for edge functions
 */
export const formatDateBRSimple = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '';
    
    // Format to Brazilian date format DD/MM/YYYY
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Simple Deno-compatible datetime formatting for edge functions
 * Returns object with separate date and time strings
 */
export const formatDateTimeBRSimple = (date: string | Date | null | undefined): { date: string; time: string } => {
  if (!date) return { date: '', time: '' };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return { date: '', time: '' };
    
    // Format to Brazilian datetime format DD/MM/YYYY HH:mm
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`
    };
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return { date: '', time: '' };
  }
};
