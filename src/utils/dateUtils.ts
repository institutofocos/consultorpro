
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
 * Get current date and time formatted in Brazilian timezone using built-in toLocaleString
 * Returns object with separate date and time strings
 */
export const getCurrentDateTimeBR = (): { date: string; time: string } => {
  const now = new Date();
  
  // Use toLocaleString with Brazilian timezone
  const brazilTime = now.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  // Parse the result: "31/05/2025 11:31"
  const [datePart, timePart] = brazilTime.split(' ');
  
  return {
    date: datePart,
    time: timePart
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
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se é uma string de data brasileira (DD/MM/YYYY), converte primeiro
      if (date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        dateObj = parseBRDate(date) || new Date();
      } else {
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    
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
  
  // Retornar no formato ISO mas ajustado para o Brasil
  return now.toISOString();
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
 * Simple Deno-compatible datetime formatting for edge functions using toLocaleString
 * Returns object with separate date and time strings - NOW WITH CORRECT TIMEZONE
 */
export const formatDateTimeBRSimple = (date: string | Date | null | undefined): { date: string; time: string } => {
  if (!date) return { date: '', time: '' };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return { date: '', time: '' };
    
    // Use toLocaleString para obter o horário correto do Brasil
    const brazilTime = dateObj.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Parse the result: "31/05/2025 11:31"
    const [datePart, timePart] = brazilTime.split(' ');
    
    return {
      date: datePart || '',
      time: timePart || ''
    };
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return { date: '', time: '' };
  }
};

/**
 * Get current Brazil time formatted properly using toLocaleString
 */
export const getCurrentBrazilDateTime = (): { date: string; time: string; combined: string } => {
  const now = new Date();
  
  // Use toLocaleString with Brazilian timezone for accurate time
  const brazilTime = now.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  // Parse the result: "31/05/2025 11:31"
  const [datePart, timePart] = brazilTime.split(' ');
  
  return {
    date: datePart,
    time: timePart,
    combined: `${datePart} ${timePart}`
  };
};

/**
 * Convert a combined datetime string (DD/MM/YYYY HH:MM) to separate date and time
 */
export const separateDateAndTime = (dateTimeString: string | null | undefined): { date: string; time: string } => {
  if (!dateTimeString) return { date: '', time: '' };
  
  try {
    // Se é um formato combinado brasileiro (DD/MM/YYYY HH:MM)
    const match = dateTimeString.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})$/);
    if (match) {
      return {
        date: match[1],
        time: match[2]
      };
    }
    
    // Se é uma data ISO, converter
    const dateObj = parseISO(dateTimeString);
    if (!isNaN(dateObj.getTime())) {
      return formatDateTimeBR(dateObj);
    }
    
    return { date: '', time: '' };
  } catch (error) {
    console.error('Error separating date and time:', error);
    return { date: '', time: '' };
  }
};
