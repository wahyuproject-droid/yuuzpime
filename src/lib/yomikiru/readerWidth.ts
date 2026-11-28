/**
 * Width command logic adapted from Yomikiru 2.25.1.
 * Original: src/renderer/features/reader/readerCommandOps.ts
 * Copyright (c) 2023 mienaiyami. MIT; see licenses/YOMIKIRU.txt.
 */
const SIZE_MIN = 1;
const FINE_WIDTH_THRESHOLD = 40;
const FINE_WIDTH_STEP = 5;
const COARSE_WIDTH_STEP = 10;
export const stepReaderWidth = (readerWidth: number, maxWidth: number, direction: 1 | -1): number => {
    const steps = readerWidth <= FINE_WIDTH_THRESHOLD ? FINE_WIDTH_STEP : COARSE_WIDTH_STEP;
    const next = readerWidth + direction * steps;
    if (next > maxWidth) return maxWidth;
    if (next < SIZE_MIN) return SIZE_MIN;
    return next;
};
