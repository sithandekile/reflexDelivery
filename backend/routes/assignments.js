import express from 'express';
const router = express.Router();
import authmid from '../middleware/auth.js';
import { assignDelivery } from '../controllers/dispatcherController.js';

// assignment routes
router.post('/', authmid.requireAuth, 
     authmid.requireRole('dispatcher'),
      assignDelivery 
    )

export default  router;
