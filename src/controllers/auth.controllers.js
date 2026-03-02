import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendEmail } from "../utils/mail.js";
import { emailVerificationMailgenContent } from "../utils/mail.js";
import { passwordResetMailgenContent } from "../utils/mail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Somethong went wrong!!");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  // const existedUser = await User.findOne({
  //   $or: [{ email }, { userName }],
  // });

  // if (existedUser) {
  //   throw new ApiError(409, "email/username already exists!!!");
  // }

  let user;
  try {
    user = await User.create({
      email,
      password,
      userName,
      isEmailVerified: false,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "User with credential already exists!");
    }
    throw err;
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user?.email,
      subject: "Verify email",
      mailgenContent: emailVerificationMailgenContent(
        user.userName,
        `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
      ),
    });
  } catch (err) {
    console.log("Email could not be sent!", err);
  }

  // const createdUser = await User.findById(user._id).select(
  //   "-password -refreshToken -emailVerificationToken",
  // );
  const createdUser = user.toObject();
  delete createdUser.password;
  delete createdUser.refreshToken;
  delete createdUser.emailVerificationToken;

  if (!createdUser) {
    throw new ApiError(500, "Could not register user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User registered successfully and verification mail sent!!",
      ),
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, userName } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required!");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User does not exist!");
  }

  // if (!user.isEmailVerified) {
  //   throw new ApiError(403, "Please verify your email first");
  // }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Incorrect password!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Logged In successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      refreshToken: "",
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged Out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched successfully!"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Missing email verification token!");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid/Expired token");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isEmailVerified: true,
      },
      "User email verified successfully!",
    ),
  );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }
  if (user.isEmailVerified) {
    throw new ApiError(409, "User email is already verified!");
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user?.email,
      subject: "Verify email",
      mailgenContent: emailVerificationMailgenContent(
        user.userName,
        `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
      ),
    });
  } catch (err) {
    console.log("Email not sent!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verification mail sent"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorised access!");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid User!");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token expired!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    user.refreshToken = newrefreshToken;
    // await user.save();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken: accessToken, refreshToken: newrefreshToken },
          "Access token refreshed!",
        ),
      );
  } catch (error) {
    throw new ApiError(400, "Invalid refresh token!");
  }
});

const forgotPasswordReq = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "If this email exists, a password reset link has been sent.",
        ),
      );
  }

  const now = Date.now();
  const cooldownTime = 2 * 60 * 1000;

  if (
    user.forgotPasswordRequestedAt &&
    now - user.forgotPasswordRequestedAt.getTime() <= cooldownTime
  ) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "If this email exists, a password reset link has been sent.",
        ),
      );
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  user.forgotPasswordRequestedAt = now;
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user?.email,
      subject: "Password reset request",
      mailgenContent: passwordResetMailgenContent(
        user.userName,
        `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
      ),
    });
  } catch (err) {
    console.log("Failed to send email", err.message);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "If this email exists, a password reset link has been sent.",
      ),
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(409, "Token expired/invalid");
  }

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully!"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfilly"));
});

export {
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
};
