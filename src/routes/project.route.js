import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMembers,
  deleteMembers,
  getMembers,
  updateMemberRoles,
} from "../controllers/project.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  createProjectValidator,
  addMemberProjectValidator,
} from "../validators/index.js";
import {
  verifyJWT,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { AvailableUserRoles, UserRolesEnums } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getProjects)
  .post(createProjectValidator(), validate, createProject);

router
  .route("/:projectId")
  .get(validateProjectPermission(AvailableUserRoles), getProjectById)
  .post(
    validateProjectPermission([UserRolesEnums.ADMIN]),
    validate,
    updateProject,
  )
  .delete(
    validateProjectPermission([UserRolesEnums.ADMIN]),
    validate,
    deleteProject,
  );

router
  .route("/:projectId/members/")
  .get(getMembers)
  .post(
    validateProjectPermission([UserRolesEnums.ADMIN]),
    addMemberProjectValidator(),
    validate,
    addMembers,
  );

router
  .route("/:projectId/members/:userId")
  .put(validateProjectPermission([UserRolesEnums.ADMIN]), updateMemberRoles)
  .delete(validateProjectPermission([UserRolesEnums.ADMIN]), deleteMembers);

export default router;
