// Shared hospital-friendly date-time formatter
// Example output: 26 Sep 2025, 3:45 PM
// Convert UTC date string to local timezone
export function formatHospitalDateTime(input: string | number | Date | null | undefined): string {
  try {
    if (!input) return '-';

    const d = new Date(input);
    if (isNaN(d.getTime())) return '-';

    const timezoneOffset = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - timezoneOffset);

    const day = localDate.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
    const month = monthNames[localDate.getMonth()];
    const year = localDate.getFullYear();

    let hours = localDate.getHours();
    const minutes = localDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error formatting date:', error);
    return '-';
  }
}


