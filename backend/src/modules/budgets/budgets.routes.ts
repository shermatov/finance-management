import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./budgets.controller.js";
import { createBudgetSchema, idParamSchema, listQuerySchema, updateBudgetSchema } from "./budgets.schemas.js";

export const budgetsRouter = Router();

budgetsRouter.use(requireAuth);

budgetsRouter.get("/", validate({ query: listQuerySchema }), controller.list);
budgetsRouter.get("/:id/transactions", validate({ params: idParamSchema }), controller.transactions);
budgetsRouter.post("/", validate({ body: createBudgetSchema }), controller.create);
budgetsRouter.patch("/:id", validate({ params: idParamSchema, body: updateBudgetSchema }), controller.update);
budgetsRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
