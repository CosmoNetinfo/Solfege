import { format } from "date-fns";

export interface HolidayItem {
  nome: string;
  data_inizio: string; // YYYY-MM-DD
  data_fine: string;   // YYYY-MM-DD
  tipo: "festivita" | "chiusura" | "patrono";
}

/**
 * Calcolo della data di Pasqua (Gregoriana) con algoritmo anonimo Meeus/Jones/Butcher.
 * Ritorna un Date a mezzanotte UTC.
 */
export function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = aprile
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Calcolo del Lunedì dell'Angelo (Pasquetta) per un dato anno.
 */
export function calculateEasterMonday(year: number): Date {
  const easter = calculateEaster(year);
  const easterMonday = new Date(easter);
  easterMonday.setUTCDate(easterMonday.getUTCDate() + 1);
  return easterMonday;
}

/**
 * Ritorna le festività nazionali italiane per l'anno specificato.
 */
export function getItalianHolidays(year: number): HolidayItem[] {
  const easterMonday = calculateEasterMonday(year);
  const easterMondayStr = format(easterMonday, "yyyy-MM-dd");

  const fixed = [
    { nome: "Capodanno", data: `${year}-01-01` },
    { nome: "Epifania", data: `${year}-01-06` },
    { nome: "Lunedì dell'Angelo", data: easterMondayStr },
    { nome: "Festa della Liberazione", data: `${year}-04-25` },
    { nome: "Festa dei Lavoratori", data: `${year}-05-01` },
    { nome: "Festa della Repubblica", data: `${year}-06-02` },
    { nome: "Assunzione (Ferragosto)", data: `${year}-08-15` },
    { nome: "Tutti i Santi", data: `${year}-11-01` },
    { nome: "Immacolata Concezione", data: `${year}-12-08` },
    { nome: "Natale", data: `${year}-12-25` },
    { nome: "Santo Stefano", data: `${year}-12-26` },
  ];

  return fixed.map((f) => ({
    nome: f.nome,
    data_inizio: f.data,
    data_fine: f.data,
    tipo: "festivita" as const,
  }));
}

/**
 * Verifica se una specifica data (YYYY-MM-DD) ricade in una festività nazionale o in una chiusura scolastica.
 */
export function checkDateHolidayOrClosure(
  dateStr: string,
  customClosures: HolidayItem[] = []
): { isHoliday: boolean; holidayName?: string; tipo?: string } {
  const year = parseInt(dateStr.substring(0, 4), 10);
  if (isNaN(year)) return { isHoliday: false };

  // 1. Controlla prima le chiusure personalizzate della scuola (intervalli o singole date)
  for (const c of customClosures) {
    if (dateStr >= c.data_inizio && dateStr <= c.data_fine) {
      return {
        isHoliday: true,
        holidayName: c.nome,
        tipo: c.tipo,
      };
    }
  }

  // 2. Controlla le festività nazionali italiane
  const nationalHolidays = getItalianHolidays(year);
  for (const nh of nationalHolidays) {
    if (nh.data_inizio === dateStr) {
      return {
        isHoliday: true,
        holidayName: nh.nome,
        tipo: nh.tipo,
      };
    }
  }

  return { isHoliday: false };
}
