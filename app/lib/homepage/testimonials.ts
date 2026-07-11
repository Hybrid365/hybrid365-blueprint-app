/**
 * Homepage testimonials — REPLACE with verified quotes only.
 */

export type HomepageTestimonial = {
  id: string;
  quote: string;
  athleteName: string;
  result: string;
  service: string;
  photoSrc?: string;
  photoAlt?: string;
  placeholder?: boolean;
  placeholderNote?: string;
};

export const HOMEPAGE_TESTIMONIALS: HomepageTestimonial[] = [
  {
    id: "testimonial-placeholder-1",
    quote:
      "[Verified quote — specific outcome, e.g. threshold pace, station confidence, race result.]",
    athleteName: "[Athlete name]",
    result: "[Specific measurable result]",
    service: "Hybrid365 HYROX coaching",
    photoSrc: "/images/community/running.jpg",
    photoAlt: "Athlete testimonial photo",
    placeholder: true,
    placeholderNote: "Replace with verified testimonial #1",
  },
  {
    id: "testimonial-placeholder-2",
    quote:
      "[Verified quote — what changed in training structure, adherence or race performance.]",
    athleteName: "[Athlete name]",
    result: "[Specific measurable result]",
    service: "Free HYROX week → programme",
    placeholder: true,
    placeholderNote: "Replace with verified testimonial #2",
  },
  {
    id: "testimonial-placeholder-3",
    quote:
      "[Verified quote — coach support, programming clarity, or progression over a block.]",
    athleteName: "[Athlete name]",
    result: "[Specific measurable result]",
    service: "Hybrid365 Team",
    placeholder: true,
    placeholderNote: "Replace with verified testimonial #3",
  },
];
