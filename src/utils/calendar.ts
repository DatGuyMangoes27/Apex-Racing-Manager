/**
 * Calendar Utilities
 * 
 * Utility functions for week and date calculations that align with
 * the career mode's week system where Week 1 is a partial week from
 * January 1st to the first Sunday, and subsequent weeks are full Mon-Sun.
 */

/**
 * Calculate the week number for a given date.
 * 
 * Week 1 starts on January 1st and ends on the first Sunday.
 * All subsequent weeks are full Monday-Sunday weeks.
 * 
 * Example for 2026 (Jan 1 = Thursday):
 * - Week 1: Jan 1 (Thu) - Jan 4 (Sun) = 4 days
 * - Week 2: Jan 5 (Mon) - Jan 11 (Sun) = 7 days
 * - Week 3: Jan 12 (Mon) - Jan 18 (Sun) = 7 days
 */
export function calculateWeekNumber(date: Date, startYear: number): number {
  const startOfYear = new Date(startYear, 0, 1)
  // Get day of week for Jan 1 (1=Mon, 7=Sun)
  const jan1DayOfWeek = startOfYear.getDay() === 0 ? 7 : startOfYear.getDay()
  // Days since Jan 1
  const daysSinceJan1 = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  // Calculate week with offset for partial first week
  return Math.floor((daysSinceJan1 + jan1DayOfWeek - 1) / 7) + 1
}

/**
 * Get the game (week, day) for a given date.
 * Used so the calendar grid can show activities on the correct date when
 * the season starts on a non-Monday (e.g. Jan 1 = Thursday).
 *
 * - week: same as calculateWeekNumber (Week 1 = Jan 1 to first Sunday, then full weeks).
 * - day: calendar weekday 1=Mon … 7=Sun (matches careerStore currentDay and activity keys).
 *
 * For dates before Jan 1 of startYear, returns { week: 0, day: 0 } (no in-season date).
 */
export function getGameWeekAndDayFromDate(
  date: Date,
  startYear: number
): { week: number; day: number } {
  const startOfYear = new Date(startYear, 0, 1)
  const daysSinceJan1 = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceJan1 < 0) return { week: 0, day: 0 }
  const week = calculateWeekNumber(date, startYear)
  const day = date.getDay() === 0 ? 7 : date.getDay() // 1=Mon, 7=Sun
  return { week, day }
}

/**
 * Get the date for a specific week and day of week.
 * 
 * This is the reverse of calculateWeekNumber - given a week number
 * and day of week, return the actual Date.
 * 
 * @param week - The week number (1-based)
 * @param dayOfWeek - Day of week (1=Mon, 7=Sun)
 * @param startYear - The year to calculate for
 */
export function getDateFromWeekAndDay(week: number, dayOfWeek: number, startYear: number): Date {
  const startOfYear = new Date(startYear, 0, 1)
  // Get day of week for Jan 1 (1=Mon, 7=Sun)
  const jan1DayOfWeek = startOfYear.getDay() === 0 ? 7 : startOfYear.getDay()
  
  if (week === 1) {
    // Week 1 is special - it starts on Jan 1 regardless of what day that is
    // Only days from jan1DayOfWeek to 7 (Sunday) are valid in week 1
    if (dayOfWeek < jan1DayOfWeek) {
      // This day doesn't exist in week 1 (before Jan 1)
      // Return Jan 1 as fallback
      return new Date(startYear, 0, 1)
    }
    // Calculate the date within week 1
    const daysFromJan1 = dayOfWeek - jan1DayOfWeek
    return new Date(startYear, 0, 1 + daysFromJan1)
  }
  
  // For weeks 2+, calculate based on full Monday-Sunday weeks
  // Week 2 starts on the first Monday after the first Sunday
  // First Sunday is at day (8 - jan1DayOfWeek) if jan1DayOfWeek != 7, else 1
  const firstSundayDate = jan1DayOfWeek === 7 ? 1 : (8 - jan1DayOfWeek)
  // First Monday (start of week 2) is firstSundayDate + 1
  const week2StartDate = firstSundayDate + 1
  
  // Calculate date: week2Start + (week - 2) * 7 + (dayOfWeek - 1)
  const daysFromJan1 = (week2StartDate - 1) + (week - 2) * 7 + (dayOfWeek - 1)
  return new Date(startYear, 0, 1 + daysFromJan1)
}

/**
 * Get the number of days in Week 1 for a given year.
 * Week 1 is always from Jan 1 to the first Sunday.
 */
export function getWeek1Length(startYear: number): number {
  const jan1 = new Date(startYear, 0, 1)
  const jan1DayOfWeek = jan1.getDay() === 0 ? 7 : jan1.getDay()
  // Days from Jan 1 to Sunday = 7 - jan1DayOfWeek + 1
  // If Jan 1 is Sunday (7), week 1 is 1 day
  // If Jan 1 is Monday (1), week 1 is 7 days
  // If Jan 1 is Thursday (4), week 1 is 4 days (Thu, Fri, Sat, Sun)
  return 8 - jan1DayOfWeek
}

/**
 * Get the total number of weeks in a year.
 * This accounts for partial first and last weeks.
 * 
 * A year can have 52 or 53 weeks depending on what day Jan 1 falls on
 * and whether it's a leap year.
 */
export function getWeeksInYear(year: number): number {
  const dec31 = new Date(year, 11, 31)
  return calculateWeekNumber(dec31, year)
}

/**
 * Get the number of days in the last week of a year.
 * The last week might be partial (ends on Dec 31 which might not be Sunday).
 */
export function getLastWeekLength(year: number): number {
  const dec31 = new Date(year, 11, 31)
  const dec31DayOfWeek = dec31.getDay() === 0 ? 7 : dec31.getDay()
  // Days from Monday to Dec 31
  return dec31DayOfWeek
}

/**
 * Check if a given week/day represents a valid date in the year.
 * Returns false if the day is past the end of the year (past Dec 31).
 */
export function isValidWeekDay(week: number, day: number, year: number): boolean {
  const weeksInYear = getWeeksInYear(year)
  
  // If we're not in the last week, any day 1-7 is valid
  if (week < weeksInYear) {
    return true
  }
  
  // If we're past the last week, it's invalid
  if (week > weeksInYear) {
    return false
  }
  
  // We're in the last week - check if the day is valid
  const lastWeekLength = getLastWeekLength(year)
  return day <= lastWeekLength
}

/**
 * Check if advancing a day should trigger a week and/or year change.
 * This properly handles partial weeks at both ends of the year.
 * 
 * Returns the new week number, day, year, and flags indicating changes.
 */
export function advanceDayInWeekSystem(
  currentWeek: number,
  currentDay: number,
  currentYear: number
): { newWeek: number; newDay: number; newYear: number; weekChanged: boolean; yearChanged: boolean } {
  let newDay = currentDay + 1
  let newWeek = currentWeek
  let newYear = currentYear
  let weekChanged = false
  let yearChanged = false
  
  const weeksInCurrentYear = getWeeksInYear(currentYear)
  
  // Check if this is the last week of the year (which might be partial)
  if (currentWeek === weeksInCurrentYear) {
    const lastWeekLength = getLastWeekLength(currentYear)
    
    // If we've advanced past the last day of the last week, roll to new year
    if (newDay > lastWeekLength) {
      newYear = currentYear + 1
      newWeek = 1
      weekChanged = true
      yearChanged = true
      
      // Set newDay to the day of week for Jan 1 of the new year
      const jan1NewYear = new Date(newYear, 0, 1)
      newDay = jan1NewYear.getDay() === 0 ? 7 : jan1NewYear.getDay()
      
      return { newWeek, newDay, newYear, weekChanged, yearChanged }
    }
  }
  
  // Normal case: check if we need to advance the week (past Sunday)
  if (newDay > 7) {
    newDay = 1
    newWeek = currentWeek + 1
    weekChanged = true
    
    // Check if we need to advance the year (shouldn't happen here since we handle last week above)
    if (newWeek > weeksInCurrentYear) {
      newWeek = 1
      newYear = currentYear + 1
      yearChanged = true
      
      // Set newDay to the day of week for Jan 1 of the new year
      const jan1NewYear = new Date(newYear, 0, 1)
      newDay = jan1NewYear.getDay() === 0 ? 7 : jan1NewYear.getDay()
    }
  }
  
  return { newWeek, newDay, newYear, weekChanged, yearChanged }
}
