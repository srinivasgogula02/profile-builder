import React from 'react';
import Hero from './home/_components/Hero';
import Features from './home/_components/Features';
import Testimonials from './home/_components/Testimonials';
import HowItWorks from './home/_components/HowItWorks';
import FAQ from './home/_components/FAQ';
import Footer from './home/_components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Personal Profile Generator | Build Your Professional Brand',
  description: 'Turn your LinkedIn profile into a stunning professional one-pager in seconds with our AI Personal Profile Generator.',
};

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Features />
      <Testimonials />
      <HowItWorks />
      <FAQ />
      <Footer />
    </main>
  );
}

