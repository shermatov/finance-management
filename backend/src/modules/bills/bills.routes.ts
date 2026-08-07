import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./bills.controller.js";
import { createBillSchema, idParamSchema, updateBillSchema } from "./bills.schemas.js";

export const billsRouter = Router();

billsRouter.use(requireAuth);

billsRouter.get("/", controller.list);
billsRouter.post("/", validate({ body: createBillSchema }), controller.create);
billsRouter.patch("/:id", validate({ params: idParamSchema, body: updateBillSchema }), controller.update);
billsRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
billsRouter.post("/:id/pay", validate({ params: idParamSchema }), controller.markPaid);
