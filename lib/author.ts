/**
 * Who writes the site. Shown on /about, in the "written by" footer on every
 * lesson, and as the author in article structured data — one place, so the
 * byline never disagrees with itself.
 */
export const AUTHOR = {
  name: 'Sahdev Palaniya',
  role: 'Software engineer',
  bio: 'I build and run web applications for a living. I wrote this site because the material I needed when preparing for interviews either taught components without a method, or sat behind a paywall.',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sahdev-palaniya/' },
    { label: 'GitHub', href: 'https://github.com/sahdevpalaniya' },
    { label: 'X', href: 'https://x.com/sahdev98' },
  ],
}

/** Where a reader reports a mistake: a prefilled email naming the page. */
export function reportHref(email: string, pageTitle: string, url: string): string {
  const subject = `Mistake on "${pageTitle}"`
  const body = `Page: ${url}\n\nWhat is wrong, and what should it say instead?\n\n`
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
