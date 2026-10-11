import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const tag = body.tag || "cms";
    const path = body.path || "/";

    if (tag) {
      revalidateTag(tag);
      if (tag === "cms") {
        revalidateTag("home");
      }
    }
    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({ revalidated: true, tag, path, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ revalidated: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag") || "cms";
    const path = searchParams.get("path") || "/";

    if (tag) {
      revalidateTag(tag);
      if (tag === "cms") {
        revalidateTag("home");
      }
    }
    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({ revalidated: true, tag, path, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ revalidated: false, error: err.message }, { status: 500 });
  }
}
