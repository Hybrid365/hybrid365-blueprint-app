/** Client quotes — genuine quotes; attribution pending approved names. */

export const CLIENT_QUOTES_COPY = {
  eyebrow: "From the athletes",
  headline: ["The system helps.", "The coaching changes things."],
} as const;

export type ClientQuote = {
  id: string;
  quote: string;
  attribution: string;
};

export const CLIENT_QUOTES: ClientQuote[] = [
  {
    id: "quote-1",
    quote:
      "I always knew I was willing to work hard, but having my training structured, seeing my progress and having someone actually tell me what I needed to do changed everything.",
    attribution: "Hybrid365 coaching client",
  },
  {
    id: "quote-2",
    quote:
      "The app helps and is pretty sick, but more than that, it’s the environment and the coaching.",
    attribution: "Hybrid365 coaching client",
  },
  {
    id: "quote-3",
    quote:
      "I wasn’t sure how to build my running without losing muscle, but I’ve become leaner, look better and hit my 5K PB in testing last week.",
    attribution: "Hybrid365 coaching client",
  },
];
