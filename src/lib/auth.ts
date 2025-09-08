import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("=== AUTHORIZE FUNCTION CALLED ===")
        console.log("Credentials received:", { email: credentials?.email, hasPassword: !!credentials?.password })
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        console.log("Looking up user in database...")
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          console.log("User not found in database")
          return null
        }

        console.log("User found:", { id: user.id, email: user.email, role: user.role })

        // For now, we'll create a simple password verification
        // In a real app, you'd store hashed passwords
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ""
        )

        if (!isPasswordValid) {
          console.log("Password validation failed for:", credentials.email)
          return null
        }

        console.log("Password validation successful!")
        console.log("Returning user object:", {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Ensure relative URLs stay inside site
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allow callback URLs on same origin
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
    async jwt({ token, user }) {
      console.log("=== JWT CALLBACK CALLED ===")
      console.log("Token before:", JSON.stringify(token, null, 2))
      console.log("User:", JSON.stringify(user, null, 2))
      
      if (user) {
        console.log("JWT callback - user exists, adding role to token")
        token.role = user.role
        token.id = user.id
        console.log("JWT callback - token.role set to:", token.role)
      }
      
      console.log("Token after:", JSON.stringify(token, null, 2))
      return token
    },
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK CALLED ===")
      console.log("Session before:", JSON.stringify(session, null, 2))
      console.log("Token:", JSON.stringify(token, null, 2))
      
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        console.log("Session callback - updated session with role:", session.user.role)
        console.log("Session callback - session.user.id:", session.user.id)
      }
      
      console.log("Session after:", JSON.stringify(session, null, 2))
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
  },
}