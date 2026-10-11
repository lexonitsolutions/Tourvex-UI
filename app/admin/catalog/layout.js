import "../crm.css";
import "../content/content.css"; // the catalog editor reuses the content editor's form, repeater and glass panel styles
import "./catalog.css";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function CatalogLayout({ children }) {
  return children;
}
