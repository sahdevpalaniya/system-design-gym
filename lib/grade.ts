/**
 * A cheap honesty check on self-grading.
 *
 * Self-scored checklists inflate: people tick "named the tradeoff" for
 * something they half-thought. There is no grader here, so instead of judging
 * the answer we do the one thing that is checkable — did the words the
 * checklist item is about appear in what you actually wrote?
 *
 * It is deliberately crude. A false warning costs the reader two seconds; a
 * missed one costs nothing more than the status quo. It never blocks a tick,
 * it just asks the question.
 */

const STOP = new Set([
  'about', 'above', 'after', 'again', 'against', 'along', 'among', 'because', 'been', 'before',
  'being', 'below', 'between', 'both', 'came', 'come', 'could', 'does', 'doing', 'down', 'during',
  'each', 'either', 'else', 'even', 'ever', 'every', 'from', 'gave', 'give', 'given', 'goes',
  'going', 'have', 'having', 'here', 'into', 'itself', 'just', 'know', 'least', 'less', 'like',
  'made', 'make', 'making', 'many', 'more', 'most', 'much', 'must', 'name', 'named', 'names',
  'naming', 'need', 'needs', 'never', 'next', 'once', 'only', 'other', 'over', 'own', 'people',
  'rather', 'really', 'said', 'same', 'say', 'saying', 'says', 'should', 'since', 'some', 'still',
  'such', 'take', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'thing',
  'things', 'this', 'those', 'through', 'time', 'under', 'until', 'upon', 'used', 'using', 'very',
  'want', 'well', 'were', 'what', 'when', 'where', 'which', 'while', 'will', 'with', 'without',
  'would', 'your', 'actually', 'explicitly', 'deliberately', 'stated', 'asked', 'proposed',
  'wrote', 'listed', 'handled', 'produced', 'answer', 'answers', 'design', 'designs', 'system',
  'systems', 'thought', 'point', 'points',
])

/** words worth matching on: long enough to be meaningful, not filler */
function terms(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 5 && !STOP.has(w)),
    ),
  ]
}

/** crude stem so "partitioned" matches "partition" */
function stem(w: string): string {
  return w.replace(/(ing|ed|es|s)$/, '')
}

/**
 * Indexes of ticked items whose subject matter does not appear anywhere in the
 * written answer. Empty when the answer is too short to judge fairly, or when
 * the item has no distinctive words to look for.
 */
export function unsupportedTicks(
  answer: string,
  checklist: string[],
  checked: number[],
): number[] {
  const written = new Set(terms(answer).map(stem))
  if (written.size < 8) return []
  return checked.filter((i) => {
    const item = checklist[i]
    if (!item) return false
    const want = terms(item).map(stem)
    if (want.length < 2) return false
    return !want.some((w) => written.has(w))
  })
}
