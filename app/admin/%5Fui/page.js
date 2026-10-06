import { notFound } from "next/navigation";

export const metadata = { title: "shadcn UI gallery" };

// Development-only gallery at /admin/_ui (the folder is %5Fui because a plain `_ui` folder is a private, non-routable folder).
// NODE_ENV is inlined at build time, so the `else` branch (the only reference to the gallery) is dead code in production
// and the whole gallery is dropped from the bundle instead of merely returning 404.
export default async function UiGalleryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  } else {
    const { default: Gallery } = await import("../_ui/gallery/Gallery");
    return <Gallery />;
  }
}
