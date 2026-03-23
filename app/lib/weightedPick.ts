// app/lib/weightedPick.ts

export type WeightedOption<T> = {
  item: T;
  weight: number;
};

export function weightedPick<T>(options: WeightedOption<T>[], rng = Math.random): T {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  const random = rng() * total;

  let cumulative = 0;
  for (const option of options) {
    cumulative += option.weight;
    if (random <= cumulative) {
      return option.item;
    }
  }

  return options[options.length - 1].item;
}