import { PROBLEMS } from '@/data/problems'

/** Reps capstone rep id → the LeetCode number it stands for (passing it counts as solving the target). */
export const CAPSTONE_LC: Record<string, number> = Object.fromEntries(PROBLEMS.map((p) => [p.exerciseId ?? `cap-${p.id}`, p.number]))
