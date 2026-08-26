"use client";

import Image from "next/image";
import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";

const OrbitScene = lazy(() => import("./orbit-scene").then((module) => ({ default: module.OrbitScene })));
const RunestoneScene = lazy(() => import("./runestone-scene").then((module) => ({ default: module.RunestoneScene })));

type Theme = "light" | "dark" | "dog";
const themes: { id: Theme; label: string }[] = [{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "dog", label: "DOG" }];

const themeEvent = "dogworld-theme-change";
const getTheme = (): Theme => typeof document === "undefined" ? "dark" : ((document.documentElement.dataset.theme as Theme) || "dark");
const subscribeTheme = (callback: () => void) => {
  window.addEventListener(themeEvent, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(themeEvent, callback); window.removeEventListener("storage", callback); };
};
const applyTheme = (next: Theme) => {
  document.documentElement.dataset.theme = next;
  localStorage.setItem("dogworld-theme", next);
  let meta = document.querySelector<HTMLMetaElement>('meta[data-manual-theme="true"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.dataset.manualTheme = "true";
    document.head.appendChild(meta);
  }
  meta.content = next === "dog" ? "#f47a19" : next === "light" ? "#f4eedf" : "#171715";
  window.dispatchEvent(new Event(themeEvent));
};

type NetworkInformation = { saveData?: boolean };
function AdaptiveOrbit() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      const probe = document.createElement("canvas");
      const webgl = Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
      setEnabled(!motion.matches && !connection?.saveData && webgl);
    };
    queueMicrotask(update);
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);
  if (!enabled) return <div className="orbit-scene" aria-hidden="true"><div className="orbit-fallback" /></div>;
  return <Suspense fallback={<div className="orbit-scene" aria-hidden="true"><div className="orbit-fallback" /></div>}><OrbitScene /></Suspense>;
}

type WorldSymbol = "trail" | "maker" | "send" | "pack" | "origin" | "down" | "menu" | "beacon";

function WorldIcon({ name }: { name: WorldSymbol }) {
  const symbols = {
    trail: <><path className="symbol-orbit" d="M7 38C12 14 34 7 52 17"/><path className="symbol-core" d="m36 17 21 14-21 14 5-11-15-7 15-1-5-9Z"/><path className="symbol-node" d="M8 33 14 37 10 44 4 40Z"/></>,
    maker: <><path className="symbol-core" d="m32 25 14 11-5 17H23l-5-17 14-11Z"/><path className="symbol-core" d="m15 17 8 5-5 9-8-5 5-9Zm14-8 8 1-1 10-9-1 2-10Zm19 8 7 7-7 7-7-7 7-7Z"/><path className="symbol-cut" d="m26 38 6-7 6 7-3 9h-6l-3-9Z"/></>,
    send: <><path className="symbol-orbit" d="M6 45c13 3 22-1 28-10"/><path className="symbol-core" d="m22 13 9 8 10-8 2 12 10 6-8 8-1 13-13-6-12 6 1-13-9-8 10-6 1-12Z"/><path className="symbol-cut" d="m23 29 8 4 8-4-2 9-6 4-6-4-2-9Z"/><path className="symbol-node" d="m6 40 7 3-3 7-7-3 3-7Z"/></>,
    pack: <><path className="symbol-orbit" d="M8 45c8-12 39-12 48 0"/><g className="symbol-core"><path d="m9 19 5-7 5 7 5-4-1 13-9 7-9-7-1-13 5 4Z"/><path d="m27 13 5-8 5 8 6-4-1 15-10 7-10-7-1-15 6 4Z"/><path d="m45 19 5-7 5 7 5-4-1 13-9 7-9-7-1-13 5 4Z"/></g><path className="symbol-cut" d="m28 18 4 2 4-2-1 5-3 2-3-2-1-5Z"/></>,
    origin: <><path className="symbol-core" d="m20 5 22 3 11 15-7 35H15L8 24 20 5Z"/><path className="symbol-cut" d="M24 13h12l8 11-4 23H21l-4-21 7-13Z"/><path className="symbol-orbit" d="M18 38c8-10 19-13 29-7M20 21c10 0 18 5 23 14"/><path className="symbol-node" d="m28 29 5-4 5 4-2 6h-6l-2-6Z"/></>,
    down: <><path className="symbol-core" d="M18 8h28l-5 20-9 13-9-13-5-20Z"/><path className="symbol-cut" d="m25 14 7 5 7-5-2 10-5 7-5-7-2-10Z"/><path className="symbol-orbit" d="M10 43c12 8 32 8 44 0"/><path className="symbol-node" d="m29 48 3-3 3 3-3 5-3-5Z"/></>,
    menu: <><path className="symbol-core" d="m12 25 5-14 12 10h6l12-10 5 14-7 22-13 8-13-8-7-22Z"/><path className="symbol-cut" d="m20 29 8 4-5 5-5-4 2-5Zm24 0 2 5-5 4-5-5 8-4Zm-17 13h10l-5 6-5-6Z"/></>,
    beacon: <><path className="symbol-orbit" d="M8 33c12-16 36-16 48 0"/><path className="symbol-core" d="m32 9 10 17-10 8-10-8L32 9Z"/><path className="symbol-cut" d="m32 17 4 8-4 3-4-3 4-8Z"/><path className="symbol-node" d="m8 29 5 4-5 5-5-5 5-4Zm48 0 5 4-5 5-5-5 5-4Z"/></>,
  };
  return <svg className={`world-symbol world-symbol-${name}`} viewBox="0 0 64 64" aria-hidden="true">{symbols[name]}</svg>;
}

function BrandLockup() {
  return <span className="brand-lockup"><span className="brand-emblem"><Image src="/dog-world-emblem.png" width={1254} height={1254} alt="" /></span><span>DOG<span className="brand-dot">•</span>WORLD</span></span>;
}

export function DogWorldExperience() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstNavRef = useRef<HTMLAnchorElement>(null);
  const menuWasOpened = useRef(false);
  const lightFrame = useRef<number | null>(null);
  const chooseTheme = (next: Theme) => applyTheme(next);
  useEffect(() => {
    if (menuOpen) {
      menuWasOpened.current = true;
      firstNavRef.current?.focus();
      const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
      document.addEventListener("keydown", closeOnEscape);
      return () => document.removeEventListener("keydown", closeOnEscape);
    }
    if (menuWasOpened.current) {
      menuWasOpened.current = false;
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => () => {
    if (lightFrame.current !== null) cancelAnimationFrame(lightFrame.current);
  }, []);

  const moveLight = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches || lightFrame.current !== null) return;
    const x = `${(event.clientX / window.innerWidth) * 100}%`;
    const y = `${(event.clientY / window.innerHeight) * 100}%`;
    const frame = event.currentTarget;
    lightFrame.current = requestAnimationFrame(() => {
      frame.style.setProperty("--pointer-x", x);
      frame.style.setProperty("--pointer-y", y);
      lightFrame.current = null;
    });
  };

  return <div className="site-frame" onPointerMove={moveLight}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className={headerScrolled || menuOpen ? "site-header is-scrolled" : "site-header"}>
      <a className="brand" href="#top" aria-label="DOG World home"><BrandLockup /></a>
      <nav id="primary-navigation" className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="Main navigation">
        <a ref={firstNavRef} href="#world" onClick={() => setMenuOpen(false)}>World</a><a href="#companion" onClick={() => setMenuOpen(false)}>Companion</a><a href="#packs" onClick={() => setMenuOpen(false)}>Packs</a><a href="#origin" onClick={() => setMenuOpen(false)}>Provenance</a>
        <div className="mobile-theme-panel"><span>Choose your world</span><div className="theme-switcher" role="group" aria-label="Mobile color theme">{themes.map((item) => <button key={item.id} className={theme === item.id ? "is-active" : ""} aria-pressed={theme === item.id} onClick={() => chooseTheme(item.id)}>{item.label}</button>)}</div></div>
      </nav>
      <div className="header-actions">
        <div className="theme-switcher desktop-theme" role="group" aria-label="Color theme">{themes.map((item) => <button key={item.id} className={theme === item.id ? "is-active" : ""} aria-pressed={theme === item.id} onClick={() => chooseTheme(item.id)}>{item.label}</button>)}</div>
        <a className="button button-small desktop-cta" href="#world">Explore the World</a>
        <button ref={menuButtonRef} className="menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-controls="primary-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><WorldIcon name="menu" /></button>
      </div>
    </header>
    <main id="main">
      <section className="hero" id="top">
        <div className="hero-backdrop" aria-hidden="true"><Image src="/dog-world-hero-world.png" fill priority sizes="100vw" alt="" /></div>
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> Built by the Pack <b>•</b> Born on Bitcoin</p>
          <h1>Welcome to<br/>the <em>DOG side</em><br/>of the moon.</h1>
          <p className="hero-lede">Create your DOG. Find your Pack. Make something worth sending around the world.</p>
          <div className="hero-actions"><a className="button" href="#world">Explore DOG•WORLD <WorldIcon name="trail" /></a><a className="text-link" href="#companion">Meet your DOG <WorldIcon name="down" /></a></div>
          <div className="provenance-chip"><WorldIcon name="origin" /><span>Born from Runestone</span><b>Rune 840000:3</b></div>
          <div className="hero-mobile-signals" aria-label="DOG provenance signals"><span><i />Genesis <b>Pack</b></span><span><i />Origin block <b>840000</b></span></div>
        </div>
        <div className="hero-world" role="img" aria-label="An orange-hooded DOG overlooking a living lunar community"><AdaptiveOrbit /><div className="signal signal-one"><span /> GENESIS <b>PACK</b></div><div className="signal signal-two"><span /> ORIGIN BLOCK <b>840000</b></div></div>
        <div className="scroll-cue" aria-hidden="true"><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section className="culture section" aria-labelledby="culture-title">
        <div className="culture-heading"><p className="eyebrow"><span /> CULTURE IS THE UTILITY</p><h2 id="culture-title">Made by everyone.<br/><em>Owned by no one.</em></h2><p>Four ways into one world: create, explore, build, and leave things better than you found them.</p></div>
        <div className="collectible-stage"><Image src="/dog-world-collectibles.png" width={1774} height={887} sizes="(max-width: 820px) 140vw, 80vw" alt="Four original DOG World character concepts: creator, explorer, builder, and rescue champion" /><div className="collection-meta"><span>COMMUNITY CONCEPT SERIES</span><b>01 — 04</b></div></div>
      </section>

      <section className="promise section" id="world">
        <div className="section-intro"><p className="eyebrow"><span /> THE SIMPLE PROMISE</p><h2>DOG is for <em>doing.</em></h2></div>
        <div className="verb-list">
          <article><span>01</span><div className="world-sigil world-sigil-maker"><WorldIcon name="maker" /></div><h3>Create with it.</h3><p>Turn ideas into memes, art, clips and culture with your DOG beside you.</p></article>
          <article><span>02</span><div className="world-sigil world-sigil-send"><WorldIcon name="send" /></div><h3>Send it.</h3><p>Tip a creator, reward a friend or pay with a tap.</p></article>
          <article><span>03</span><div className="world-sigil world-sigil-pack"><WorldIcon name="pack" /></div><h3>Build with it.</h3><p>Start a Pack, launch an experience or make something for the community.</p></article>
        </div>
      </section>

      <section className="companion section" id="companion">
        <div className="phone-stage" role="img" aria-label="Concept of a personalized DOG companion inside the DOG World mobile experience"><div className="phone-shell" aria-hidden="true"><div className="phone-top"><span>9:41</span><b>DOG•WORLD</b><i><WorldIcon name="beacon" /></i></div><div className="phone-scene"><div className="companion-fallback"><Image src="/dog-world-emblem.png" width={1254} height={1254} alt="" /></div><Image className="companion-image" src="/dog-world-companion-v3.webp" width={1122} height={1402} sizes="330px" unoptimized alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div className="phone-orbit" /><span className="companion-signal">ONLINE <b>•</b></span></div><div className="phone-card"><small>YOUR DOG</small><strong>Ready to make something?</strong><div className="phone-action">Let’s create <WorldIcon name="maker" /></div></div><div className="phone-nav"><span>World</span><b><WorldIcon name="trail" /></b><span>My DOG</span></div></div><span className="floating-tag tag-one">PERSONALITY <b>CURIOUS</b></span><span className="floating-tag tag-two">PACK <b>GENESIS</b></span></div>
        <div className="companion-copy"><p className="eyebrow"><span /> MEET YOUR DOG</p><h2>Part companion.<br/>Part creative partner.<br/><em>Entirely yours.</em></h2><p>Your DOG learns what you love, helps you create and explores the community beside you.</p><a className="button" href="#packs">Explore Packs <WorldIcon name="trail" /></a></div>
      </section>

      <section className="packs section" id="packs">
        <div className="packs-copy"><p className="eyebrow"><span /> FIND YOUR PEOPLE</p><h2>Everything is better with a <em>Pack.</em></h2><p>Build around a place, creator, idea, game or cause. Give people somewhere to belong and something to accomplish together.</p><a className="text-link" href="#origin">Explore the origin <WorldIcon name="origin" /></a></div>
        <div className="pack-visual" aria-label="A living community hub for DOG Packs"><div className="community-art"><Image src="/dog-world-community.png" fill sizes="(max-width: 820px) 100vw, 55vw" alt="DOG World community members creating, building, and helping rescue dogs together" /></div><div className="pack-plaque"><small>PACK 0001 • COMMUNITY CONCEPT</small><h3>The world gets better when DOGs do.</h3><p>Creators, builders, local Packs and real-world rescue—all in the same orbit.</p></div></div>
      </section>

      <section className="origin section" id="origin">
        <AdaptiveOrbit />
        <div className="origin-copy"><p className="eyebrow"><span /> THE ORIGIN</p><h2>Born at Bitcoin<br/>block <em>840,000.</em></h2><p>DOG was distributed freely to the Runestone community. No presale. No team allocation. No permission required.</p><div className="origin-facts"><span>DOG•GO•TO•THE•MOON</span><span>RUNE 840000:3</span><span>VERIFICATION PATH COMING</span></div></div>
        <div className="artifact-stage" role="img" aria-label="The original Runestone artifact, rendered from its 3D model"><div className="artifact-halo" /><Image className="runestone-fallback-image" src="/original-runestone-fallback.png" width={594} height={793} sizes="(max-width: 820px) 78vw, 34vw" alt="" /><Suspense fallback={null}><RunestoneScene /></Suspense><div className="artifact-plaque"><span>ORIGIN ARTIFACT</span><b>840000:3</b><small>ORIGINAL RUNESTONE • INTERACTIVE 3D</small></div></div>
        <p className="founder-note">DOG•WORLD is being developed by an original Runestone holder who reports receiving DOG through the original distribution. Public verification is planned.</p>
      </section>

      <section className="permissionless section" id="principles">
        <div className="permissionless-copy"><p className="eyebrow"><span /> CC0 • COMMUNITY OWNED</p><h2>Open by design.<br/><em>Alive because of you.</em></h2><p>DOG’s culture does not sit behind a velvet rope. Take the signal, remix it, build on it and send it further.</p><a className="text-link" href="#origin">Trace it to the origin <WorldIcon name="origin" /></a></div>
        <div className="open-system" aria-label="DOG World open culture principles">
          <div className="system-rail"><span>OPEN CULTURE PROTOCOL</span><b>CC0</b></div>
          <div className="system-core"><span className="system-ring ring-one" /><span className="system-ring ring-two" /><span className="system-emblem"><Image src="/dog-world-emblem.png" width={1254} height={1254} alt="" /></span><small>THE SIGNAL<br/><b>BELONGS TO THE PACK</b></small></div>
          <div className="system-path" aria-hidden="true"><span /><span /><span /></div>
          <div className="system-actions"><article><WorldIcon name="maker" /><span>MAKE</span><b>No permission</b></article><article><WorldIcon name="trail" /><span>REMIX</span><b>No gatekeepers</b></article><article><WorldIcon name="pack" /><span>BUILD</span><b>With the Pack</b></article></div>
          <div className="system-footer"><span>PUBLIC DOMAIN</span><i /><span>BITCOIN BORN</span><i /><span>COMMUNITY LED</span></div>
        </div>
      </section>

      <section className="join section" id="join">
        <div className="join-stage">
          <div className="join-copy"><p className="eyebrow"><span /> THE FIRST PACK IS FORMING</p><h2>Meet us on<br/>the <em>DOG side.</em></h2><p>Genesis Pack access is coming. The people who show up first will help decide what this world becomes.</p><span className="status-pill" role="status">Genesis Pack opens soon <WorldIcon name="maker" /></span><div className="join-signature">DOG<span>•</span>GO<span>•</span>TO<span>•</span>THE<span>•</span>MOON</div></div>
          <div className="pack-beacon" role="img" aria-label="A pack of dogs gathering at a Bitcoin-orange beacon on the moon"><div className="genesis-art"><Image src="/dog-world-genesis-pack-v1.webp" fill sizes="(max-width: 1080px) 88vw, 48vw" alt="" unoptimized /></div><span className="genesis-index">PACK / 0001</span><span className="beacon-signal"><WorldIcon name="pack" /> PACK SIGNAL <b>ONLINE</b></span></div>
        </div>
      </section>
    </main>
    <footer><a className="brand" href="#top" aria-label="DOG World home"><BrandLockup /></a><p>Independent and community-built. Not affiliated with or endorsed by the creators of DOG, Runestone or the Runes protocol.</p><span>BUILT FOR THE PACK • 2026</span></footer>
  </div>;
}
