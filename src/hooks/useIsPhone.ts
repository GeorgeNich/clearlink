import { useEffect, useState } from 'react';

const QUERY = '(max-width: 639px)';

/** Below 640px the app uses the phone layout. */
export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
}
