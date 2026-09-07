import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ProgressProvider } from '@/lib/store'
import { Footer, Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'System Design Gym',
  description:
    'Learn system design by writing your own answer first, then comparing. Five gated stages, a problem library grouped by shape, and progress tracking that tells you which mistake you keep making.',
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
        <ProgressProvider>
          <Nav />
          {children}
          <Footer />
        </ProgressProvider>
      </body>
    </html>
  )
}
