import { Router } from "express";
import {
  verifyJWT,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { createTaskValidator } from "../validators/index.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getTask,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubtask,
  deleteSubtask,
} from "../controllers/task.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { UserRolesEnums, AvailableUserRoles } from "../utils/constants.js";

const router = Router({ mergeParams: true });

router.use(verifyJWT);

router
  .route("/")
  .get(getTask)
  .post(upload.array("images", 5), createTaskValidator(), validate, createTask);

router
  .route("/:taskId")
  .get(validateProjectPermission(AvailableUserRoles), validate, getTaskById)
  .put(
    upload.array("images", 5),
    validateProjectPermission([UserRolesEnums.ADMIN]),
    validate,
    updateTask,
  )
  .delete(
    validateProjectPermission([UserRolesEnums.ADMIN]),
    validate,
    deleteTask,
  );

export default router;
