import React from 'react';
import Hero from './home/_components/Hero';
import HowItWorks from './home/_components/HowItWorks';
import Features from './home/_components/Features';
import Testimonials from './home/_components/Testimonials';
import FAQ from './home/_components/FAQ';
import Footer from './home/_components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instant Professional Profile Builder | Close Deals Faster',
  description: 'Create a stunning, high-impact professional profile in seconds. Designed for business owners, consultants, and professionals to share instantly and win clients.',
  keywords: 'business profile, professional portfolio, b2b profile builder, client presentation, instant profile generator, business owner portfolio',
};

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
