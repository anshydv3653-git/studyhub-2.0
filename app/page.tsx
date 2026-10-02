import HeroSection from '@/components/HeroSection';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <main className="w-full overflow-hidden bg-black">
      <Navbar />
      <HeroSection />
    </main>
  );
}
