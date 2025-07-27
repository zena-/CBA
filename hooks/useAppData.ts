import { useEffect, useState } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export function useAppData() {
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [stepsToday, setStepsToday] = useState<number | null>(null);
  const [meetingsToday, setMeetingsToday] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (Platform.OS !== 'ios') return;

      // Request health permissions
      const healthAvailable = await Health.isAvailableAsync();
      if (!healthAvailable) return;

      await Health.requestPermissionsAsync([
        Health.Permission.SleepAnalysis,
        Health.Permission.Steps,
      ]);

      // Get today’s sleep data
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);

      const sleepSamples = await Health.getSleepAsync({
        startDate: midnight,
        endDate: now,
      });

      const sleepSeconds = sleepSamples.reduce((sum, entry) => {
        return entry.value === 'ASLEEP' ? sum + entry.endDate.getTime() - entry.startDate.getTime() : sum;
      }, 0);
      const sleepHrs = sleepSeconds / 1000 / 60 / 60;
      setSleepHours(Number(sleepHrs.toFixed(1)));

      // Get today’s steps
      const stepSamples = await Health.getStepCountAsync({
        startDate: midnight,
        endDate: now,
      });
      setStepsToday(stepSamples.value || 0);

      // Calendar permissions
      const calPerm = await Calendar.requestCalendarPermissionsAsync();
      if (calPerm.status !== 'granted') return;

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const start = midnight.toISOString();
      const end = now.toISOString();

      let total = 0;
      for (const cal of calendars) {
        const events = await Calendar.getEventsAsync([cal.id], start, end);
        total += events.length;
      }
      setMeetingsToday(total);
    };

    fetchData();
  }, []);

  return {
    sleepHours,
    stepsToday,
    meetingsToday,
  };
}
