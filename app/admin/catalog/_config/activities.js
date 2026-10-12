import { chips, group, list, money, number, select, slugField, strings, text, textarea, toggle } from "./shared";

const activities = {
  type: "activities",
  apiPath: "/catalog/activities",
  updateSuffix: "/details",
  singular: "activity",
  plural: "Activities",
  description: "Create activities manually or enrich activities received from an import.",
  publicPath: "/activities",
  allowCreate: true,
  allowDelete: true,
  allowDuplicate: false,
  allowPublishing: true,
  sections: [
    { id: "basics", label: "Hero & Media", description: "Top banner of the public page: title, URL, categories, destinations, cover image, video, and gallery.", fields: [
      text("title", "Activity title", { required: true, maxLength: 200 }),
      slugField(),
      textarea("summary", "Card summary", { maxLength: 600, rows: 3, help: "Brief teaser shown on cards and search results." }),
      chips("destinations", "Destinations", { required: true, min: 1, max: 10, help: "For example Dubai. Press Enter after each destination." }),
      chips("categories", "Categories", { max: 20, help: "For example Desert Safari or Theme Parks." }),
      { name: "imageUrl", type: "imageUrl", label: "Cover image", required: true, maxLength: 500, help: "Primary banner and thumbnail across cards." },
      { name: "heroVideo", type: "video", label: "Hero video (optional)", help: "Upload or select a video for the large media area. The cover image is used as its poster and fallback." },
      { name: "gallery", type: "gallery", label: "Gallery (optional)", max: 12, help: "Add extra activity images. When empty, the cover image becomes the full-width banner." },
    ] },
    { id: "essentials", label: "Overview & Experience Details", description: "The 'About this experience' section and practical key facts shown right under it on the public page.", fields: [
      textarea("description", "Experience overview", { maxLength: 8000, rows: 10, help: "Write engaging, original copy. Separate paragraphs with a blank line." }),
      text("duration", "Duration", { maxLength: 80, help: "For example: 7 hours, 3 hours, or Full day." }),
      text("operatingHours", "Operating hours", { maxLength: 120, help: "For example: Daily, pickup between 14:00 and 15:30." }),
      strings("languages", "Languages", { max: 20, itemMax: 60, help: "Languages spoken by the tour guides, for example English, Arabic, Hindi." }),
      toggle("instantConfirmation", "Instant confirmation", { help: "Displays 'Instant confirmation' point on the public page." }),
      toggle("mobileVoucher", "Mobile voucher accepted", { help: "Displays 'Mobile voucher accepted' point on the public page." }),
      number("freeCancellationHours", "Free cancellation hours", { integer: true, min: 0, max: 720, help: "Hours before start for free cancellation (e.g. 24)." }),
    ] },
    { id: "highlights-inclusions", label: "Highlights & Inclusions", description: "Prominent cards directly beneath the overview: highlights, what's included, and what's not included.", fields: [
      strings("highlights", "Experience highlights", { max: 30, itemMax: 500, help: "Bullet points for 'Experience highlights' (Best moments)." }),
      strings("inclusions", "What's included", { max: 30, itemMax: 500, help: "Bullet points for 'What\\'s included' (Your booking)." }),
      strings("exclusions", "What's not included", { max: 30, itemMax: 500, help: "Bullet points for 'What\\'s not included' (Please note)." }),
    ] },
    { id: "itinerary", label: "Experience Itinerary", description: "Numbered timeline of stops and moments guests can expect throughout the day.", fields: [
      list("itinerary", "Itinerary", [
        text("title", "Step title", { required: true, maxLength: 180 }),
        text("duration", "Time or duration", { maxLength: 80, help: "For example: 08:00 or 45 minutes." }),
        textarea("description", "Description", { required: true, maxLength: 3000, rows: 5 }),
        { name: "imageUrl", type: "imageUrl", label: "Optional image", maxLength: 500 },
      ], { itemLabel: "Stop", max: 30, help: "Use the arrows to keep the experience in chronological order." }),
    ] },
    { id: "guest-info", label: "Good to Know (Plan Ahead)", description: "Accordions for travellers before they go: what to bring, redemption, instructions, and cancellation terms.", fields: [
      strings("whatToBring", "What to bring", { max: 30, itemMax: 500, help: "Items guests should bring (sunglasses, comfortable shoes, camera, etc.)." }),
      strings("howToRedeem", "How to redeem", { max: 30, itemMax: 500, help: "Instructions on how guests present their booking voucher." }),
      strings("importantInfo", "Important information", { max: 30, itemMax: 800, help: "Health restrictions, dress code, and essential guidance." }),
      strings("cancellationPolicy", "Cancellation policy", { max: 30, itemMax: 800, help: "Detailed cancellation terms." }),
    ] },
    { id: "more-content", label: "FAQs & Extra Sections", description: "Answer common guest questions and add extra experience-specific editorial accordions.", fields: [
      list("faqs", "Frequently asked questions", [
        text("question", "Question", { required: true, maxLength: 300 }),
        textarea("answer", "Answer", { required: true, maxLength: 3000, rows: 5 }),
      ], { itemLabel: "Question", max: 30 }),
      list("contentSections", "Additional sections", [
        text("title", "Section title", { required: true, maxLength: 180 }),
        textarea("body", "Introduction", { maxLength: 5000, rows: 6 }),
        strings("items", "Key points", { max: 30, itemMax: 500 }),
      ], { itemLabel: "Section", max: 20 }),
    ] },
    { id: "location", label: "Location & Map", description: "Meeting point or venue details, address, and GPS coordinates for the interactive OpenStreetMap on the public page.", fields: [
      group("location", "Location details", [
        text("name", "Location / Venue name", { required: true, maxLength: 160, help: "For example: Lahbab Desert Camp, Burj Khalifa Lower Ground, or Dubai Marina." }),
        text("address", "Address / Landmark", { required: true, maxLength: 300, help: "Full address or meeting point description shown on the public page." }),
        number("lat", "Latitude (GPS)", { optional: true, step: "any", min: -90, max: 90, help: "Decimal degrees, for example: 25.0426. Powers the interactive OpenStreetMap pin." }),
        number("lng", "Longitude (GPS)", { optional: true, step: "any", min: -180, max: 180, help: "Decimal degrees, for example: 55.5914." }),
      ], { optionalGroup: true }),
    ] },
    { id: "pricing", label: "Pricing & Booking Options", description: "Configure the sticky booking card and ticket options (transfer types, times, adult/child rates, pax limits, daily capacity).", fields: [
      money("price", "Regular display price", { help: "Original price before discounts (shown with strikethrough)." }),
      money("salePrice", "Sale display price", { help: "Active selling price shown prominently on the booking card." }),
      list("options", "Booking options", [
        text("id", "Option ID", { required: true, maxLength: 80, pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, patternMessage: "Use lowercase letters, numbers and single hyphens." }),
        text("name", "Option name", { required: true, maxLength: 160 }),
        select("transferType", "Transfer type", [{ value: "none", label: "No transfer" }, { value: "sharing", label: "Shared transfer" }, { value: "private", label: "Private transfer" }], { required: true, default: "none" }),
        text("startTime", "Start time", { maxLength: 40, help: "For example 09:00." }),
        text("durationLabel", "Duration label", { maxLength: 60 }),
        money("adultPrice", "Adult price", { required: true }),
        money("childPrice", "Child price"),
        text("childAgeRange", "Child age range", { maxLength: 40 }),
        number("minPax", "Minimum guests", { required: true, integer: true, min: 1, max: 100 }),
        number("maxPax", "Maximum guests", { required: true, integer: true, min: 1, max: 100 }),
        toggle("pickupRequired", "Pickup details required"),
        toggle("refundable", "Refundable"),
        strings("operatingWeekdays", "Operating weekdays", { required: true, min: 1, max: 7, itemMax: 1, help: "Use 0 for Sunday through 6 for Saturday." }),
        strings("blackoutDates", "Blackout dates", { max: 366, itemMax: 10, help: "Use YYYY-MM-DD." }),
        number("dailyCapacity", "Daily capacity", { integer: true, min: 1, max: 100000 }),
        number("cutoffHours", "Booking cutoff hours", { integer: true, min: 0, max: 720 }),
      ], { itemLabel: "Option", max: 10 }),
    ] },
    { id: "publishing", label: "Publishing", description: "Control whether this activity appears on the public website.", fields: [
      toggle("published", "Published", { help: "Keep this off while the activity is still being prepared." }),
      toggle("isSample", "Sample / demo content", { help: "Sample activities are hidden in production unless sample visibility is enabled." }),
    ] },
  ],
  columns: [
    { key: "destinations", label: "Destination", value: (r) => (r.destinations || []).join(", ") },
    { key: "categories", label: "Category", value: (r) => (r.categories || []).join(", ") },
  ],
};

export default activities;
