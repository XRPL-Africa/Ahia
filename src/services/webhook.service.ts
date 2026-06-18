import { Client } from "xrpl";
import logger from "../config/logger.js";
import { paymentsService } from "./payments.service.js";
import prisma from "../config/database.js";

class WebhookService {

    private client: Client;

    constructor() {
        this.client = new Client(
            process.env.XRPL_NODE_URL!
        );
    }

    async start() {
        await this.client.connect();

        logger.info("XRPL Webhook started");

        await this.client.request({
            command: "subscribe",
            streams: ["transactions"]
        });

        this.client.on(
            "transaction",
            this.handleTransaction.bind(this)
        );
    }

    async stop() {
        await this.client.disconnect();
    }

    private async handleTransaction(event: any) {

        try {

            const tx = event.transaction;

            if (!tx) return;

            const destinationTag = tx.DestinationTag;

            if (!destinationTag) return;

            const escrow =
                await prisma.escrow.findUnique({
                    where: {
                        destinationTag
                    }
                });

            if (!escrow) return;

            await paymentsService.confirmPayment(
                escrow.id,
                tx.hash
            );

            logger.info(
                `Escrow ${escrow.id} confirmed`
            );

        } catch (err) {

            logger.error(err);

        }
    }
}

export const webhookService = new WebhookService();

export default webhookService;