import express from 'express';
const router = express.Router();
import authmid from '../middleware/auth.js';
import { deliveryStatus } from '../controllers/statusController.js';


//rider route
router.post('/:deliveryId', authmid.requireAuth,
   authmid.requireRole('rider', 'dispatcher'),
   deliveryStatus
  ) 

export default router;
