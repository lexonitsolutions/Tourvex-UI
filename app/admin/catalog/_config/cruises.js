import { chips, coverImageField, descriptionField, galleryField, list, money, number, publishingSection, select, slugField, strings, summaryField, text, textarea } from "./shared";

const cruises = {
  type: "cruises",
  singular: "cruise",
  plural: "Cruises",
  description: "Cruise itineraries shown under Cruises on the website.",
  publicPath: "/cruises",
  listFilters: [
    { key: "city", label: "Departure city", facet: "cities", allLabel: "All cities" },
    { key: "line", label: "Cruise line", facet: "lines", allLabel: "All cruise lines" },
    { key: "region", label: "Region", facet: "regions", allLabel: "All regions" },
  ],
  sections: [
    {
      id: "basics",
      label: "Basics",
      description: "The sailing at a glance.",
      fields: [
        text("title", "Title", { required: true, maxLength: 200 }),
        slugField(),
        summaryField(),
        descriptionField(),
        text("cruiseLine", "Cruise line", { required: true, maxLength: 100 }),
        text("shipName", "Ship", { required: true, maxLength: 100 }),
        text("departureCity", "Departure city", { required: true, maxLength: 100 }),
        text("departureCountry", "Departure country", { required: true, maxLength: 100 }),
        text("region", "Region", { required: true, maxLength: 100, help: "For example Mediterranean or Arabian Gulf." }),
        number("durationNights", "Nights", { required: true, integer: true, min: 1, max: 60 }),
        number("durationDays", "Days", { optional: true, integer: true, min: 1, max: 62, help: "Leave empty to use nights + 1. It must match the number of itinerary days." }),
        chips("tags", "Tags", { max: 10, itemMax: 40, help: "For example Family or Luxury." }),
      ],
    },
    {
      id: "itinerary",
      label: "Itinerary",
      description: "One entry per day, starting at day 1 with no gaps.",
      fields: [
        list(
          "itinerary",
          "Day by day stops",
          [
            text("port", "Port or location", { required: true, maxLength: 100 }),
            text("country", "Country", { maxLength: 100 }),
            select(
              "type",
              "Stop type",
              [
                { value: "embark", label: "Embark" },
                { value: "port", label: "Port of call" },
                { value: "sea", label: "At sea" },
                { value: "disembark", label: "Disembark" },
              ],
              { required: true }
            ),
            textarea("description", "Description", { required: true, maxLength: 600, rows: 3 }),
          ],
          { itemLabel: "Day", min: 2, max: 62, autoNumber: "day", lengthMatches: "durationDays", help: "At least two days. Days are numbered by their position." }
        ),
      ],
    },
    {
      id: "departures",
      label: "Departures & cabins",
      description: "When it sails and what cabins are offered.",
      fields: [
        { name: "departures", type: "dates", label: "Departure dates", max: 60, noPast: true, help: "Upcoming sailing dates (not in the past). Duplicates are merged and sorted." },
        list(
          "cabins",
          "Cabin categories",
          [
            text("type", "Cabin type", { required: true, maxLength: 80 }),
            textarea("description", "Description", { required: true, maxLength: 400, rows: 3 }),
            money("fromPrice", "From price (per person)", { help: "Indicative fare. Leave empty for none." }),
          ],
          { itemLabel: "Cabin", minIfAny: 2, max: 4, help: "Leave empty, or add 2 to 4 cabin categories." }
        ),
        money("price", "Fallback price", { help: "Used for the card price when no cabin has a price." }),
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
    { key: "cruiseLine", label: "Cruise line / ship", value: (r) => [r.cruiseLine, r.shipName].filter(Boolean).join(" - ") },
    { key: "departureCity", label: "Departs from", value: (r) => [r.departureCity, r.departureCountry].filter(Boolean).join(", ") },
    { key: "durationNights", label: "Nights", sort: ["nights_asc", "nights_desc"], value: (r) => (r.durationNights != null ? `${r.durationNights}N` : "") },
    { key: "nextDepartures", label: "Next sailing", kind: "date", sort: ["soonest", null], value: (r) => (Array.isArray(r.nextDepartures) ? r.nextDepartures[0] : null) },
    { key: "price", label: "From", kind: "money", sort: ["price_asc", "price_desc"], value: (r) => r.price },
  ],
};

export default cruises;
