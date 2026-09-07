import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

/**
 * Google sign-in only, with a JWT session — no adapter and no user table.
 *
 * The only thing we need from the provider is a stable id to hang progress off,
 * so there is nothing to store about the user themselves. That keeps the amount
 * of personal data this app holds to: your Google account id, and your answers.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, profile }) {
      // `sub` is Google's stable per-user id; keep it as the progress key
      if (profile?.sub) token.sub = profile.sub
      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
  events: {
    /**
     * Record the sign-in so the admin view can count registrations and logins.
     * Failures here must never block someone signing in, so it is best-effort.
     */
    async signIn({ user, profile }) {
      const id = profile?.sub ?? user?.id
      if (!id) return
      try {
        const { touchUser } = await import('@/lib/db')
        await touchUser(id, user?.name ?? null, user?.email ?? null, true)
      } catch (err) {
        console.error('failed to record sign-in', err)
      }
    },
  },
})

/** True when Google credentials are present, so the UI can hide sign-in if not. */
export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
}
