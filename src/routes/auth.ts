import express from 'express'
import passport from 'passport'
import { generateToken } from '../lib/auth'

const router = express.Router()

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }))

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user)
    res.json({ token })
  }
)

export default router
