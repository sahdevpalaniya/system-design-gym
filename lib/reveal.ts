'use server'

import { getProblem } from '@/content/system-design/problems'
import { getQuestion } from '@/content/system-design/companies'

/**
 * Model answers are fetched only after the user submits, so they never sit in
 * the page's HTML or RSC payload. Read-only lookups by id; nothing is mutated.
 */
export async function revealStages(slug: string) {
  const p = typeof slug === 'string' ? getProblem(slug) : undefined
  return p ? p.stages.map(({ id, model, tradeoffs, sayThis, trap }) => ({ id, model, tradeoffs, sayThis, trap })) : null
}

export async function revealCompanyAnswer(qid: string) {
  const q = typeof qid === 'string' ? getQuestion(qid) : undefined
  return q ? { model: q.model, followUpAnswer: q.followUp.answer } : null
}
