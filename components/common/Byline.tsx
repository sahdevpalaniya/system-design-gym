import Link from "next/link";
import { AUTHOR, reportHref } from "@/lib/author";
import { CONTACT_EMAIL } from "@/lib/legal";
import { CONTENT_MODIFIED } from "@/lib/content-dates";
import { ShareButton } from "./ShareButton";
import { Newsletter } from "./Newsletter";

/** Who wrote the page, when it was last checked, and a way to report a
 *  mistake. On every lesson, concept and problem, so trust is never one
 *  click away. */
export function Byline({ title, path }: { title: string; path: string }) {
  const reviewed = new Date(CONTENT_MODIFIED).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <>
      <Newsletter compact />
      <footer
        className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-4 text-[0.8125rem]"
        style={{ borderColor: "var(--border)", color: "var(--faint)" }}
      >
        <span>
          Written by{" "}
          <Link
            href="/about"
            className="inline-block py-2 font-medium hover:opacity-70 sm:py-0"
            style={{ color: "var(--muted)" }}
          >
            {AUTHOR.name}
          </Link>
        </span>
        <span>Last reviewed {reviewed}</span>
        <a
          href={reportHref(CONTACT_EMAIL, title, path)}
          className="inline-block py-2 font-medium hover:opacity-70 sm:py-0"
          style={{ color: "var(--accent)" }}
        >
          Report a mistake
        </a>
        <ShareButton title={title} />
      </footer>
    </>
  );
}
