import AnnouncementBar from '@/components/AnnouncementBar';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategoryNav from '@/components/CategoryNav';
import FirmGrid from '@/components/FirmGrid';
import Features from '@/components/Features';
import Community from '@/components/Community';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

import { BRAND_DESCRIPTION, BRAND_NAME } from '@/lib/brand';

export const metadata = {
  title: `${BRAND_NAME} | Compare the Best Prop Trading Firms`,
  description: BRAND_DESCRIPTION,
};

export default function Home() {
  return (
    <main className="main-container">
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <CategoryNav />
      <FirmGrid />
      <Features />
      <Community />
      <Newsletter />
      <Footer />
    </main>
  );
}
