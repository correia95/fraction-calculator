// Exact rational arithmetic with regular JS integers (safe within Number.MAX_SAFE_INTEGER).

export interface Frac {
  n: number; // numerator, carries the sign
  d: number; // denominator, always > 0
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export function make(n: number, d: number): Frac {
  if (d === 0) throw new Error('division by zero');
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

// parse "3", "3/4", "1 1/2", "-2 3/8", "1.75", "-0.5"
export function parse(input: string): Frac | null {
  const s = input.trim();
  if (!s) return null;

  // mixed number: "1 1/2" or "-1 1/2"
  let m = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (m) {
    const sign = m[1] === '-' ? -1 : 1;
    const whole = +m[2];
    const num = +m[3];
    const den = +m[4];
    if (den === 0) return null;
    return make(sign * (whole * den + num), den);
  }

  // simple fraction: "3/4" or "-3/4"
  m = /^(-?\d+)\/(\d+)$/.exec(s);
  if (m) {
    const den = +m[2];
    if (den === 0) return null;
    return make(+m[1], den);
  }

  // decimal: "1.75", "-0.5", "2"
  m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s);
  if (m && (m[2] || m[3])) {
    const sign = m[1] === '-' ? -1 : 1;
    const intPart = m[2] || '0';
    const frac = m[3] || '';
    const den = Math.pow(10, frac.length);
    const num = parseInt(intPart + frac, 10);
    return make(sign * num, den || 1);
  }

  return null;
}

export type Op = '+' | '-' | '*' | '/';

export function apply(a: Frac, b: Frac, op: Op): Frac {
  switch (op) {
    case '+':
      return make(a.n * b.d + b.n * a.d, a.d * b.d);
    case '-':
      return make(a.n * b.d - b.n * a.d, a.d * b.d);
    case '*':
      return make(a.n * b.n, a.d * b.d);
    case '/':
      if (b.n === 0) throw new Error('division by zero');
      return make(a.n * b.d, a.d * b.n);
  }
}

export function toDecimal(f: Frac): number {
  return f.n / f.d;
}

export function toMixed(f: Frac): { whole: number; n: number; d: number; sign: number } {
  const sign = f.n < 0 ? -1 : 1;
  const n = Math.abs(f.n);
  const whole = Math.floor(n / f.d);
  return { whole, n: n % f.d, d: f.d, sign };
}

export function fmtImproper(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return `${f.n}/${f.d}`;
}

export function fmtMixed(f: Frac): string {
  const { whole, n, d, sign } = toMixed(f);
  if (n === 0) return String(sign * whole);
  if (whole === 0) return `${sign < 0 ? '-' : ''}${n}/${d}`;
  return `${sign < 0 ? '-' : ''}${whole} ${n}/${d}`;
}

// a repeating- or terminating-decimal string, marking the repetend with parentheses
export function fmtDecimal(f: Frac): string {
  const sign = f.n < 0 ? '-' : '';
  let n = Math.abs(f.n);
  const d = f.d;
  const intPart = Math.floor(n / d);
  let rem = n % d;
  if (rem === 0) return `${sign}${intPart}`;

  const digits: string[] = [];
  const seen = new Map<number, number>();
  let repeatStart = -1;
  while (rem !== 0) {
    if (seen.has(rem)) {
      repeatStart = seen.get(rem)!;
      break;
    }
    seen.set(rem, digits.length);
    rem *= 10;
    digits.push(String(Math.floor(rem / d)));
    rem %= d;
    if (digits.length > 60) break; // safety
  }

  if (repeatStart === -1) return `${sign}${intPart}.${digits.join('')}`;
  const nonRep = digits.slice(0, repeatStart).join('');
  const rep = digits.slice(repeatStart).join('');
  return `${sign}${intPart}.${nonRep}(${rep})`;
}

export function simplifyText(input: string): Frac | null {
  return parse(input);
}
