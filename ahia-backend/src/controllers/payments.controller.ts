import { Request, Response } from "express";

import { paymentsService }
from "../services/payments.service.js";

export class PaymentsController {

  async create(req: Request,res: Response) {

    const payment =
      await paymentsService.createEscrow(req.body);

    res.status(201).json({
      success: true,
      data: payment
    });
  }

  async confirm(req: Request,res: Response) {

    const result =
      await paymentsService.confirmPayment(
        req.body.escrowId,
        req.body.txHash
      );

    res.json({
      success: true,
      data: result
    });
  }

  async status(req: Request,res: Response) {

    const result =
      await paymentsService.getStatus(
        req.params.id
      );

    res.json(result);
  }

  async refund(req: Request,res: Response) {

    const result =
      await paymentsService.refundEscrow(
        req.body.escrowId
      );

    res.json(result);
  }

  async balance(req: Request,res: Response) {

    const result =
      await paymentsService.getBalance(
        req.params.address
      );

    res.json(result);
  }

  async offramp(req: Request,res: Response) {

    const result =
      await paymentsService.createOfframp(
        req.body
      );

    res.status(201).json(result);
  }

  async approveOfframp(
  req: Request,
  res: Response
) {
  const result =
    await paymentsService.approveOfframp(
      req.params.id
    );

  res.json(result);
}


async completeOfframp(
  req: Request,
  res: Response
) {
  const result =
    await paymentsService.completeOfframp(
      req.params.id
    );

  res.json(result);
}

 async history(
  req: Request,
  res: Response
) {
   const data =
      await paymentsService.getHistory(
         req.user.id
      );

   res.json(data);
}
}

export const paymentsController =
  new PaymentsController();