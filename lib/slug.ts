/** Stable id from a heading. Shared so the anchor and the contents link agree. */
export function headingSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/`|\*\*|_/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}
