import { useEffect, useMemo, useState } from 'react';
import {
  Frac,
  Op,
  apply,
  fmtDecimal,
  fmtImproper,
  fmtMixed,
  gcd,
  parse,
  toDecimal,
} from './fraction';

type Tab = 'calc' | 'simplify';
const OPS: { id: Op; sym: string }[] = [
  { id: '+', sym: '+' },
  { id: '-', sym: '−' },
  { id: '*', sym: '×' },
  { id: '/', sym: '÷' },
];

function useUrl() {
  const p = new URLSearchParams(window.location.search);
  return {
    tab: (p.get('t') === 'simplify' ? 'simplify' : 'calc') as Tab,
    a: p.get('a') ?? '1/2',
    op: (['+', '-', '*', '/'].includes(p.get('op') || '') ? p.get('op') : '+') as Op,
    b: p.get('b') ?? '1/3',
    s: p.get('s') ?? '18/24',
  };
}

export default function App() {
  const init = useUrl();
  const [tab, setTab] = useState<Tab>(init.tab);
  const [a, setA] = useState(init.a);
  const [op, setOp] = useState<Op>(init.op);
  const [b, setB] = useState(init.b);
  const [s, setS] = useState(init.s);

  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set('t', tab);
    u.searchParams.set('a', a);
    u.searchParams.set('op', op);
    u.searchParams.set('b', b);
    u.searchParams.set('s', s);
    window.history.replaceState(null, '', u.toString());
  }, [tab, a, op, b, s]);

  const fa = useMemo(() => parse(a), [a]);
  const fb = useMemo(() => parse(b), [b]);

  const calc = useMemo(() => {
    if (!fa || !fb) return null;
    try {
      const r = apply(fa, fb, op);
      return { r, err: null as string | null };
    } catch (e) {
      return { r: null, err: (e as Error).message };
    }
  }, [fa, fb, op]);

  const fs = useMemo(() => parse(s), [s]);

  const steps = useMemo(() => {
    if (!fa || !fb || !calc?.r) return [];
    const out: string[] = [];
    if (op === '+' || op === '-') {
      const lcd = (fa.d * fb.d) / gcd(fa.d, fb.d);
      out.push(`Common denominator: ${lcd}`);
      out.push(`${fmtImproper(fa)} = ${(fa.n * (lcd / fa.d))}/${lcd}`);
      out.push(`${fmtImproper(fb)} = ${(fb.n * (lcd / fb.d))}/${lcd}`);
      out.push(
        `${fa.n * (lcd / fa.d)}/${lcd} ${op === '+' ? '+' : '−'} ${fb.n * (lcd / fb.d)}/${lcd} = ${
          fa.n * (lcd / fa.d) + (op === '+' ? 1 : -1) * fb.n * (lcd / fb.d)
        }/${lcd}`,
      );
    } else if (op === '*') {
      out.push(`Multiply across: ${fa.n}×${fb.n} over ${fa.d}×${fb.d} = ${fa.n * fb.n}/${fa.d * fb.d}`);
    } else {
      out.push(`Invert the second fraction and multiply: ${fmtImproper(fa)} × ${fb.d}/${fb.n}`);
      out.push(`= ${fa.n * fb.d}/${fa.d * fb.n}`);
    }
    out.push(`Simplify: ${fmtImproper(calc.r)}`);
    return out;
  }, [fa, fb, op, calc]);

  const pct = (f: Frac) => {
    const v = toDecimal(f) * 100;
    return `${Math.round(v * 1000) / 1000}%`;
  };

  return (
    <div className="wrap">
      <header>
        <h1>Fraction Calculator</h1>
        <p className="sub">
          Add, subtract, multiply and divide fractions and mixed numbers, with the answer as a
          fraction, a mixed number and a decimal. Also simplifies a fraction and converts to and
          from decimals.
        </p>
      </header>

      <div className="tabs">
        <button className={tab === 'calc' ? 'on' : ''} onClick={() => setTab('calc')}>Calculate</button>
        <button className={tab === 'simplify' ? 'on' : ''} onClick={() => setTab('simplify')}>Simplify / convert</button>
      </div>

      {tab === 'calc' ? (
        <>
          <div className="calcrow">
            <input className={'frac' + (a && !fa ? ' bad' : '')} value={a} onChange={(e) => setA(e.target.value)} placeholder="1/2" aria-label="First fraction" />
            <div className="ops">
              {OPS.map((o) => (
                <button key={o.id} className={op === o.id ? 'on' : ''} onClick={() => setOp(o.id)}>{o.sym}</button>
              ))}
            </div>
            <input className={'frac' + (b && !fb ? ' bad' : '')} value={b} onChange={(e) => setB(e.target.value)} placeholder="1/3" aria-label="Second fraction" />
          </div>

          {calc?.err && <p className="err">{calc.err === 'division by zero' ? "You can't divide by zero." : calc.err}</p>}
          {!fa || !fb ? (
            <p className="hint">Enter two values — a fraction (3/4), a mixed number (1 1/2), a whole number or a decimal.</p>
          ) : calc?.r ? (
            <div className="answer">
              <div className="abig">{fmtMixed(calc.r)}</div>
              <div className="arow"><span>Fraction</span><b>{fmtImproper(calc.r)}</b></div>
              <div className="arow"><span>Mixed number</span><b>{fmtMixed(calc.r)}</b></div>
              <div className="arow"><span>Decimal</span><b>{fmtDecimal(calc.r)}</b></div>
              <div className="arow"><span>Percent</span><b>{pct(calc.r)}</b></div>
            </div>
          ) : null}

          {steps.length > 0 && (
            <div className="steps">
              <h2>Working</h2>
              <ol>{steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
            </div>
          )}
        </>
      ) : (
        <>
          <input className={'frac wide' + (s && !fs ? ' bad' : '')} value={s} onChange={(e) => setS(e.target.value)} placeholder="18/24 or 0.75 or 1 3/4" aria-label="Fraction or decimal" />
          {!fs ? (
            <p className="hint">Enter a fraction (18/24), a decimal (0.75) or a mixed number (1 3/4).</p>
          ) : (
            <div className="answer">
              <div className="abig">{fmtMixed(fs)}</div>
              <div className="arow"><span>Simplest fraction</span><b>{fmtImproper(fs)}</b></div>
              <div className="arow"><span>Mixed number</span><b>{fmtMixed(fs)}</b></div>
              <div className="arow"><span>Decimal</span><b>{fmtDecimal(fs)}</b></div>
              <div className="arow"><span>Percent</span><b>{pct(fs)}</b></div>
            </div>
          )}
        </>
      )}

      <section className="explain">
        <h2>How fraction arithmetic works</h2>
        <p>
          To <strong>add or subtract</strong>, both fractions need the same denominator: multiply
          each by the factor that gets it to the lowest common denominator, then add or subtract the
          numerators. To <strong>multiply</strong>, multiply the numerators together and the
          denominators together. To <strong>divide</strong>, flip the second fraction and multiply.
          Every answer here is then reduced by dividing top and bottom by their greatest common
          divisor.
        </p>
        <h3>Mixed numbers</h3>
        <p>
          A mixed number like <code>1 1/2</code> is converted to an improper fraction
          (<code>3/2</code>) first, and the answer is offered both ways.
        </p>
        <h3>Repeating decimals</h3>
        <p>
          When a fraction doesn't terminate, the repeating part is shown in brackets —
          <code> 1/3 = 0.(3)</code>, <code>1/7 = 0.(142857)</code>.
        </p>
        <h3>Is anything sent to a server?</h3>
        <p>No. It's exact integer arithmetic in your browser. The inputs are in the page URL so you can share a calculation.</p>
        <footer>Fraction Calculator · client-side · no sign-up · works offline</footer>
      </section>
    </div>
  );
}
