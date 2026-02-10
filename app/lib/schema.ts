import { z } from 'zod';

export const BrandSchema = z.object({
  name: z.string().optional(),
  logo: z.string().optional(),
  role: z.string().optional(),
  duration: z.string().optional(),
});

export const GrowthMetricSchema = z.object({
  label: z.string().optional(),
  value: z.string().optional(),
});

export const ProfileSchema = z.object({
  // Section 1A: Basic Information
  fullName: z.string().min(1, "Full name is required"),
  tagline: z.string().optional(),
  aboutMe: z.string().max(3000).optional(),
  profilePhoto: z.string().optional(),
  topHighlights: z.array(z.string()).max(3).optional(),

  // Section 1B: Personal Story & Strengths
  personalStory30: z.string().max(200).optional(),
  storyType: z.enum(["Rise", "Pivot", "Impact", "Mission"]).optional(),
  professionalTitle: z.string().optional(),
  expertiseAreas: z.array(z.string()).max(5).optional(),
  certifications: z.array(z.string()).optional(),
  technicalSkills: z.array(z.string()).optional(),
  achievements: z.array(z.string()).max(5).optional(),

  // Section 2: Social Media
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
    facebook: z.string().url().optional().or(z.literal("")),
    youtube: z.string().url().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
    companyWebsite: z.string().url().optional().or(z.literal("")),
    calendly: z.string().url().optional().or(z.literal("")),
    podcast: z.string().url().optional().or(z.literal("")),
    newsletter: z.string().url().optional().or(z.literal("")),
  }).optional(),

  // Section 3: Brands & Work Experience
  workExperienceType: z.enum(["Multiple", "Single"]).default("Multiple"),
  brands: z.array(BrandSchema).optional(),
  positions: z.array(z.object({
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    duration: z.string().optional(),
    description: z.string().optional(),
    logo: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    schoolName: z.string(),
    degreeName: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    duration: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
  focusBrand: z.object({
    name: z.string().optional(),
    logo: z.string().optional(),
    story: z.string().optional(),
    role: z.string().optional(),
    growthMetrics: z.array(GrowthMetricSchema).optional(),
    teamSize: z.string().optional(),
    clientsServed: z.string().optional(),
  }).optional(),

  // Section 4: Impact Created
  professionType: z.string().optional(),
  impactHeadline: z.string().max(50).optional(),
  impactStory: z.string().max(1000).optional(),
  professionSpecificImpact: z.record(z.string(), z.any()).optional(),

  // Section 5: Awards & Recognition
  awards: z.array(z.object({
    title: z.string().optional(),
    organization: z.string().optional(),
    year: z.string().optional(),
    image: z.string().optional(),
  })).optional(),
  mediaFeatures: z.array(z.object({
    name: z.string().optional(),
    url: z.string().url().optional().or(z.literal("")),
  })).optional(),

  // Section 6: Contact Details
  contact: z.object({
    emailPrimary: z.string().email().optional().or(z.literal("")),
    emailShow: z.boolean().default(true),
    phonePrimary: z.string().optional(),
    phoneShow: z.boolean().default(true),
    whatsappNumber: z.string().optional(),
    whatsappShow: z.boolean().default(true),
    officeAddress: z.string().optional(),
    addressShow: z.boolean().default(true),
    preferredContact: z.string().optional(),
  }).optional(),
});

export type ProfileData = z.infer<typeof ProfileSchema>;
