/**
 * Who writes the site. Shown on /about, in the "written by" footer on every
 * lesson, and as the author in article structured data — one place, so the
 * byline never disagrees with itself. The author is the site itself (an
 * editorial team byline), not an individual.
 */
export const AUTHOR = {
  name: 'devskills editorial team',
  bio: 'We wrote this site because the material available for interview preparation either taught components without a method, or sat behind a paywall.',
}

/** Where a reader reports a mistake: a prefilled email naming the page. */
export function reportHref(email: string, pageTitle: string, url: string): string {
  const subject = `Mistake on "${pageTitle}"`
  const body = `Page: ${url}\n\nWhat is wrong, and what should it say instead?\n\n`
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
