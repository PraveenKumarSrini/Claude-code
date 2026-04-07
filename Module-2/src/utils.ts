const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export function formatDueDate(date: string | null | undefined): string {
  if (!date) return "Invalid date";

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "Invalid date";

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return "Invalid date";

  const suffix = ordinalSuffix(day);
  return `${day}${suffix} ${MONTHS[month - 1]} ${year}`;
}
