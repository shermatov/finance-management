import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./attachments.controller.js";
import { createAttachmentSchema, idParamSchema, listQuerySchema } from "./attachments.schemas.js";

export const attachmentsRouter = Router();

attachmentsRouter.use(requireAuth);
attachmentsRouter.get("/", validate({ query: listQuerySchema }), controller.list);
attachmentsRouter.post("/", validate({ body: createAttachmentSchema }), controller.create);
attachmentsRouter.delete("/:id", validate({ params: idParamSchema }), controller.remove);
