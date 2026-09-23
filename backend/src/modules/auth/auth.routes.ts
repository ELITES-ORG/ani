import { Router } from 'express';
import { authLimiter } from '../../middleware/rate-limit.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { loginBody, registerBody } from './auth.schema.js';
import { authenticate, currentUser, registerUser } from './auth.service.js';

export const authRouter: Router = Router();

authRouter.post('/register', authLimiter, async (req, res) => {
  const body = registerBody.parse(req.body);
  const user = await registerUser(body);

  // Regenerating on privilege change prevents session fixation.
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  req.session.userId = user.id;

  res.status(201).json({ data: await currentUser(user) });
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const body = loginBody.parse(req.body);
  const user = await authenticate(body.username, body.password);

  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  req.session.userId = user.id;

  res.json({ data: await currentUser(user) });
});

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('ani.sid');
    res.status(204).end();
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ data: await currentUser(req.user!) });
});
