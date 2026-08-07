import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./transactions.controller.js";
import {
  createTransactionSchema,
  idParamSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from "./transactions.schemas.js";

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.get("/", validate({ query: listTransactionsQuerySchema }), controller.list);
transactionsRouter.post("/", validate({ body: createTransactionSchema }), controller.create);
transactionsRouter.get("/:id", validate({ params: idParamSchema }), controller.get);
transactionsRouter.patch("/:id", validate({ params: idParamSchema, body: updateTransactionSchema }), controller.update);
transactionsRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
