import AnnouncementBar from '@/components/AnnouncementBar';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategoryNav from '@/components/CategoryNav';
import FirmGrid from '@/components/FirmGrid';

export const metadata = {
  title: 'Prop Firm Match | Compare the Best Prop Trading Firms of 2026',
  description: 'Trusted platform to compare prop trading firms using verified data and insights. Find the best Forex, Futures, and Crypto challenges.',
};

export default function Home() {
  return (
    <main className="main-container">
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <CategoryNav />
      <FirmGrid />
      
      <footer className="footer container glass">
        <p>© 2026 Prop Firm Match. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </footer>
      
    </main>
  );
}
