import { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebase';

const YT_CHANNEL_ID = process.env.REACT_APP_YOUTUBE_CHANNEL_ID || 'UCOJplizX_yUF5zE8Wz8frcw';
const YT_API_KEY     = process.env.REACT_APP_YOUTUBE_API_KEY;
const YT_REFRESH_MS  = 5 * 60 * 1000;

/**
 * Live subscriber/view/video counts from the YouTube Data API v3.
 * Returns null until the first successful fetch (or forever if no API key is configured,
 * letting callers fall back to a static default).
 */
export function useYouTubeStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!YT_API_KEY) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YT_CHANNEL_ID}&key=${YT_API_KEY}`
        );
        const data = await res.json();
        const s = data?.items?.[0]?.statistics;
        if (s && !cancelled) {
          setStats({
            subscribers: Number(s.subscriberCount),
            views:       Number(s.viewCount),
            videos:      Number(s.videoCount),
          });
        }
      } catch {
        // network/quota failure — keep whatever we already had (or the caller's fallback)
      }
    };

    load();
    const interval = setInterval(load, YT_REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return stats;
}

/**
 * Live count of registered students.
 *
 * Counts `registered_emails` rather than `registrations` — it's publicly readable
 * (firestore.rules already grants `allow read: if true` there so anonymous visitors
 * can duplicate-check during signup), and it stays in sync: one doc is written per
 * student on registration and removed on rejection/deletion. `registrations` itself
 * has row-level rules that an unauthenticated homepage visitor can't satisfy for an
 * unfiltered collection count.
 */
export function useStudentCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCountFromServer(collection(db, 'registered_emails'))
      .then(snap => { if (!cancelled) setCount(snap.data().count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return count;
}

/** Splits a raw number into { count, suffix } for a count-up animation, e.g. 44230 -> { count: 44.2, suffix: 'K+' }. */
export function formatStatNumber(n) {
  if (n == null || Number.isNaN(n)) return null;
  if (n >= 1_000_000) return { count: Math.round(n / 100_000) / 10, suffix: 'M+' };
  if (n >= 1_000)     return { count: Math.round(n / 100) / 10, suffix: 'K+' };
  return { count: n, suffix: '' };
}

/** Formats a raw number into a display string, e.g. 44230 -> "44.2K+". */
export function formatStatLabel(n) {
  const f = formatStatNumber(n);
  if (!f) return null;
  return (Number.isInteger(f.count) ? f.count : f.count.toFixed(1)) + f.suffix;
}
