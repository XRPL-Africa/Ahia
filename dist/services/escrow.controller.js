import { asyncHandler } from "../middleware/index.js";
import escrowService from "../services/escrow.service.js";
export const escrowController = {
    createEscrow: asyncHandler(async (req, res) => {
        const escrow = await escrowService.createEscrow(req.user.id, req.body);
        res.json({ success: true, data: escrow });
    }),
    getMyEscrows: asyncHandler(async (req, res) => {
        const escrows = await escrowService.getUserEscrows(req.user.id);
        res.json({ success: true, data: escrows });
    }),
    getEscrowById: asyncHandler(async (req, res) => {
        const escrow = await escrowService.getEscrowById(req.params.id);
        res.json({ success: true, data: escrow });
    }),
    initiatePayment: asyncHandler(async (req, res) => {
        const result = await escrowService.initiatePayment(req.params.id, req.user.id);
        res.json({ success: true, data: result });
    }),
    verifyCryptoPayment: asyncHandler(async (req, res) => {
        await escrowService.verifyCryptoPayment(req.params.id);
        res.json({
            success: true,
            message: "Payment verified",
        });
    }),
    markHandover: asyncHandler(async (req, res) => {
        const result = await escrowService.markHandover(req.params.id, req.user.id);
        res.json({ success: true, data: result });
    }),
    verifyAndRelease: asyncHandler(async (req, res) => {
        const result = await escrowService.verifyAndRelease(req.params.id, req.user.id);
        res.json({ success: true, data: result });
    }),
    cancelEscrow: asyncHandler(async (req, res) => {
        const result = await escrowService.cancelEscrow(req.params.id, req.user.id);
        res.json({ success: true, data: result });
    }),
};
//# sourceMappingURL=escrow.controller.js.map