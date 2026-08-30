import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./habits.controller.js";
import { createHabitSchema, idParamSchema, logTodaySchema, updateHabitSchema } from "./habits.schemas.js";

export const habitsRouter = Router();

habitsRouter.use(requireAuth);

habitsRouter.get("/", controller.list);
habitsRouter.post("/", validate({ body: createHabitSchema }), controller.create);
habitsRouter.patch("/:id", validate({ params: idParamSchema, body: updateHabitSchema }), controller.update);
habitsRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
habitsRouter.post("/:id/log-today", validate({ params: idParamSchema, body: logTodaySchema }), controller.logToday);
