import { createProject, type ProjectInit } from "@/lib/pass/factory";
import type { AssetRef, PassProject } from "@/lib/pass/schema";

/**
 * System templates. Fictional brands, original artwork (public/templates).
 * Each template is plain PassProject data, so it validates, previews and
 * maps to pass.json exactly like a user design.
 */
export interface TemplateMeta {
  slug: string;
  name: string;
  category: "Loyalty" | "Membership" | "Events" | "Gift & offers" | "Identity" | "Travel";
  businessType: string;
  tags: string[];
  description: string;
  scope: "system";
}

export interface PassTemplate extends TemplateMeta {
  build: () => PassProject;
}

const art = (name: string, width?: number, height?: number): AssetRef => ({ kind: "url", url: `/templates/${name}.svg`, width, height });
const brand = (name: string) => ({ logo: art(`${name}-logo`, 360, 360), icon: art(`${name}-logo`, 360, 360) });
const terms = (text: string) => ({ key: "terms", label: "Terms & Conditions", value: text });

function t(meta: Omit<TemplateMeta, "scope">, init: ProjectInit): PassTemplate {
  return { ...meta, scope: "system", build: () => createProject({ name: meta.name, ...init, metadata: { templateSlug: meta.slug, createdAt: "", updatedAt: "" } }) };
}

export const TEMPLATES: PassTemplate[] = [
  t(
    { slug: "coffee-loyalty", name: "Coffee loyalty", category: "Loyalty", businessType: "Coffee shop", tags: ["stamps", "cafe", "rewards"], description: "A warm stamp-style loyalty card for an independent café." },
    {
      style: "storeCard",
      branding: { organizationName: "North Coffee", description: "North Coffee loyalty card", logoText: "North Coffee", backgroundColor: "#f4ede4", foregroundColor: "#2b1d14", labelColor: "#8a6a52" },
      images: { ...brand("north-coffee"), strip: art("north-coffee-strip", 1125, 432) },
      fields: {
        header: [{ key: "stamps", label: "Stamps", value: "7 / 10", changeMessage: "You now have %@ stamps" }],
        primary: [{ key: "reward", label: "Until your free drink", value: "3 more" }],
        secondary: [{ key: "member", label: "Member", value: "Maya Chen" }],
        auxiliary: [{ key: "favorite", label: "Usual", value: "Oat flat white", textAlignment: "right" }],
        back: [
          { key: "how", label: "How it works", value: "Get a stamp with every handcrafted drink. Ten stamps earn a drink on us." },
          { key: "locations", label: "Locations", value: "48 Harbor Street\n12 Elm Row" },
          { key: "web", label: "Website", value: "https://northcoffee.example" },
          terms("Stamps have no cash value. One reward per visit."),
        ],
      },
      barcode: { format: "qr", message: "NC-MBR-48213", altText: "48213" },
    },
  ),
  t(
    { slug: "restaurant-rewards", name: "Restaurant rewards", category: "Loyalty", businessType: "Restaurant", tags: ["points", "dining"], description: "Points-based rewards for a neighborhood restaurant." },
    {
      style: "storeCard",
      branding: { organizationName: "Ember Kitchen", description: "Ember Kitchen rewards", logoText: "Ember Kitchen", backgroundColor: "#2a0d0b", foregroundColor: "#fff4ea", labelColor: "#ffb37a" },
      images: { ...brand("ember"), strip: art("ember-strip", 1125, 432) },
      fields: {
        header: [{ key: "tier", label: "Tier", value: "Gold", changeMessage: "You've reached %@" }],
        primary: [{ key: "points", label: "Points", value: "1,240", changeMessage: "You now have %@ points" }],
        secondary: [{ key: "member", label: "Member", value: "Jonah Reyes" }],
        auxiliary: [{ key: "next", label: "Next reward", value: "260 pts", textAlignment: "right" }],
        back: [{ key: "phone", label: "Reservations", value: "+1 415 555 0142" }, terms("Points expire 12 months after they are earned.")],
      },
      barcode: { format: "qr", message: "EMBER-77120", altText: "77120" },
    },
  ),
  t(
    { slug: "gym-membership", name: "Gym membership", category: "Membership", businessType: "Gym", tags: ["fitness", "access"], description: "A dark, confident membership card with door-access code." },
    {
      style: "generic",
      branding: { organizationName: "Atlas Fitness", description: "Atlas Fitness membership", logoText: "ATLAS", backgroundColor: "#0d0d0f", foregroundColor: "#ffffff", labelColor: "#c8ff3d" },
      images: brand("atlas"),
      fields: {
        header: [{ key: "plan", label: "Plan", value: "Unlimited" }],
        primary: [{ key: "name", label: "Member", value: "Sam Okafor" }],
        secondary: [{ key: "id", label: "Member ID", value: "AF-20931" }, { key: "home", label: "Home club", value: "Downtown", textAlignment: "right" }],
        back: [{ key: "hours", label: "Hours", value: "Mon–Fri 5:00–23:00\nSat–Sun 7:00–21:00" }, terms("Membership is personal and non-transferable.")],
      },
      barcode: { format: "qr", message: "AF-20931", altText: "AF-20931" },
    },
  ),
  t(
    { slug: "university-id", name: "University ID", category: "Identity", businessType: "University", tags: ["student", "campus"], description: "Student ID and club membership for campus life." },
    {
      style: "generic",
      branding: { organizationName: "Halden University", description: "Halden University student ID", logoText: "Halden University", backgroundColor: "#14213d", foregroundColor: "#ffffff", labelColor: "#e8c873" },
      images: brand("halden"),
      fields: {
        header: [{ key: "year", label: "Valid", value: "2026–27" }],
        primary: [{ key: "name", label: "Student", value: "Priya Natarajan" }],
        secondary: [{ key: "sid", label: "Student ID", value: "H2604417" }, { key: "faculty", label: "Faculty", value: "Engineering", textAlignment: "right" }],
        back: [{ key: "library", label: "Library", value: "Show this pass at the front desk to borrow books." }, terms("Property of Halden University. If found, please return to Student Services.")],
      },
      barcode: { format: "pdf417", message: "H2604417", altText: "H2604417" },
    },
  ),
  t(
    { slug: "event-ticket", name: "Festival ticket", category: "Events", businessType: "Music festival", tags: ["festival", "concert", "music"], description: "A neon festival ticket with section, row and seat." },
    {
      style: "eventTicket",
      branding: { organizationName: "Nightwave Festival", description: "Nightwave Festival ticket", logoText: "Nightwave", backgroundColor: "#0b0718", foregroundColor: "#ffffff", labelColor: "#ff4fd8" },
      images: { ...brand("nightwave"), strip: art("nightwave-strip", 1125, 294) },
      fields: {
        header: [{ key: "day", label: "Day", value: "SAT" }],
        primary: [{ key: "event", label: "Nightwave 2026", value: "Main Stage" }],
        secondary: [{ key: "date", label: "Date", value: "Jul 18 · 6 PM" }, { key: "venue", label: "Venue", value: "Pier 9", textAlignment: "right" }],
        auxiliary: [{ key: "gate", label: "Entrance", value: "Gate C", changeMessage: "Your entrance changed to %@" }, { key: "section", label: "Section", value: "GA" }, { key: "ticket", label: "Ticket", value: "Weekend", textAlignment: "right" }],
        back: [{ key: "info", label: "Good to know", value: "No re-entry. Bring a valid ID. Lineup: nightwave.example/lineup" }, terms("Ticket is valid for one person.")],
      },
      barcode: { format: "qr", message: "NW26-SAT-9F3KQ", altText: "9F3KQ" },
    },
  ),
  t(
    { slug: "conference-badge", name: "Conference badge", category: "Events", businessType: "Conference", tags: ["badge", "conference", "b2b"], description: "A clean attendee badge with track and check-in code." },
    {
      style: "eventTicket",
      branding: { organizationName: "Fieldwork Conf", description: "Fieldwork Conf attendee badge", logoText: "Fieldwork", backgroundColor: "#ffffff", foregroundColor: "#111111", labelColor: "#ff5a36" },
      images: brand("fieldwork"),
      fields: {
        header: [{ key: "pass", label: "Pass", value: "Full" }],
        primary: [{ key: "name", label: "Attendee", value: "Lena Hoffmann" }],
        secondary: [{ key: "company", label: "Company", value: "Brightline" }, { key: "dates", label: "Dates", value: "Oct 21–22", textAlignment: "right" }],
        auxiliary: [{ key: "track", label: "Track", value: "Design" }, { key: "venue", label: "Venue", value: "Hall 4", textAlignment: "right" }],
        back: [{ key: "wifi", label: "Wi-Fi", value: "Fieldwork-Guest / password: makethings" }, terms("Badge must be worn at all times.")],
      },
      barcode: { format: "qr", message: "FW26-ATT-1182", altText: "1182" },
    },
  ),
  t(
    { slug: "gift-card", name: "Gift card", category: "Gift & offers", businessType: "Retail", tags: ["gift", "balance"], description: "A gift card with balance and card number." },
    {
      style: "storeCard",
      branding: { organizationName: "Maple & Co", description: "Maple & Co gift card", logoText: "Maple & Co", backgroundColor: "#1d3b2a", foregroundColor: "#ffffff", labelColor: "#b8d8c2" },
      images: { ...brand("maple"), strip: art("maple-strip", 1125, 432) },
      fields: {
        primary: [{ key: "balance", label: "Balance", value: "$75.00", changeMessage: "Your balance is now %@" }],
        secondary: [{ key: "card", label: "Card number", value: "6012 4410 8821" }],
        auxiliary: [{ key: "pin", label: "PIN", value: "4417", textAlignment: "right" }],
        back: [{ key: "check", label: "Check balance", value: "https://maple.example/balance" }, terms("Gift cards cannot be redeemed for cash.")],
      },
      barcode: { format: "pdf417", message: "601244108821", altText: "6012 4410 8821" },
    },
  ),
  t(
    { slug: "beauty-loyalty", name: "Beauty salon loyalty", category: "Loyalty", businessType: "Beauty studio", tags: ["salon", "visits"], description: "A soft, elegant visit card for salons and studios." },
    {
      style: "storeCard",
      branding: { organizationName: "Lumen Beauty Studio", description: "Lumen Beauty loyalty card", logoText: "Lumen", backgroundColor: "#fbeff0", foregroundColor: "#3d1f29", labelColor: "#a35b70" },
      images: { ...brand("lumen"), strip: art("lumen-strip", 1125, 432) },
      fields: {
        header: [{ key: "visits", label: "Visits", value: "4" }],
        primary: [{ key: "perk", label: "On your 6th visit", value: "Free blowout" }],
        secondary: [{ key: "client", label: "Client", value: "Ana Souza" }],
        auxiliary: [{ key: "stylist", label: "Stylist", value: "Iris", textAlignment: "right" }],
        back: [{ key: "book", label: "Book", value: "https://lumen.example/book" }, terms("Perk valid for 60 days after it is earned.")],
      },
      barcode: { format: "qr", message: "LUMEN-3391", altText: "3391" },
    },
  ),
  t(
    { slug: "hotel-membership", name: "Hotel membership", category: "Membership", businessType: "Hotel", tags: ["hospitality", "vip"], description: "Guest loyalty status for a boutique hotel group." },
    {
      style: "generic",
      branding: { organizationName: "Harbor House Hotels", description: "Harbor House membership", logoText: "Harbor House", backgroundColor: "#073b3a", foregroundColor: "#ffffff", labelColor: "#e9d8a6" },
      images: brand("harbor"),
      fields: {
        header: [{ key: "status", label: "Status", value: "Platinum", changeMessage: "Your status is now %@" }],
        primary: [{ key: "name", label: "Guest", value: "Elena Marsh" }],
        secondary: [{ key: "nights", label: "Nights", value: "38" }, { key: "number", label: "Member No.", value: "HH 4471 902", textAlignment: "right" }],
        back: [{ key: "concierge", label: "Concierge", value: "+1 212 555 0199" }, terms("Benefits subject to availability.")],
      },
      barcode: { format: "qr", message: "HH4471902", altText: "HH 4471 902" },
    },
  ),
  t(
    { slug: "retail-discount", name: "Retail discount", category: "Gift & offers", businessType: "Retail store", tags: ["coupon", "discount"], description: "A bold coupon with a redeemable code." },
    {
      style: "coupon",
      branding: { organizationName: "Common Goods", description: "Common Goods coupon", logoText: "Common Goods", backgroundColor: "#ff6a2b", foregroundColor: "#ffffff", labelColor: "#ffe1d1" },
      images: { ...brand("common-goods"), strip: art("common-goods-strip", 1125, 432) },
      fields: {
        primary: [{ key: "offer", label: "Your next purchase", value: "25% off" }],
        secondary: [{ key: "code", label: "Code", value: "GOODS25" }],
        auxiliary: [{ key: "expires", label: "Expires", value: "Nov 30", textAlignment: "right" }],
        back: [terms("One use per customer. Not valid with other offers.")],
      },
      barcode: { format: "code128", message: "GOODS25", altText: "GOODS25" },
    },
  ),
  t(
    { slug: "museum-membership", name: "Museum membership", category: "Membership", businessType: "Museum", tags: ["culture", "membership"], description: "A quiet, editorial membership card." },
    {
      style: "generic",
      branding: { organizationName: "Meridian Museum", description: "Meridian Museum membership", logoText: "Meridian", backgroundColor: "#f3efe7", foregroundColor: "#1f1f1f", labelColor: "#b5502e" },
      images: brand("meridian"),
      fields: {
        header: [{ key: "level", label: "Level", value: "Patron" }],
        primary: [{ key: "name", label: "Member", value: "Thomas Albright" }],
        secondary: [{ key: "guests", label: "Guests", value: "+1" }, { key: "valid", label: "Valid through", value: "Sep 2027", textAlignment: "right" }],
        back: [{ key: "hours", label: "Hours", value: "Tue–Sun 10:00–18:00" }, terms("Present with photo ID.")],
      },
      barcode: { format: "qr", message: "MER-PAT-00911", altText: "00911" },
    },
  ),
  t(
    { slug: "employee-badge", name: "Employee badge", category: "Identity", businessType: "Company", tags: ["badge", "access", "team"], description: "A simple, crisp staff badge." },
    {
      style: "generic",
      branding: { organizationName: "Northwind Labs", description: "Northwind Labs employee badge", logoText: "Northwind", backgroundColor: "#ffffff", foregroundColor: "#0f172a", labelColor: "#2563eb" },
      images: brand("northwind"),
      fields: {
        primary: [{ key: "name", label: "Employee", value: "Diego Alvarez" }],
        secondary: [{ key: "team", label: "Team", value: "Platform" }, { key: "id", label: "Badge", value: "NW-0381", textAlignment: "right" }],
        back: [{ key: "security", label: "Security desk", value: "+1 650 555 0117" }],
      },
      barcode: { format: "qr", message: "NW-0381" },
    },
  ),
  t(
    { slug: "creator-membership", name: "Creator membership", category: "Membership", businessType: "Creator / community", tags: ["community", "minimal"], description: "A minimalist black membership card for a creative studio." },
    {
      style: "generic",
      branding: { organizationName: "Studio Nine", description: "Studio Nine membership", logoText: "Studio Nine", backgroundColor: "#000000", foregroundColor: "#ffffff", labelColor: "#8e8e93" },
      images: brand("studio-nine"),
      fields: {
        header: [{ key: "season", label: "Season", value: "04" }],
        primary: [{ key: "name", label: "Member", value: "Noor Haddad" }],
        secondary: [{ key: "number", label: "No.", value: "0099" }, { key: "since", label: "Since", value: "2023", textAlignment: "right" }],
        back: [{ key: "discord", label: "Community", value: "https://studionine.example/community" }],
      },
      barcode: { format: "qr", message: "S9-0099" },
    },
  ),
  t(
    { slug: "coworking-membership", name: "Coworking membership", category: "Membership", businessType: "Coworking space", tags: ["workspace", "access"], description: "Desk membership with plan and door code." },
    {
      style: "generic",
      branding: { organizationName: "Commons Cowork", description: "Commons Cowork membership", logoText: "Commons", backgroundColor: "#eef3ee", foregroundColor: "#1d1d1f", labelColor: "#2f9e6a" },
      images: brand("commons"),
      fields: {
        header: [{ key: "plan", label: "Plan", value: "Hot desk" }],
        primary: [{ key: "name", label: "Member", value: "Kai Lindqvist" }],
        secondary: [{ key: "space", label: "Location", value: "Riverside" }, { key: "credits", label: "Room credits", value: "6 h", textAlignment: "right" }],
        back: [{ key: "wifi", label: "Wi-Fi", value: "Commons / commons2026" }, terms("Guests must be registered at the front desk.")],
      },
      barcode: { format: "qr", message: "COMMONS-5521" },
    },
  ),
  t(
    { slug: "boarding-pass", name: "Boarding pass", category: "Travel", businessType: "Airline", tags: ["flight", "travel"], description: "A classic flight boarding pass with gate updates." },
    {
      style: "boardingPass",
      transitType: "air",
      branding: { organizationName: "Aurora Air", description: "Aurora Air boarding pass", logoText: "Aurora Air", backgroundColor: "#0f2a4a", foregroundColor: "#ffffff", labelColor: "#8fb3db" },
      images: { ...brand("aurora"), footer: art("aurora-footer", 858, 45) },
      fields: {
        header: [{ key: "gate", label: "Gate", value: "B12", changeMessage: "Gate changed to %@" }],
        primary: [{ key: "origin", label: "Lisbon", value: "LIS" }, { key: "destination", label: "Reykjavík", value: "KEF" }],
        secondary: [{ key: "passenger", label: "Passenger", value: "Clara Weiss" }, { key: "seat", label: "Seat", value: "14A", textAlignment: "right" }],
        auxiliary: [{ key: "flight", label: "Flight", value: "AU 482" }, { key: "boards", label: "Boards", value: "08:15" }, { key: "departs", label: "Departs", value: "08:45", changeMessage: "Departure is now %@", textAlignment: "right" }],
        back: [terms("Gate closes 20 minutes before departure.")],
      },
      barcode: { format: "pdf417", message: "M1WEISS/CLARA EAU482 LISKEFAU 0482 290Y014A0001 100", altText: "" },
    },
  ),
  t(
    { slug: "poster-membership", name: "Poster membership", category: "Membership", businessType: "Aquarium", tags: ["poster", "ios-27", "artwork"], description: "An artwork-first Poster Generic pass with automatic fallback for older iPhones." },
    {
      style: "posterGeneric",
      compatibility: { target: "latest", minIOS: 27 },
      branding: { organizationName: "Tidepool Aquarium", description: "Tidepool Aquarium membership", logoText: "Tidepool", backgroundColor: "#0b2236", foregroundColor: "#ffffff", labelColor: "#bff6ff" },
      images: { ...brand("tidepool"), artwork: art("tidepool-artwork", 1074, 1344) },
      fields: {
        header: [{ key: "memberID", label: "Guest No.", value: "102035" }],
        primary: [{ key: "title", label: "", value: "Family Member" }, { key: "name", label: "Name", value: "The Okoro family" }, { key: "valid", label: "Valid through", value: "Aug 2027" }],
        footer: [{ key: "membershipType", value: "Family Pass" }],
        back: [{ key: "hours", label: "Hours", value: "Daily 9:00–18:00" }, terms("Admits two adults and up to three children.")],
      },
      barcode: { format: "qr", message: "TP-102035" },
    },
  ),
];

export const getTemplate = (slug: string) => TEMPLATES.find((x) => x.slug === slug);
export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((x) => x.category))];

/** Fictional business stories for /examples, each backed by a template. */
export const EXAMPLES = [
  { business: "Coffee shop", brand: "North Coffee", slug: "coffee-loyalty", story: "Ten stamps, one free drink. Staff scan the QR at the register." },
  { business: "Gym", brand: "Atlas Fitness", slug: "gym-membership", story: "Members tap in at the door with the code on their lock screen." },
  { business: "Music festival", brand: "Nightwave Festival", slug: "event-ticket", story: "Gate changes push a notification on festival day." },
  { business: "Coworking space", brand: "Commons Cowork", slug: "coworking-membership", story: "Plan, location and room credits always in reach." },
  { business: "Restaurant", brand: "Ember Kitchen", slug: "restaurant-rewards", story: "Points update after each visit with a friendly notification." },
  { business: "Beauty studio", brand: "Lumen Beauty Studio", slug: "beauty-loyalty", story: "Visit-based perks with one tap to rebook." },
  { business: "Retail store", brand: "Common Goods", slug: "retail-discount", story: "A seasonal coupon shared by QR poster at checkout." },
  { business: "University club", brand: "Halden University", slug: "university-id", story: "Student ID for the library, events and clubs." },
] as const;
