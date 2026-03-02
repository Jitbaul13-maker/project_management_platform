import { body } from "express-validator";
import { AvailableUserRoles } from "../utils/constants.js";

const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email!"),
    body("userName")
      .trim()
      .notEmpty()
      .withMessage("Username is required!")
      .isLowercase()
      .withMessage("username must be lower case!")
      .isLength({ min: 3 })
      .withMessage("username must be atleast 3 characters long!"),
    body("password").trim().notEmpty().withMessage("password is a must!"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required!"),
  ];
};

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required!"),
    body("newPassword").notEmpty().withMessage("New password is required!"),
  ];
};

const userForgotCurrentPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email"),
  ];
};

const userResetCurrentPasswordValidator = () => {
  return [body("newPassword").notEmpty().withMessage("Password is required")];
};

const createProjectValidator = () => {
  return [
    body("name").notEmpty().withMessage("Name is required!"),
    body("description").optional(),
  ];
};

const addMemberProjectValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email"),
    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(AvailableUserRoles)
      .withMessage("Role is invalid"),
  ];
};

const createTaskValidator = () => {
  return [body("title").notEmpty().withMessage("Title is required!")];
};

export {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotCurrentPasswordValidator,
  userResetCurrentPasswordValidator,
  createProjectValidator,
  addMemberProjectValidator,
  createTaskValidator
};
