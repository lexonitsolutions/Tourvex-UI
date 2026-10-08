import { chips, coverImageField, descriptionField, galleryField, list, money, number, publishingSection, select, slugField, strings, summaryField, text, textarea } from "./shared";

export const EVENT_CATEGORIES = ["Concerts", "Sports", "Festivals", "Comedy", "Family", "Theatre", "Exhibitions"];

const events = {
  type: "events",
  singular: "event",
  plural: "Events",
  description: "Shows, sports and attractions listed under Events on the website.",
  publicPath: "/events",
  sections: [
    {
      id: "basics",
      label: "Basics",
      description: "What the event is and where it happens.",
      fields: [
        text("title", "Title", { required: true, maxLength: 200 }),
        slugField(),
        summaryField(),
        descriptionField(),
        select("category", "Category", EVENT_CATEGORIES, { required: true }),
        text("venue", "Venue", { required: true, maxLength: 150 }),
        text("venueAddress", "Venue address", { maxLength: 250 }),
        text("city", "City", { required: true, maxLength: 100 }),
        text("country", "Country", { required: true, maxLength: 100 }),
        number("durationMinutes", "Duration (minutes)", { optional: true, nullable: true, integer: true, min: 1, max: 1440 }),
        text("ageGuidance", "Age guidance", { maxLength: 100, help: "For example All ages or 16+." }),
        chips("tags", "Tags", { max: 10, itemMax: 40, help: "For example Family friendly or Outdoor." }),
      ],
    },
    {
      id: "sessions",
      label: "Sessions",
      description: "Dates and times, entered in Dubai time (GST).",
      fields: [
        list(
          "sessions",
          "Sessions",
          [
            { name: "startsAt", type: "datetime", label: "Starts at", required: true, noPast: true },
            { name: "doorsOpenAt", type: "datetime", label: "Doors open at", help: "Optional." },
          ],
          { itemLabel: "Session", max: 60, help: "Start times cannot be in the past. Leave empty if there are no dates yet." }
        ),
      ],
    },
    {
      id: "tickets",
      label: "Tickets & pricing",
      description: "Two to four ticket types.",
      fields: [
        list(
          "ticketTypes",
          "Ticket types",
          [
            text("type", "Ticket type", { required: true, maxLength: 80 }),
            textarea("description", "Description", { required: true, maxLength: 400, rows: 3 }),
            money("price", "Price per ticket", { help: "Indicative price. Leave empty for none." }),
          ],
          { itemLabel: "Ticket", min: 2, max: 4 }
        ),
        money("price", "Fallback price", { help: "Used for the card price when no ticket type has a price." }),
      ],
    },
    {
      id: "content",
      label: "Highlights & notes",
      description: "Selling points and the small print.",
      fields: [
        strings("highlights", "Highlights", { max: 20, itemMax: 300 }),
        strings("inclusions", "Inclusions", { max: 30, itemMax: 300 }),
        strings("exclusions", "Exclusions", { max: 30, itemMax: 300 }),
        textarea("notes", "Notes / disclaimer", { maxLength: 500, rows: 3, help: "Shown on the page as a short disclaimer." }),
      ],
    },
    {
      id: "images",
      label: "Images",
      description: "Cover photo and gallery.",
      fields: [coverImageField(), galleryField({ max: 12, label: "Extra gallery images" })],
    },
    publishingSection(),
  ],
  columns: [
    { key: "category", label: "Category", value: (r) => r.category },
    { key: "venue", label: "Venue", value: (r) => [r.venue, r.city].filter(Boolean).join(", ") },
    { key: "nextDate", label: "Next session", kind: "datetime", sort: ["soonest", null], value: (r) => r.nextDate },
    { key: "price", label: "From", kind: "money", sort: ["price_asc", "price_desc"], value: (r) => r.price },
  ],
};

export default events;
