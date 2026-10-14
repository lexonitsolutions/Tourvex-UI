// Building blocks shared by the four catalog field configs. A field is { name, type, label, help?, required?, maxLength?, min?, max?, ... }.
// Built-in types come from the content editor (text, textarea, number, select, toggle, list, group); the catalog adds money, chips,
// strings, dates, datetime, gallery and imageUrl (registered in _components/customFields.js). Limits mirror the API create DTOs.

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const IMAGE_URL_PATTERN = /^(\/[^\s]*|https:\/\/[^\s]+)$/;

export const text = (name, label, o = {}) => ({ name, type: "text", label, ...o });
export const textarea = (name, label, o = {}) => ({ name, type: "textarea", label, rows: 4, ...o });
export const number = (name, label, o = {}) => ({ name, type: "number", label, ...o });
export const select = (name, label, options, o = {}) => ({ name, type: "select", label, options: options.map((v) => (typeof v === "string" ? { value: v, label: v } : v)), ...o });
export const toggle = (name, label, o = {}) => ({ name, type: "toggle", label, ...o });
export const money = (name, label, o = {}) => ({ name, type: "money", label, nullable: true, ...o });
export const chips = (name, label, o = {}) => ({ name, type: "chips", label, ...o });
export const strings = (name, label, o = {}) => ({ name, type: "strings", label, ...o });
export const list = (name, label, fields, o = {}) => ({ name, type: "list", label, fields, ...o });
export const group = (name, label, fields, o = {}) => ({ name, type: "group", label, fields, ...o });

export const slugField = () =>
  text("slug", "URL slug", {
    maxLength: 80,
    pattern: SLUG_PATTERN,
    patternMessage: "Use lowercase letters, numbers and single hyphens.",
    omitEmpty: true,
    help: "Part of the public address. Leave empty on a new item to generate it from the title. Changing it later breaks existing links.",
  });

export const summaryField = () => textarea("summary", "Summary", { maxLength: 600, rows: 3, help: "One or two sentences shown on cards and in search results." });
export const descriptionField = () => textarea("description", "Description", { maxLength: 10000, rows: 9, help: "Plain text. Separate paragraphs with a blank line." });

/** Gallery of { url, alt } (holidays: required, the first image is the cover; others: optional extras). */
export const galleryField = (o = {}) => ({ name: "images", type: "gallery", label: "Gallery", ...o });
export const coverImageField = () => ({ name: "coverImage", type: "imageUrl", label: "Cover image", required: true, maxLength: 500, help: "Shown on cards and at the top of the page." });

export const publishingSection = ({ cart = false } = {}) => ({
  id: "publishing",
  label: "Publishing",
  description: "Control whether this item is live on the public website.",
  fields: [
    toggle("published", "Published", { help: "Unpublished items are hidden from the website but stay here, so you can finish them first." }),
    ...(cart ? [toggle("allowAddToCart", "Allow Add to Cart", { help: "When enabled, customers can add this package to the shared cart. New and existing packages remain off until you enable them." })] : []),
    toggle("isSample", "Sample / demo content", { help: "Marks placeholder data. Sample items are hidden on the live site in production." }),
    number("popularity", "Popularity", { step: "any", optional: true, help: "Used when the site sorts by popular: higher numbers come first. Leave empty for 0." }),
  ],
});
