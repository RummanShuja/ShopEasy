import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/pharmacy-hero.png';

export function HeroBanner({ shop = false, offers = false }) {
  return <section className={`hero${shop ? ' hero--shop' : ''}`} aria-labelledby="hero-title">
    <img className="hero-image" src={heroImage} alt="ShopEasy daily vitamins and skincare on warm stone with sunlit leaves" fetchPriority="high" width="2172" height="724" />
    <div className="container hero-inner"><div className="hero-copy"><span className="eyebrow">{offers ? 'Shop / Offers' : shop ? 'Shop / Everyday essentials' : 'Your everyday wellbeing, thoughtfully considered'}</span>
      <h1 id="hero-title">{offers ? <>Everyday care,<br />extra value.</> : shop ? <>Wellness for<br />everyday living.</> : <>Care,<br />thoughtfully<br />delivered.</>}</h1>
      <p>{offers ? 'Explore current offers on your everyday essentials. A little more care, for a little less.' : shop ? 'Discover vitamins, personal care, and everyday essentials for a little more wellbeing.' : 'Everyday wellness, personal care, and a little peace of mind. All in one thoughtful place.'}</p>
      {!shop && <div className="hero-actions"><Link className="button button--primary" to="/shop">Shop essentials <ArrowRight size={19} /></Link>
        <Link className="button button--secondary" to="/shop?category=Vitamins">Explore wellness</Link></div>}
    </div></div>
  </section>;
}
