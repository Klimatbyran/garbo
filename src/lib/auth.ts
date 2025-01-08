import passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github2'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import authConfig from '../config/auth'
import { Request, Response, NextFunction } from 'express'
import { GarboAPIError } from './garbo-api-error'

passport.use(
  new GitHubStrategy(
    authConfig.github,
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await prisma.user.upsert({
          where: { email: profile.emails![0].value },
          update: {
            name: profile.displayName,
            githubId: profile.id,
          },
          create: {
            email: profile.emails![0].value,
            name: profile.displayName,
            githubId: profile.id,
          },
        })
        return done(null, user)
      } catch (error) {
        return done(error)
      }
    }
  )
)

passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    done(null, user)
  } catch (error) {
    done(error)
  }
})

export const generateToken = (user: any) => {
  return jwt.sign({ id: user.id, email: user.email }, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn,
  })
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    throw new GarboAPIError('No authorization header', { statusCode: 401 })
  }

  const token = authHeader.split(' ')[1]

  try {
    const user = jwt.verify(token, authConfig.jwt.secret)
    res.locals.user = user
    next()
  } catch (error) {
    throw new GarboAPIError('Invalid token', { statusCode: 401 })
  }
}
