import express from 'express'
import passport from 'passport'
import { generateToken } from '../lib/auth'
import { authenticateJWT } from '../lib/auth'

const router = express.Router()

router.get('/github', 
  (req, res, next) => {
    // Store the original URL to redirect back after authentication
    req.session.returnTo = req.query.returnTo || req.headers.referer || '/'
    next()
  },
  passport.authenticate('github', { 
    scope: ['user:email', 'read:org']  // Add read:org scope for org membership check
  })
)

router.get(
  '/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/login',
    session: true 
  }),
  (req, res) => {
    const token = generateToken(req.user)
    const returnTo = req.session.returnTo || '/'
    delete req.session.returnTo
    
    // Redirect with token as query parameter
    res.redirect(`${returnTo}?token=${token}`)
  }
)

export default router
