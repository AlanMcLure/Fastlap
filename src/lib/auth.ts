import { db } from '@/lib/db'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { UserRole } from '@prisma/client'
import { stripProviderTokens } from '@/lib/accountTokens'
import { canSignIn, CONSENT_COOKIE, TERMS_VERSION } from '@/lib/consent'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const prismaAdapter = PrismaAdapter(db)

export const authOptions: NextAuthConfig = {
  // Google tokens are never stored: the app only needs the identity (JWT session)
  adapter: {
    ...prismaAdapter,
    linkAccount: (account) =>
      prismaAdapter.linkAccount!(stripProviderTokens(account)),
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
    // Auth errors (e.g. AccessDenied when the age declaration is missing) show on the sign-in page.
    error: '/sign-in',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  events: {
    // The account is only created after signIn() verified the declaration below.
    async createUser({ user }) {
      if (!user.id) return
      await db.user.update({
        where: { id: user.id },
        data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
      })
    },
  },
  callbacks: {
    // New accounts need the age declaration and the acceptance of the terms (cookie set by the form).
    async signIn({ user }) {
      try {
        const existing = user.email
          ? await db.user.findUnique({ where: { email: user.email }, select: { id: true } })
          : null
        const jar = await cookies()
        return canSignIn(!!existing, jar.get(CONSENT_COOKIE)?.value)
      } catch (error) {
        console.error('Sign-in consent check failed:', error)
        return false
      }
    },

    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email ?? ''
        session.user.image = token.picture
        session.user.username = token.username
        session.user.role = token.role as UserRole
      }

      return session
    },

    async jwt({ token, user, trigger }) {
      // Explicit refresh (client calls `update()`, e.g. after a Premium checkout).
      // Only the DB is trusted: whatever the client sends along is ignored.
      if (trigger === 'update' && token.id) {
        const fresh = await db.user.findUnique({ where: { id: token.id } })
        if (fresh) {
          token.name = fresh.name
          token.picture = fresh.image
          token.username = fresh.username
          token.role = fresh.role
        }
        return token
      }

      // user is only present on sign-in — rehydrate from DB then, not on every request
      if (!user) return token

      // never query without an email: an undefined filter would match any user
      if (!token.email) {
        token.id = user.id as string
        return token
      }

      const dbUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
      })

      if (!dbUser) {
        token.id = user.id as string
        return token
      }

      if (!dbUser.username) {
        await db.user.update({
          where: {
            id: dbUser.id,
          },
          data: {
            username: nanoid(10),
          },
        })
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        username: dbUser.username,
        role: dbUser.role,
      }
    },
    redirect() {
      return '/'
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

export const getAuthSession = () => auth()
