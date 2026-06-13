import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import {
  authenticate,
  authorize,
  uploadCampusLogo,
  handleUploadError,
} from '../middleware/index.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.post('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);
router.post('/users/:id/strike', adminController.addStrike);

// Disputes
router.get('/disputes', adminController.getDisputes);
router.post('/disputes/:id/resolve', adminController.resolveDispute);

// Campuses
router.get('/campuses', adminController.getCampuses);
router.post(
  '/campuses',
  uploadCampusLogo.single('logo'),
  handleUploadError,
  adminController.createCampus
);
router.patch('/campuses/:id', adminController.updateCampus);

// Swap spots
router.post('/swap-spots', adminController.createSwapSpot);

export default router;
