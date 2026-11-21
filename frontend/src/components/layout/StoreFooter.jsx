import { ArrowUpRight, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function StoreFooter() {
  return <footer className="store-footer"><div className="container footer-main"><div className="footer-brand"><Logo /><p>Thoughtfully chosen essentials.<br />A little more wellbeing, every day.</p><Leaf size={35} strokeWidth={1} /></div>
    <div><h2>Explore your care</h2><nav aria-label="Shop links"><Link to="/shop">Shop all essentials</Link><Link to="/shop?category=Vitamins">Vitamins & supplements</Link><Link to="/shop?category=Skin%20Care">Skin & personal care</Link><Link to="/shop?category=First%20Aid">First aid</Link></nav></div>
    <div><h2>Make yourself at home</h2><nav aria-label="Account links"><Link to="/login">Your account</Link><Link to="/orders">Orders & tracking</Link><Link to="/register">Join ShopEasy <ArrowUpRight size={14} /></Link><Link to="/admin">Store management</Link></nav></div>
    <div className="footer-purpose"><span className="eyebrow">Care, thoughtfully delivered.</span><h2>For the everyday.<br />For you.</h2><p>Follow product labels and consult a healthcare professional when you need advice.</p></div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} ShopEasy. Made with care.</span><span>Pharmacy & everyday wellness · Demo store</span></div></footer>;
}
