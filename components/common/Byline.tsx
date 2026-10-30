import Link from "next/link";
import { AUTHOR, reportHref } from "@/lib/author";
import { CONTACT_EMAIL } from "@/lib/legal";
import { SITE_URL } from "@/lib/seo";
import { pageDates } from "@/lib/content-dates";
import { ShareButton } from "./ShareButton";
import { Newsletter } from "./Newsletter";

/** The date a page's content last changed, from git (lib/content-dates). */
export function reviewedOn(path: string): string {
  return new Date(pageDates(path).modified).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Author and "Last updated" date under a content page's heading, so both
 *  are visible without scrolling to the footer byline. */
export function ReviewedLine({ path }: { path: string }) {
  return (
    <p className="-mt-2 mb-6 text-[0.8125rem]" style={{ color: "var(--faint)" }}>
      By{" "}
      <Link href="/about" className="font-medium hover:opacity-70" style={{ color: "var(--muted)" }}>
        {AUTHOR.name}
      </Link>
      {" · "}Last updated <time dateTime={pageDates(path).modified}>{reviewedOn(path)}</time>
    </p>
  );
}

/** Who wrote the page, when it was last checked, and a way to report a
 *  mistake. On every lesson, concept and problem, so trust is never one
 *  click away. */
export function Byline({ title, path }: { title: string; path: string }) {
  const reviewed = reviewedOn(path);
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
        <span>Last updated {reviewed}</span>
        <a
          href={reportHref(CONTACT_EMAIL, title, `${SITE_URL}${path}`)}
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
