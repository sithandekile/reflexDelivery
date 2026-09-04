import express from'express';
import authmid from '../middleware/auth.js';
import { fetchDeliveries,createDelivery,fetchSingleDelivery } from '../controllers/deliveryController.js';
const router = express.Router();

// delivery Routers
router.post('/', authmid.requireAuth, authmid.requireRole('retailer'), createDelivery) 
router.get('/', authmid.requireAuth,fetchDeliveries) 
router.get('/:id', authmid.requireAuth, fetchSingleDelivery) 

export default router;
