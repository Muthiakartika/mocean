import Link from "next/link";

export type TextLink = { text: string; href: string };

/** `text` with the first occurrence of `link.text` as a link (internal links inside the homepage's plain-text copy). */
export default function LinkedText({ text, link }: { text: string; link?: TextLink }) {
  const at = link ? text.indexOf(link.text) : -1;
  if (!link || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <Link href={link.href}>{link.text}</Link>
      {text.slice(at + link.text.length)}
    </>
  );
}
