import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./accounts.controller.js";
import { createAccountSchema, idParamSchema, transferSchema, updateAccountSchema } from "./accounts.schemas.js";

export const accountsRouter = Router();

accountsRouter.use(requireAuth);

accountsRouter.get("/", controller.list);
accountsRouter.post("/", validate({ body: createAccountSchema }), controller.create);
accountsRouter.post("/transfer", validate({ body: transferSchema }), controller.transfer);
accountsRouter.get("/:id", validate({ params: idParamSchema }), controller.get);
accountsRouter.patch("/:id", validate({ params: idParamSchema, body: updateAccountSchema }), controller.update);
accountsRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
