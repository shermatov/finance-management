import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./plans.controller.js";
import { createPlanSchema, idParamSchema, updatePlanSchema } from "./plans.schemas.js";

export const plansRouter = Router();

plansRouter.use(requireAuth);

plansRouter.get("/", controller.list);
plansRouter.post("/", validate({ body: createPlanSchema }), controller.create);
plansRouter.patch("/:id", validate({ params: idParamSchema, body: updatePlanSchema }), controller.update);
plansRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
