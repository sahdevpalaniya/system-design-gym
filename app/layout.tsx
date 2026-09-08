import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/common/Providers'
import { Footer, Shell } from '@/components/common/Nav'

export const metadata: Metadata = {
  title: 'Dev Learning',
  description:
    'Learn system design and programming languages properly. Write your own answer first, then compare. Topic-by-topic tracks, a problem library, and progress tracking that tells you which mistake you keep making.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#14130f' },
  ],
}

/** Applies the saved theme before first paint so there is no flash. */
const THEME_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('sdgym.v1')||'{}');if(s.theme==='dark'||s.theme==='light'){document.documentElement.setAttribute('data-theme',s.theme)}}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Shell>{children}</Shell>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
