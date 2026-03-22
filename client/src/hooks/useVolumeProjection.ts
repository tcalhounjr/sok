import { useState, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { GET_VOLUME_PROJECTION } from '../apollo/queries';
import type { VolumeProjection } from '../types';

const DEBOUNCE_MS = 400;
const MIN_KEYWORD_LENGTH = 3;

export function useVolumeProjection(keywords: string[]) {
  const [projection, setProjection] = useState<VolumeProjection | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fetchProjection, { loading }] = useLazyQuery(GET_VOLUME_PROJECTION, {
    onCompleted: (data: { volumeProjection?: VolumeProjection | null }) => setProjection(data?.volumeProjection ?? null),
  });

  useEffect(() => {
    const validKeywords = keywords.filter(k => k.length >= MIN_KEYWORD_LENGTH);

    if (validKeywords.length === 0) {
      setProjection(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchProjection({ variables: { keywords: validKeywords } });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [keywords.join(',')]);

  return { projection, loading };
}
