import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Sequence, delayRender, continueRender, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { C, FPS, SPRING, T, clamp } from './theme';
import { CAPS, SCENE_TAGS, Cap } from './data';
import { PAGE_NAME } from './brand';

const FONTS: [string, string, string][] = [
  ['Hind', '600', 'hind-siliguri-bengali-600-normal.woff2'],
  ['Hind', '700', 'hind-siliguri-bengali-700-normal.woff2'],
  ['NSB', '800', 'noto-serif-bengali-bengali-800-normal.woff2'],
];
export const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FONTS.map(([f, w, u]) => new FontFace(f, `url(${staticFile('fonts/' + u)})`, { weight: w }).load().then((ff) => document.fonts.add(ff))))
      .then(() => continueRender(h))
      .catch(() => continueRender(h));
  }, [h]);
};

// 540x960 design space scaled to 1080x1920, with slow push-in, fade-in, grain + vignette
export const Stage: React.FC<{ dur: number; push?: number; children: React.ReactNode; bg?: string }> = ({ dur, push = 0.05, children, bg }) => {
  const f = useCurrentFrame();
  const progress = Math.min(1, Math.max(0, f / Math.max(1, dur)));
  const eased = progress * progress * (3 - 2 * progress);
  const sc = 1 + push * eased;
  const driftX = Math.sin(progress * Math.PI) * 7;
  const driftY = Math.sin(progress * Math.PI * 1.35) * -5;
  const op = interpolate(f, [0, 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: bg ?? C.beige, opacity: op }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${driftX}px, ${driftY}px) scale(${sc})`, transformOrigin: '50% 56%' }}>
        <div style={{ width: 540, height: 960, transform: 'scale(2)', transformOrigin: '0 0', position: 'relative', overflow: 'hidden' }}>
          <svg width={540} height={960} viewBox="0 0 540 960" style={{ position: 'absolute', left: 0, top: 0 }}>{children}</svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const parse = (t: string) =>
  t.split('\n').map((line, i) => (
    <div key={i}>
      {line.split(/(\{[^}]+\})/).map((p, j) =>
        p.startsWith('{') ? <b key={j} style={{ color: C.red, textShadow: '0 1px 0 #ffffff' }}>{p.slice(1, -1)}</b> : <span key={j}>{p}</span>
      )}
    </div>
  ));

const Caption: React.FC<{ cap: Cap; len: number }> = ({ cap, len }) => {
  const f = useCurrentFrame();
  const sp = spring({ frame: f, fps: FPS, config: SPRING });
  const out = interpolate(f, [len - 5, len], [1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: 18, right: 18, bottom: 168, display: 'flex', justifyContent: 'center', opacity: Math.min(1, sp) * out, transform: `translateY(${(1 - sp) * 18}px) scale(${0.94 + 0.06 * sp})`, filter: 'drop-shadow(0 9px 18px #0004)' }}>
      <div style={{ maxWidth: 492, minWidth: 180, padding: '13px 22px 15px', borderRadius: 22, background: 'linear-gradient(145deg, #fffaf3 0%, #F2E8DA 100%)', border: '1.5px solid #ffffffb8', boxShadow: 'inset 0 1px 0 #fff, 0 3px 0 #d7c9b8', fontFamily: 'Hind', fontWeight: 700, fontSize: 27, lineHeight: 1.38, color: C.ink, textAlign: 'center', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
        {cap.who && <div style={{ fontSize: 14, fontWeight: 600, color: '#8a7a68', marginBottom: 2 }}>● {cap.who}</div>}
        {parse(cap.t)}
      </div>
    </div>
  );
};

export const Overlay: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const tag = SCENE_TAGS.find((x) => t >= x.s + 0.15 && t < x.e);
  const ts = tag ? tag.s : 0;
  const tsp = spring({ frame: f - T(ts + 0.2), fps: FPS, config: SPRING });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ width: 540, height: 960, transform: 'scale(2)', transformOrigin: '0 0', position: 'relative' }}>
          {PAGE_NAME !== '' && (
            <div style={{ position: 'absolute', left: '50%', top: 26, transform: 'translateX(-50%)', padding: '6px 26px', borderRadius: 24, background: '#f1e8d8d9', fontFamily: 'NSB', fontWeight: 800, fontSize: 17, color: C.ink, whiteSpace: 'nowrap' }}>— {PAGE_NAME} —</div>
          )}
          {tag && (
            <div style={{ position: 'absolute', left: '50%', top: 68, transform: `translateX(-50%) scale(${0.85 + 0.15 * Math.min(1, tsp)})`, opacity: Math.min(1, tsp), padding: '8px 25px 9px', borderRadius: 30, background: 'linear-gradient(145deg, #fffaf3, #F0E4D3)', border: `3px solid ${C.red}`, boxShadow: '0 7px 18px #0004, inset 0 1px 0 #fff', fontFamily: 'Hind', fontWeight: 700, fontSize: 27, lineHeight: 1.25, color: C.ink, whiteSpace: 'nowrap' }}>
              <i style={{ display: 'inline-block', width: 13, height: 13, borderRadius: '50%', background: C.red, marginRight: 11, verticalAlign: 'middle' }} />{tag.tag}
            </div>
          )}
          {CAPS.map((c, i) => {
            const len = T(c.e + 0.18) - T(c.s);
            return (
              <Sequence key={i} from={T(c.s)} durationInFrames={len}>
                <Caption cap={c} len={len} />
              </Sequence>
            );
          })}
        </div>
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(30,15,5,0.22) 100%)', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ opacity: 0.1, mixBlendMode: 'multiply', pointerEvents: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${(f % 3) + 1}'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")` }} />
    </AbsoluteFill>
  );
};
