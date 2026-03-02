import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordReq,
  resetPassword,
  changePassword,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotCurrentPasswordValidator,
  userResetCurrentPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// unsecured routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").get(refreshAccessToken);
router
  .route("/forgot-password")
  .post(userForgotCurrentPasswordValidator(), forgotPasswordReq);
router
  .route("/reset-password/:resetToken")
  .post(userResetCurrentPasswordValidator(), resetPassword);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(verifyJWT, userChangeCurrentPasswordValidator(), changePassword);
router
  .route("/reset-email-verification")
  .post(verifyJWT, resendEmailVerification);

export default router;
