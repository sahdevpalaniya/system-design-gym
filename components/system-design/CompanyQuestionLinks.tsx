import Link from 'next/link'
import { getCompany } from '@/content/system-design/companies'
import type { CompanyQuestion } from '@/lib/types'

/** Chips linking to company-style questions. Callers filter COMPANY_QUESTIONS,
 *  so the list follows companies.ts. Renders nothing when empty. */
export function CompanyQuestionLinks({
  title,
  qs,
}: {
  title: string
  qs: CompanyQuestion[]
}) {
  if (!qs.length) return null
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-[0.875rem] font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {qs.map((q) => (
          <Link
            key={q.id}
            href={`/company/${q.company}/${q.id}`}
            className="rounded-lg border px-3 py-1.5 text-[0.8438rem] font-medium transition hover:opacity-70"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            {getCompany(q.company)?.name}: {q.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
