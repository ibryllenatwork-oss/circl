const manilaHour = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  hourCycle: "h23",
});

export function greeting(date: Date = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = Number(manilaHour.format(date));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const manilaLongDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  weekday: "long",
  month: "long",
  day: "numeric",
});

/** "Friday, November 14" in Manila. */
export function manilaToday(date: Date = new Date()): string {
  return manilaLongDate.format(date);
}
