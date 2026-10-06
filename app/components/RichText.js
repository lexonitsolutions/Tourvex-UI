import { CmsLink } from "./CmsLink";

/**
 * Safe renderer for the CMS markdown subset: **bold**, *italic*, [text](url), line breaks and "- " bullet lists.
 * It builds React elements only (no HTML strings, no dangerouslySetInnerHTML): anything else is plain text, and
 * links go through CmsLink, which refuses every scheme except relative paths, https, mailto and tel.
 */

const TOKEN = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

export function renderInline(text, keyPrefix = "r") {
  const nodes = [];
  let last = 0;
  let index = 0;
  for (const match of String(text ?? "").matchAll(TOKEN)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${index++}`;
    if (match[1] !== undefined) nodes.push(<strong key={key}>{renderInline(match[1], key)}</strong>);
    else if (match[2] !== undefined) nodes.push(<em key={key}>{renderInline(match[2], key)}</em>);
    else nodes.push(<CmsLink key={key} href={match[4]}>{match[3]}</CmsLink>);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Inline-only variant: a single line, no wrapper element. */
export function InlineRichText({ text }) {
  return <>{renderInline(text)}</>;
}

/** Block variant: paragraphs, bullet lists and line breaks. */
export default function RichText({ text, className }) {
  const blocks = [];
  let list = null;
  String(text ?? "").split("\n").forEach((line, i) => {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list) {
        list = [];
        blocks.push({ type: "ul", items: list, key: i });
      }
      list.push(bullet[1]);
      return;
    }
    list = null;
    blocks.push({ type: "line", text: line, key: i });
  });
  return (
    <div className={className}>
      {blocks.map((block) =>
        block.type === "ul" ? (
          <ul key={block.key}>{block.items.map((item, i) => <li key={i}>{renderInline(item, `l${block.key}-${i}`)}</li>)}</ul>
        ) : block.text.trim() === "" ? (
          <br key={block.key} />
        ) : (
          <p key={block.key}>{renderInline(block.text, `p${block.key}`)}</p>
        )
      )}
    </div>
  );
}
