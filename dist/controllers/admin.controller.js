import { adminService } from '../services/admin.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createCampusSchema, createSwapSpotSchema, resolveDisputeSchema, uuidParamSchema, } from '../validators/index.js';
export const adminController = {
    /**
     * Get dashboard statistics
     */
    getDashboardStats: asyncHandler(async (_req, res) => {
        const stats = await adminService.getDashboardStats();
        res.json({
            success: true,
            message: 'Dashboard statistics retrieved',
            data: { stats },
        });
    }),
    /**
     * Get all users
     */
    getUsers: asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const role = req.query.role;
        const campusId = req.query.campusId;
        const search = req.query.search;
        const result = await adminService.getUsers({
            status: status,
            role: role,
            campusId,
            search,
            page,
            limit,
        });
        res.json({
            success: true,
            message: 'Users retrieved successfully',
            data: result.users,
            meta: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
            },
        });
    }),
    /**
     * Get user details
     */
    getUserDetails: asyncHandler(async (req, res) => {
        const { id } = uuidParamSchema.parse(req.params);
        const user = await adminService.getUserDetails(id);
        res.json({
            success: true,
            message: 'User details retrieved',
            data: { user },
        });
    }),
    /**
     * Suspend user
     */
    suspendUser: asyncHandler(async (req, res) => {
        const { id } = uuidParamSchema.parse(req.params);
        const { reason } = req.body;
        const adminId = req.user.id;
        const user = await adminService.suspendUser(id, reason, adminId);
        res.json({
            success: true,
            message: 'User suspended successfully',
            data: { user },
        });
    }),
    /**
     * Ban user
     */
    banUser: asyncHandler(async (req, res) => {
        const { id } = uuidParamSchema.parse(req.params);
        const { reason } = req.body;
        const adminId = req.user.id;
        const user = await adminService.banUser(id, reason, adminId);
        res.json({
            success: true,
            message: 'User banned successfully',
            data: { user },
        });
    }),
    /**
     * Unban user
     */
    unbanUser: asyncHandler(async (req, res) => {
        const { id } = uuidParamSchema.parse(req.params);
        const adminId = req.user.id;
        const user = await adminService.unbanUser(id, adminId);
        res.json({
            success: true,
            message: 'User unbanned successfully',
            data: { user },
        });
    }),
    /**
     * Add strike to user
     */
    addStrike: asyncHandler(async (req, res) => {
        const { id } = uuidParamSchema.parse(req.params);
        const { reason } = req.body;
        const adminId = req.user.id;
        const user = await adminService.addStrike(id, reason, adminId);
        res.json({
            success: true,
            message: 'Strike added successfully',
            data: { user },
        });
    }),
    /**
     * Get disputes
     */
    getDisputes: asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const result = await adminService.getDisputes({ status: status, page, limit });
        res.json({
            success: true,
            message: 'Disputes retrieved successfully',
            data: result.disputes,
            meta: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
            },
        });
    }),
    /**
     * Resolve dispute
     */
    resolveDispute: asyncHandler(async (req, res) => {
        const { id } = uuidParamSchema.parse(req.params);
        const validatedData = resolveDisputeSchema.parse(req.body);
        const adminId = req.user.id;
        const dispute = await adminService.resolveDispute(id, validatedData.resolution, validatedData.notes || '', adminId);
        res.json({
            success: true,
            message: 'Dispute resolved successfully',
            data: { dispute },
        });
    }),
    /**
     * Create campus
     */
    createCampus: asyncHandler(async (req, res) => {
        const validatedData = createCampusSchema.parse(req.body);
        const campus = await adminService.createCampus(validatedData);
        res.status(201).json({
            success: true,
            message: 'Campus created successfully',
            data: { campus },
        });
    }),
    /**
     * Update campus
     */
    updateCampus: asyncHandler(async (req, res) => {
        const { id } = uuidParamSchema.parse(req.params);
        const campus = await adminService.updateCampus(id, req.body);
        res.json({
            success: true,
            message: 'Campus updated successfully',
            data: { campus },
        });
    }),
    /**
     * Create swap spot
     */
    createSwapSpot: asyncHandler(async (req, res) => {
        const validatedData = createSwapSpotSchema.parse(req.body);
        const swapSpot = await adminService.createSwapSpot(validatedData);
        res.status(201).json({
            success: true,
            message: 'Swap spot created successfully',
            data: { swapSpot },
        });
    }),
    /**
     * Get all campuses
     */
    getCampuses: asyncHandler(async (_req, res) => {
        const campuses = await adminService.getCampuses();
        res.json({
            success: true,
            message: 'Campuses retrieved successfully',
            data: { campuses },
        });
    }),
};
export default adminController;
//# sourceMappingURL=admin.controller.js.map