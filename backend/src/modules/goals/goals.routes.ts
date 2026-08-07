import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./goals.controller.js";
import { contributeSchema, createGoalSchema, idParamSchema, updateGoalSchema } from "./goals.schemas.js";

export const goalsRouter = Router();

goalsRouter.use(requireAuth);

goalsRouter.get("/", controller.list);
goalsRouter.post("/", validate({ body: createGoalSchema }), controller.create);
goalsRouter.patch("/:id", validate({ params: idParamSchema, body: updateGoalSchema }), controller.update);
goalsRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
goalsRouter.post("/:id/contribute", validate({ params: idParamSchema, body: contributeSchema }), controller.contribute);
