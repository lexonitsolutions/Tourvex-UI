import { chips, descriptionField, galleryField, list, money, number, publishingSection, select, slugField, strings, summaryField, text, textarea, toggle } from "./shared";

const visas = {
  type: "visas",
  singular: "visa",
  plural: "Visas",
  description: "Visa services shown under Visas on the website.",
  publicPath: "/visas",
  listFilters: [
    { key: "kind", label: "Visa type", facet: "kinds", allLabel: "All visa types", labels: { evisa: "e-Visa", embassy: "Embassy" } },
  ],
  sections: [
    {
      id: "basics",
      label: "Basics",
      description: "Which country and what kind of visa.",
      fields: [
        text("title", "Title", { required: true, maxLength: 200 }),
        slugField(),
        text("country", "Country", { required: true, maxLength: 100 }),
        {
          name: "countryCode",
          type: "countryCode",
          label: "Country code",
          required: true,
          maxLength: 2,
          pattern: /^[a-z]{2}$/,
          patternMessage: "Use two lowercase letters, for example tr.",
          help: "ISO 3166-1 alpha-2, lowercase (for example ae, sa, gb). The country flag is fetched automatically.",
        },
        select("kind", "Visa type", [{ value: "evisa", label: "e-Visa" }, { value: "embassy", label: "Embassy" }], { required: true }),
        summaryField(),
        descriptionField(),
        chips("sections", "Website sections", { max: 10, help: "Section slugs this visa is listed under." }),
      ],
    },
    {
      id: "processing",
      label: "Processing & fee",
      description: "How long it takes and what we charge.",
      fields: [
        text("processing", "Processing time", { required: true, maxLength: 80, help: "For example 3-5 working days." }),
        text("validity", "Validity", { required: true, maxLength: 80, help: "For example Up to 30 days." }),
        select("entries", "Entries", [{ value: "single", label: "Single entry" }, { value: "multiple", label: "Multiple entry" }, { value: "varies", label: "Varies" }], { default: "varies" }),
        text("stay", "Length of stay", { maxLength: 120, help: "For example Up to 30 days per visit." }),
        money("startingPrice", "Our service fee", { help: "Our fee, not the government fee. Leave empty for none." }),
        money("adultPrice", "Adult visa price", { help: "Optional. Falls back to the service fee for existing packages." }),
        money("minorPrice", "Minor visa price", { help: "Optional. Falls back to the adult price." }),
        money("serviceCharge", "Service charge", { help: "Optional charge per booking, distributed across travelers during server pricing." }),
        number("minorMaxAge", "Maximum minor age", { min: 0, max: 17, default: 17 }),
        list("processingOptions", "Processing types", [
          text("id", "ID", { required: true, maxLength: 64, help: "Lowercase ID, for example normal or express." }),
          text("name", "Name", { required: true, maxLength: 100 }),
          text("estimatedTime", "Estimated processing time", { required: true, maxLength: 100 }),
          money("fee", "Additional fee"),
          strings("benefits", "Included benefits", { max: 10, itemMax: 200 }),
          toggle("enabled", "Available to customers"),
        ], { itemLabel: "Processing type", max: 10 }),
        chips("eligibleNationalities", "Eligible nationality codes", { max: 300, help: "ISO alpha-2 codes such as IN, AE. Leave empty to allow all." }),
        chips("eligibleResidences", "Eligible residence codes", { max: 300, help: "ISO alpha-2 codes such as IN, AE. Leave empty to allow all." }),
        text("visaExpertWhatsapp", "Visa expert WhatsApp", { maxLength: 30, help: "International number configured for this visa, digits with optional leading +." }),
      ],
    },
    {
      id: "requirements",
      label: "Requirements & steps",
      description: "What travellers need and how to apply.",
      fields: [
        strings("highlights", "Highlights", { max: 20, itemMax: 300 }),
        strings("requirements", "Requirements", { max: 30, itemMax: 400 }),
        strings("documents", "Documents needed", { max: 30, itemMax: 400 }),
        list(
          "steps",
          "Application steps",
          [text("title", "Title", { required: true, maxLength: 200 }), textarea("description", "Description", { required: true, maxLength: 1000, rows: 3 })],
          { itemLabel: "Step", max: 10 }
        ),
        textarea("notes", "Notes / disclaimer", { maxLength: 500, rows: 3, help: "Shown on the page as a short disclaimer." }),
      ],
    },
    {
      id: "faqs",
      label: "FAQs",
      description: "Common questions travellers ask.",
      fields: [
        list(
          "faqs",
          "Questions and answers",
          [text("question", "Question", { required: true, maxLength: 300 }), textarea("answer", "Answer", { required: true, maxLength: 2000, rows: 4 })],
          { itemLabel: "FAQ", max: 20 }
        ),
      ],
    },
    {
      id: "gallery",
      label: "Tourist places gallery",
      description: "Show famous places from this country on the public visa page.",
      fields: [galleryField({ name: "gallery", max: 12, label: "Famous tourist places", help: "Upload images, add descriptive captions in the alt text, and drag to reorder them." })],
    },
    publishingSection({ cart: true }),
  ],
  columns: [
    { key: "country", label: "Country", value: (r) => r.country, sort: ["name", null] },
    { key: "kind", label: "Type", value: (r) => (r.kind === "evisa" ? "e-Visa" : r.kind === "embassy" ? "Embassy" : r.kind) },
    { key: "processing", label: "Processing", value: (r) => r.processing },
    { key: "startingPrice", label: "Fee", kind: "money", sort: ["price_asc", "price_desc"], value: (r) => r.startingPrice },
  ],
};

export default visas;
