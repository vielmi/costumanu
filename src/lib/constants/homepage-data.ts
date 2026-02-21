import type { LucideIcon } from "lucide-react";
import {
  User,
  Users,
  Baby,
  Dog,
  Sparkles,
  PersonStanding,
} from "lucide-react";

// ─── Gender Categories ──────────────────────────────────────────────

export type GenderCategory = {
  label: string;
  icon: LucideIcon;
  count: number;
};

export const genderCategories: GenderCategory[] = [
  { label: "Damen", icon: User, count: 4520 },
  { label: "Herren", icon: PersonStanding, count: 3870 },
  { label: "Unisex", icon: Users, count: 1240 },
  { label: "Kinder", icon: Baby, count: 860 },
  { label: "Tier", icon: Dog, count: 310 },
  { label: "Fantasy", icon: Sparkles, count: 580 },
];

// ─── Clothing Types ─────────────────────────────────────────────────

export type ClothingType = {
  label: string;
  tags: string[];
  image: string;
};

export const clothingTypes: ClothingType[] = [
  {
    label: "Kleider",
    tags: ["Abendkleid", "Cocktailkleid", "Ballkleid"],
    image: "/images/kleider.jpg",
  },
  {
    label: "Anzug",
    tags: ["Smoking", "Dreiteiler", "Frack"],
    image: "/images/anzug.jpg",
  },
];

// ─── Epochs ─────────────────────────────────────────────────────────

export type EpochCard = {
  label: string;
  image: string;
  period: string;
};

export const epochs: EpochCard[] = [
  { label: "Antike", image: "/images/antike.jpg", period: "3000 v.Chr. – 500 n.Chr." },
  { label: "Mittelalter", image: "/images/mittelalter.jpg", period: "500 – 1500" },
  { label: "Renaissance", image: "/images/renaissance.jpg", period: "1400 – 1600" },
  { label: "Barock", image: "/images/barock.jpg", period: "1600 – 1750" },
  { label: "Rokoko", image: "/images/rokoko.jpg", period: "1720 – 1780" },
  { label: "Biedermeier", image: "/images/biedermeier.jpg", period: "1815 – 1848" },
  { label: "Gründerzeit", image: "/images/gruenderzeit.jpg", period: "1870 – 1914" },
  { label: "20er Jahre", image: "/images/20er.jpg", period: "1920 – 1929" },
];

// ─── Sparten ────────────────────────────────────────────────────────

export type SparteCard = {
  label: string;
  image: string;
};

export const sparten: SparteCard[] = [
  { label: "Theater", image: "/images/theater.jpg" },
  { label: "Film", image: "/images/film.jpg" },
  { label: "Oper", image: "/images/oper.jpg" },
  { label: "Musical", image: "/images/musical.jpg" },
  { label: "Tanz", image: "/images/tanz.jpg" },
  { label: "Karneval", image: "/images/karneval.jpg" },
];

// ─── Work Uniforms ──────────────────────────────────────────────────

export type UniformCard = {
  label: string;
  image: string;
};

export const workUniforms: UniformCard[] = [
  { label: "Militär", image: "/images/militaer.jpg" },
  { label: "Polizei", image: "/images/polizei.jpg" },
  { label: "Feuerwehr", image: "/images/feuerwehr.jpg" },
  { label: "Medizin", image: "/images/medizin.jpg" },
  { label: "Service", image: "/images/service.jpg" },
];

// ─── Featured Event ─────────────────────────────────────────────────

export type FeaturedEvent = {
  title: string;
  subtitle: string;
  date: string;
  location: string;
  description: string;
  image: string;
};

export const featuredEvent: FeaturedEvent = {
  title: "Rampenverkauf",
  subtitle: "Fundus Südpol Luzern",
  date: "15. März 2026",
  location: "Südpol Luzern",
  description:
    "Über 3'000 Kostüme, Accessoires und Requisiten aus dem Fundus des Südpol Luzern zu günstigen Preisen.",
  image: "/images/rampenverkauf.jpg",
};

// ─── Network Partners ───────────────────────────────────────────────

export type NetworkPartner = {
  name: string;
  logo: string;
  url: string;
};

export const networkPartners: NetworkPartner[] = [
  { name: "Schauspielhaus Zürich", logo: "/images/partners/schauspielhaus.png", url: "#" },
  { name: "Theater Basel", logo: "/images/partners/theater-basel.png", url: "#" },
  { name: "Opernhaus Zürich", logo: "/images/partners/opernhaus.png", url: "#" },
  { name: "Konzert Theater Bern", logo: "/images/partners/ktb.png", url: "#" },
  { name: "Luzerner Theater", logo: "/images/partners/luzerner.png", url: "#" },
  { name: "Theater St. Gallen", logo: "/images/partners/stgallen.png", url: "#" },
];

// ─── Footer Links ───────────────────────────────────────────────────

export type FooterLink = {
  label: string;
  href: string;
};

export const footerLinks: FooterLink[] = [
  { label: "Häufige Fragen", href: "/faq" },
  { label: "Ausleihe", href: "/ausleihe" },
  { label: "Support", href: "/support" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Impressum", href: "/impressum" },
];
