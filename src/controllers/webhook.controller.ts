import { Request, Response } from "express";
import webhookService from "../services/webhook.service.js";

class WebhookController {

    async health(
        req: Request,
        res: Response
    ) {

        res.json({

            success: true,

            message:
                "XRPL Webhook running"

        });

    }

}

export const webhookController =
new WebhookController();