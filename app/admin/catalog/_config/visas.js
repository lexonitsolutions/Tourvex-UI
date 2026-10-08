import { chips, descriptionField, list, money, publishingSection, select, slugField, strings, summaryField, text, textarea } from "./shared";

const visas = {
  type: "visas",
  singular: "visa",
  plural: "Visas",
  description: "Visa services shown under Visas on the website.",
  publicPath: "/visas",
  sections: [
    {
      id: "basics",
      label: "Basics",
      description: "Which country and what kind of visa.",
      fields: [
        text("title", "Title", { required: true, maxLength: 200 }),
        slugField(),
        text("country", "Country", { required: true, maxLength: 100 }),
        text("countryCode", "Country code", {
          required: true,
          maxLength: 2,
          pattern: /^[a-z]{2}$/,
          patternMessage: "Use two lowercase letters, for example tr.",
          help: "ISO 3166-1 alpha-2, lowercase (for example ae, tr, gb).",
        }),
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
    publishingSection(),
  ],
  columns: [
    { key: "country", label: "Country", value: (r) => r.country, sort: ["name", null] },
    { key: "kind", label: "Type", value: (r) => (r.kind === "evisa" ? "e-Visa" : r.kind === "embassy" ? "Embassy" : r.kind) },
    { key: "processing", label: "Processing", value: (r) => r.processing },
    { key: "startingPrice", label: "Fee", kind: "money", sort: ["price_asc", "price_desc"], value: (r) => r.startingPrice },
  ],
};

export default visas;
