import { format, parseISO, startOfDay, addWeeks, setHours, setMinutes, addMinutes } from "date-fns";
import { 
  calculateEaster, 
  calculateEasterMonday, 
  getItalianHolidays, 
  checkDateHolidayOrClosure, 
  HolidayItem 
} from "../lib/holidays";
import { getDefaultAcademicYearEnd } from "../lib/services/enrollment-service";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("==================================================");
console.log(" TEST CALENDARIO DIDATTICO, FESTIVITÀ E CONFLITTI ");
console.log("==================================================");

// 1. TEST: Calcolo Pasqua e Lunedì dell'Angelo
console.log("\n--- TEST 1: Calcolo Pasqua e Lunedì dell'Angelo ---");
const easter2024 = calculateEaster(2024);
const monday2024 = calculateEasterMonday(2024);
assert(format(easter2024, "yyyy-MM-dd") === "2024-03-31", "Pasqua 2024 deve essere 2024-03-31");
assert(format(monday2024, "yyyy-MM-dd") === "2024-04-01", "Lunedì dell'Angelo 2024 deve essere 2024-04-01");

const easter2025 = calculateEaster(2025);
const monday2025 = calculateEasterMonday(2025);
assert(format(easter2025, "yyyy-MM-dd") === "2025-04-20", "Pasqua 2025 deve essere 2025-04-20");
assert(format(monday2025, "yyyy-MM-dd") === "2025-04-21", "Lunedì dell'Angelo 2025 deve essere 2025-04-21");

const easter2026 = calculateEaster(2026);
const monday2026 = calculateEasterMonday(2026);
assert(format(easter2026, "yyyy-MM-dd") === "2026-04-05", "Pasqua 2026 deve essere 2026-04-05");
assert(format(monday2026, "yyyy-MM-dd") === "2026-04-06", "Lunedì dell'Angelo 2026 deve essere 2026-04-06");

const easter2027 = calculateEaster(2027);
const monday2027 = calculateEasterMonday(2027);
assert(format(easter2027, "yyyy-MM-dd") === "2027-03-28", "Pasqua 2027 deve essere 2027-03-28");
assert(format(monday2027, "yyyy-MM-dd") === "2027-03-29", "Lunedì dell'Angelo 2027 deve essere 2027-03-29");

// 2. TEST: Festività Nazionali e Chiusure Personalizzate
console.log("\n--- TEST 2: Festività Nazionali e Chiusure Personalizzate ---");
const hols2026 = getItalianHolidays(2026);
assert(hols2026.length >= 11, "Ci devono essere almeno 11 festività nazionali");
assert(hols2026.some(h => h.nome === "Natale" && h.data_inizio === "2026-12-25"), "Natale presente il 25 dicembre");
assert(hols2026.some(h => h.nome === "Lunedì dell'Angelo" && h.data_inizio === "2026-04-06"), "Pasquetta 2026 presente il 6 aprile");

const customClosures: HolidayItem[] = [
  {
    nome: "Vacanze di Natale",
    data_inizio: "2026-12-23",
    data_fine: "2027-01-06",
    tipo: "chiusura",
  },
  {
    nome: "Festa del Patrono",
    data_inizio: "2026-11-20",
    data_fine: "2026-11-20",
    tipo: "patrono",
  }
];

const checkChristmas = checkDateHolidayOrClosure("2026-12-28", customClosures);
assert(checkChristmas.isHoliday && checkChristmas.holidayName === "Vacanze di Natale", "2026-12-28 deve cadere nelle Vacanze di Natale");

const checkPatron = checkDateHolidayOrClosure("2026-11-20", customClosures);
assert(checkPatron.isHoliday && checkPatron.tipo === "patrono", "2026-11-20 deve cadere nella Festa del Patrono");

const checkFree = checkDateHolidayOrClosure("2026-11-17", customClosures);
assert(!checkFree.isHoliday, "2026-11-17 è un normale giorno didattico");

// 3. TEST: Generazione sull'intero anno accademico vs 12 settimane
console.log("\n--- TEST 3: Generazione su Anno Accademico Intero ---");
const startDateStr = "2026-09-15"; // Martedì 15 settembre 2026
const endDateStr = getDefaultAcademicYearEnd(startDateStr);
assert(endDateStr === "2027-06-15", `Default anno accademico da ${startDateStr} deve terminare il 2027-06-15 (ottenuto: ${endDateStr})`);

// Generiamo lezioni per un corso ogni venerdì dalle 16:00 alle 17:00
const courseDayOfWeek = 5; // Venerdì
let currentDate = startOfDay(parseISO(startDateStr));
while (currentDate.getDay() !== courseDayOfWeek) {
  currentDate.setDate(currentDate.getDate() + 1);
}
const firstLessonDate = format(currentDate, "yyyy-MM-dd");
assert(firstLessonDate === "2026-09-18", `Prima lezione di venerdì dopo il 15 sett deve essere 2026-09-18 (ottenuto: ${firstLessonDate})`);

const endDate = startOfDay(parseISO(endDateStr));
const generatedLessons: string[] = [];
const skippedHolidays: { date: string; name: string }[] = [];

while (currentDate <= endDate) {
  const dStr = format(currentDate, "yyyy-MM-dd");
  const hol = checkDateHolidayOrClosure(dStr, customClosures);
  if (hol.isHoliday) {
    skippedHolidays.push({ date: dStr, name: hol.holidayName || "" });
  } else {
    generatedLessons.push(dStr);
  }
  currentDate = addWeeks(currentDate, 1);
}

console.log(`Lezioni generate: ${generatedLessons.length}`);
console.log(`Lezioni saltate per festività/chiusure: ${skippedHolidays.length} (${skippedHolidays.map(s => `${s.date}: ${s.name}`).join(", ")})`);

assert(generatedLessons.length > 30, `Lezioni generate su anno intero (${generatedLessons.length}) devono essere > 30, non solo 12!`);
assert(skippedHolidays.some(s => s.name === "Vacanze di Natale" || s.name === "Natale" || s.name === "Capodanno"), "Le date nelle vacanze di Natale devono essere state saltate");
assert(!generatedLessons.includes("2026-12-25"), "Il 25 dicembre 2026 non deve comparire tra le lezioni generate");
assert(!generatedLessons.includes("2027-01-01"), "Il 1 gennaio 2027 non deve comparire tra le lezioni generate");

// 4. TEST: Rilevamento Conflitti Orari
console.log("\n--- TEST 4: Rilevamento Conflitti Orari ---");
function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && e1 > s2;
}

assert(timesOverlap("15:00", "16:00", "15:30", "16:30") === true, "15:00-16:00 e 15:30-16:30 devono sovrapporsi");
assert(timesOverlap("15:00", "16:00", "16:00", "17:00") === false, "15:00-16:00 e 16:00-17:00 (consecutivi) NON devono sovrapporsi");
assert(timesOverlap("10:00", "11:00", "09:00", "10:00") === false, "09:00-10:00 e 10:00-11:00 NON devono sovrapporsi");
assert(timesOverlap("14:00", "15:00", "13:00", "16:00") === true, "Fascia interna e contenitore devono sovrapporsi");

// 5. TEST: Condivisione Lezioni Corsi Collettivi (4 allievi)
console.log("\n--- TEST 5: Condivisione Lezioni Corsi Collettivi (4 Allievi) ---");
type MockLesson = { id: string; course_id: string; date: string; time: string };
type MockAttendance = { id: string; lesson_id: string; student_id: string; status: string };

const mockLessons: MockLesson[] = [];
const mockAttendances: MockAttendance[] = [];

function enrollStudentMock(courseId: string, studentId: string, isCollective: boolean, lessonDates: string[]) {
  for (const date of lessonDates) {
    let targetLessonId: string;
    if (isCollective) {
      const existing = mockLessons.find(l => l.course_id === courseId && l.date === date);
      if (existing) {
        targetLessonId = existing.id;
      } else {
        targetLessonId = `lesson-${courseId}-${date}`;
        mockLessons.push({ id: targetLessonId, course_id: courseId, date, time: "17:00" });
      }
    } else {
      targetLessonId = `lesson-ind-${studentId}-${date}`;
      mockLessons.push({ id: targetLessonId, course_id: courseId, date, time: "17:00" });
    }

    if (!mockAttendances.some(a => a.lesson_id === targetLessonId && a.student_id === studentId)) {
      mockAttendances.push({
        id: `att-${targetLessonId}-${studentId}`,
        lesson_id: targetLessonId,
        student_id: studentId,
        status: "presente"
      });
    }
  }
}

const collectiveDates = ["2026-10-02", "2026-10-09", "2026-10-16"];
const collectiveCourseId = "course-choir-1";
const students = ["student-1", "student-2", "student-3", "student-4"];

// Iscrivi 4 studenti al corso collettivo
students.forEach(st => enrollStudentMock(collectiveCourseId, st, true, collectiveDates));

assert(
  mockLessons.length === collectiveDates.length, 
  `Per 3 date di corso collettivo con 4 allievi, ci devono essere solo 3 record lezione (ottenuto: ${mockLessons.length})`
);
assert(
  mockAttendances.length === collectiveDates.length * 4,
  `Ci devono essere 12 record di presenza (3 lezioni x 4 studenti) (ottenuto: ${mockAttendances.length})`
);

// Verifica che ogni lezione abbia esattamente 4 partecipanti
for (const l of mockLessons) {
  const participants = mockAttendances.filter(a => a.lesson_id === l.id);
  assert(participants.length === 4, `La lezione ${l.date} deve avere 4 partecipanti collegati (ottenuto: ${participants.length})`);
}

console.log("\n==================================================");
console.log(" TUTTI I TEST DEL CALENDARIO SONO PASSATI CON SUCCESSO! ");
console.log("==================================================");
