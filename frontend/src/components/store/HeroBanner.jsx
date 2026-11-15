import { ArrowRight } from 'lucide-react';
import heroImage from '../../assets/wellness-hero.webp';

export function HeroBanner() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title">Care for<br /><span>every day.</span></h1>
        <p>Shop first aid, vitamins, and personal care for you and your home.</p>
        <a className="button button--primary hero-button" href="#products">Shop Now <ArrowRight size={19} aria-hidden="true" /></a>
      </div>
      <div className="hero-media">
        <img className="hero-image" src={heroImage} alt="" fetchPriority="high" width="1536" height="1024" />
      </div>
    </section>
  );
}
