import { chips, descriptionField, galleryField, list, money, number, publishingSection, slugField, strings, summaryField, text, textarea } from "./shared";

const holidays = {
  type: "holidays",
  singular: "holiday package",
  plural: "Holiday packages",
  description: "Packages shown under Holidays on the website.",
  publicPath: "/holidays",
  sections: [
    {
      id: "basics",
      label: "Basics",
      description: "What the package is called and where it goes.",
      fields: [
        text("title", "Title", { required: true, maxLength: 200 }),
        slugField(),
        summaryField(),
        descriptionField(),
        text("country", "Country", { required: true, maxLength: 100 }),
        chips("destinations", "Destinations", { required: true, min: 1, max: 10, help: "Cities or places covered. Press Enter to add each one." }),
        number("durationNights", "Nights", { required: true, integer: true, min: 0, max: 60 }),
        number("durationDays", "Days", { optional: true, integer: true, min: 1, max: 61, help: "Leave empty to use nights + 1." }),
        chips("themes", "Themes", { max: 12, help: "For example Family, Beach, Luxury." }),
        chips("collections", "Collections", { max: 20, help: "Collection slugs this package belongs to." }),
      ],
    },
    {
      id: "pricing",
      label: "Pricing",
      description: "Prices are per person. Leave a price empty to show the package without one.",
      fields: [
        money("price", "Price", { help: "Regular price per person." }),
        money("salePrice", "Sale price", { help: "Shown as the current price when set; the regular price is struck through." }),
        {
          name: "rating",
          type: "group",
          label: "Rating",
          optionalGroup: true,
          fields: [
            number("average", "Average (0 to 5)", { step: "any", min: 0, max: 5 }),
            number("count", "Number of reviews", { integer: true, min: 0 }),
          ],
        },
      ],
    },
    {
      id: "itinerary",
      label: "Itinerary & highlights",
      description: "Day by day plan, highlights, and what is and is not included.",
      fields: [
        list(
          "itinerary",
          "Itinerary",
          [
            text("title", "Title", { required: true, maxLength: 200 }),
            textarea("description", "Description", { required: true, maxLength: 2000, rows: 4 }),
            strings("bulletPoints", "Bullet points", {
              max: 12,
              itemMax: 300,
              help: "Add the key activities or moments for this day. These appear in the itinerary details popup.",
            }),
          ],
          { itemLabel: "Day", max: 62, autoNumber: "day", help: "Days are numbered by their position. Drag or use the arrows to reorder." }
        ),
        strings("highlights", "Highlights", { max: 20 }),
        strings("inclusions", "Inclusions", { max: 30 }),
        strings("exclusions", "Exclusions", { max: 30 }),
      ],
    },
    {
      id: "gallery",
      label: "Gallery",
      description: "Photos of the package.",
      fields: [galleryField({ required: true, min: 1, max: 20, help: "The first image is the cover. At least one image is required." })],
    },
    publishingSection(),
  ],
  columns: [
    { key: "destinations", label: "Destinations", value: (r) => [...(r.destinations || [])].slice(0, 3).join(", ") || r.country },
    { key: "durationNights", label: "Duration", sort: ["nights_asc", "nights_desc"], value: (r) => (r.durationNights != null ? `${r.durationNights}N / ${r.durationDays ?? r.durationNights + 1}D` : "") },
    { key: "price", label: "Price", kind: "money", sort: ["price_asc", "price_desc"], value: (r) => r.salePrice || r.price },
  ],
};

export default holidays;
