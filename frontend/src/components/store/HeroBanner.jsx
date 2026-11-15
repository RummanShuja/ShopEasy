import { ArrowRight } from 'lucide-react';
import heroImage from '../../assets/pharmacy-hero.webp';

export function HeroBanner() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title">Everyday care,<br /><span>made easy.</span></h1>
        <p>From first-aid staples to daily wellness, find essentials for you and your home.</p>
        <a className="button button--primary hero-button" href="#products">Shop Now <ArrowRight size={18} /></a>
      </div>
      <div className="hero-media">
        <img className="hero-image" src={heroImage} alt="" fetchPriority="high" width="1180" height="787" />
      </div>
    </section>
  );
}
