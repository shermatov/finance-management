import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./categories.controller.js";
import { createCategorySchema, idParamSchema, updateCategorySchema } from "./categories.schemas.js";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", controller.list);
categoriesRouter.post("/", validate({ body: createCategorySchema }), controller.create);
categoriesRouter.patch("/:id", validate({ params: idParamSchema, body: updateCategorySchema }), controller.update);
categoriesRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
