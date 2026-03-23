import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Hardcoded single-user auth — no database needed
const ADMIN_USER = {
  id: 'mully-admin',
  name: 'Mully',
  email: 'mully@mymully.com',
  role: 'ADMIN',
};
const ADMIN_USERNAME = 'mully';
const ADMIN_PASSWORD = process.env.AUTH_PASSWORD || 'procurement';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const login = credentials.email.toLowerCase().trim();
        const isMatch =
          (login === ADMIN_USERNAME || login === ADMIN_USER.email) &&
          credentials.password === ADMIN_PASSWORD;

        if (!isMatch) {
          return null;
        }

        return ADMIN_USER;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; role: string }).id = token.id as string;
        (session.user as { id: string; role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
