"use client";

import { ArrowLeft, Blocks, Code2, Orbit, Sparkles } from "lucide-react";

export function EcosystemView({ onBack }: { onBack: () => void }) {
  return <section className="ecosystem-view">
    <div className="view-title"><div className="eyebrow">BUILT AROUND THE WHEEL</div><h1>A little chain. <span>A world of possibilities.</span></h1><p>A home for everything being built on Squeekchain.</p></div>
    <div className="panel ecosystem-soon">
      <div className="ecosystem-constellation" aria-hidden="true"><span className="ecosystem-satellite satellite-one"><Code2 size={22}/></span><span className="ecosystem-center"><Orbit size={48} strokeWidth={1.2}/></span><span className="ecosystem-satellite satellite-two"><Blocks size={22}/></span><span className="ecosystem-star"><Sparkles size={17}/></span></div>
      <span className="ecosystem-status"><span/>COMING SOON</span>
      <h2>The ecosystem is taking shape.</h2>
      <p>Soon, discover the apps, games, and tools built on Squeekchain.<br/>One place to find what you can explore, use, and build on.</p>
      <div className="ecosystem-note">Official and community projects will be clearly distinguished.<br/>Listings will open when projects are ready to explore.</div>
      <button className="button ecosystem-back" onClick={onBack}><ArrowLeft size={15}/>Back to overview</button>
      <span className="ecosystem-signoff">Small beginnings. Plenty of room to grow.</span>
    </div>
  </section>;
}
