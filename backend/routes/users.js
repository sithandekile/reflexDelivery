import express from 'express'
import authmid from '../middleware/auth.js';
import { fetchUser, fetchMe } from '../controllers/userController.js';
const router = express.Router();

//user routes
router.get('/', authmid.requireAuth,fetchUser) 
router.get('/me', authmid.requireAuth, fetchMe) 

export default router;
