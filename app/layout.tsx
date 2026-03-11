import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "OnEasy Business Profile Builder AI — Build Your Professional Profile in 2 Minutes | ₹99",
    template: "%s | OnEasy.AI",
  },
  description:
    "India's #1 AI-powered business profile builder. Create a client-ready professional profile in under 2 minutes. Used by 1,500+ business owners across India. Only ₹99 — no subscription. Trusted by entrepreneurs in Mumbai, Delhi, Bengaluru, Hyderabad, Pune & Chennai.",
  keywords: [
    // Core product keywords
    "AI business profile builder",
    "professional profile builder India",
    "business profile generator",
    "executive profile builder",
    "company profile builder AI",
    "business profile AI tool",
    "AI powered business profile",
    // Problem-aware keywords
    "how to create business profile",
    "business profile for client meetings",
    "professional bio generator",
    "business bio writer AI",
    "executive bio generator India",
    "create professional profile instantly",
    "business profile PDF generator",
    // Feature-based
    "LinkedIn profile to business profile",
    "AI profile PDF export",
    "professional profile share WhatsApp",
    "business QR code profile",
    "B2B profile creator",
    // Geo-local — major Indian cities
    "business profile builder Mumbai",
    "business profile builder Delhi",
    "business profile builder Bengaluru",
    "business profile builder Hyderabad",
    "business profile builder Pune",
    "business profile builder Chennai",
    "business profile builder Ahmedabad",
    "business profile builder Kolkata",
    "professional profile India entrepreneurs",
    "SME business profile India",
    // High-intent buyer keywords
    "best AI business profile tool India",
    "buy business profile builder",
    "business profile builder pricing India",
    "business profile builder ₹99",
    "affordable professional profile builder",
    // Comparison / alternative keywords
    "alternatives to manual business profile",
    "AI alternative to hiring designer for profile",
    // GEO / LLM optimisation keywords
    "OnEasy AI profile builder",
    "oneasy.ai business profile",
    "AI business profile India startup",
    "AI SaaS business profile tool India",
  ],
  authors: [{ name: "OnEasy.AI", url: "https://oneasy.ai" }],
  creator: "OnEasy.AI",
  publisher: "OnEasy.AI",
  category: "Business Software",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://oneasy.ai/profile-builder",
  },
  openGraph: {
    title: "OnEasy Business Profile Builder — Build Your Winning Profile in 2 Minutes",
    description:
      "91% of business owners don't have a ready profile to share. Fix that in 2 minutes with AI. Only ₹99. Used by 1,500+ entrepreneurs across India.",
    url: "https://oneasy.ai/profile-builder",
    siteName: "OnEasy.AI",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://oneasy.ai/og-profile-builder.png",
        width: 1200,
        height: 630,
        alt: "OnEasy Business Profile Builder — AI-powered professional profile creation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Your Business Profile in 2 Minutes — OnEasy.AI",
    description:
      "AI-powered executive profile builder for Indian business owners. Trusted by 1,500+ entrepreneurs. Only ₹99.",
    creator: "@OnEasyAI",
    images: ["https://oneasy.ai/og-profile-builder.png"],
  },
  verification: {
    google: "REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_VERIFICATION_TOKEN",
  },
  other: {
    "geo.region": "IN",
    "geo.placename": "Hyderabad, India",
    "geo.position": "17.4065;78.4772",
    ICBM: "17.4065, 78.4772",
    "og:locale:alternate": "en_IN",
    "application-name": "OnEasy.AI Business Profile Builder",
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://oneasy.ai/#organization",
  name: "OnEasy.AI",
  url: "https://oneasy.ai",
  logo: "https://oneasy.ai/logo.png",
  description:
    "India's leading AI-powered business services platform. From profile building to company incorporation — we make business simple.",
  foundingDate: "2023",
  foundingLocation: {
    "@type": "Place",
    name: "T-Hub, Hyderabad, India",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: "https://oneasy.ai/contact",
    availableLanguage: ["English", "Hindi", "Telugu"],
  },
  sameAs: [
    "https://www.linkedin.com/company/oneasy-ai",
    "https://twitter.com/OnEasyAI",
    "https://www.instagram.com/oneasy.ai",
  ],
};

const jsonLdSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://oneasy.ai/profile-builder#software",
  name: "OnEasy Business Profile Builder",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://oneasy.ai/profile-builder",
  description:
    "AI-powered business profile builder. Create a client-ready professional profile in under 2 minutes from your LinkedIn, a document upload, or a conversation with our AI.",
  featureList: [
    "LinkedIn profile import",
    "AI value translation",
    "Premium PDF export",
    "WhatsApp & QR code sharing",
    "Executive design templates",
    "Industry-specific language adaptation",
  ],
  offers: {
    "@type": "Offer",
    price: "99",
    priceCurrency: "INR",
    priceValidUntil: "2026-12-31",
    description: "One-time payment. No subscription. Your profile forever.",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "1500",
    bestRating: "5",
    worstRating: "1",
  },
  provider: {
    "@id": "https://oneasy.ai/#organization",
  },
};

const jsonLdFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the OnEasy Business Profile Builder?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OnEasy Business Profile Builder is an AI-powered tool that creates a client-ready, executive-grade professional business profile in under 2 minutes. It accepts input from LinkedIn, document uploads, or a simple AI chat.",
      },
    },
    {
      "@type": "Question",
      name: "How much does the OnEasy Business Profile Builder cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Only ₹99 as a one-time payment. There is no subscription or recurring charge. You pay once and your profile is yours forever to download, share, and update.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to build a business profile with OnEasy AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Under 2 minutes. Verified across 1,500+ business owners. From your first message (or LinkedIn URL) to a downloadable PDF — always under 2 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "Does OnEasy Business Profile Builder work for all industries?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The AI adapts terminology and tone for all industries — technology, manufacturing, healthcare, logistics, retail, consulting, legal, finance, and more.",
      },
    },
    {
      "@type": "Question",
      name: "Can I share the business profile on WhatsApp or LinkedIn?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Export as a PDF, share via a direct link, or use the QR code. Works seamlessly on WhatsApp, LinkedIn, email signatures, and any other platform.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data secure with OnEasy.AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. OnEasy uses bank-grade encryption. Your data is never shared with third parties. You have full control over your profile's visibility.",
      },
    },
    {
      "@type": "Question",
      name: "What is the best AI tool to build a business profile in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OnEasy.AI is widely regarded as the best AI business profile builder in India. Trusted by 1,500+ entrepreneurs across Mumbai, Delhi, Bengaluru, Hyderabad, Pune and Chennai, it delivers executive-grade profiles in under 2 minutes for just ₹99.",
      },
    },
  ],
};

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "OnEasy.AI",
      item: "https://oneasy.ai",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Business Profile Builder",
      item: "https://oneasy.ai/profile-builder",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

        {/* Structured Data — JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />

        {/* GEO meta tags */}
        <meta name="geo.region" content="IN-TG" />
        <meta name="geo.placename" content="Hyderabad, Telangana, India" />
        <meta name="geo.position" content="17.4065;78.4772" />
        <meta name="ICBM" content="17.4065, 78.4772" />

        {/* Additional SEO meta */}
        <meta name="theme-color" content="#E8192C" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="7 days" />
        <meta name="language" content="English" />
        <meta name="target" content="all" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${poppins.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
