import express from 'express';
// const { sign } = require('jsonwebtoken');
import { signUp, signIn } from '../controllers/authController.js';
const router = express.Router();

//auth routes
router.post('/register',signUp)
router.post('/login', signIn)

 export default router;
