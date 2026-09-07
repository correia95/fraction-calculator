# Fraction Calculator

Exact fraction arithmetic in the browser.

- **Calculate**: `a op b` for `+ − × ÷` on fractions, mixed numbers, whole numbers or decimals.
  Answer as improper fraction, mixed number, decimal (repeating part in brackets) and percent,
  with the working shown.
- **Simplify / convert**: one value → simplest fraction, mixed number, decimal, percent.
- Inputs accept `3/4`, `1 1/2`, `-2 3/8`, `0.75`, `5`.
- Everything persists in the URL.

## Develop

```
npm install
npm run dev
npm run build
```

Engine and tests: [`src/fraction.ts`](src/fraction.ts) — rational arithmetic with `gcd`
reduction and long-division for repeating decimals. Static site on Cloudflare Workers.

Part of [Tiny Tools](https://tinytools.correia95.workers.dev).
