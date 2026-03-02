import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Tasks } from "../models/task.models.js";
import { SubTasks } from "../models/subtask.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";

const getTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Ptoject not found");
  }

  const tasks = await Tasks.findOne({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("assignedTo", "avatar userName fullName");

  return res
    .status(201)
    .json(new ApiResponse(201, tasks, "Tasks fetched successfully!"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const files = req.files || [];

  const attachments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL}/images/${file.originalname}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  const task = await Tasks.create({
    title,
    description,
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    status,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await Tasks.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: { _id: 1, userName: 1, fullName: 1, avatar: 1 },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: { _id: 1, userName: 1, fullName: 1, avatar: 1 },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!task || task.length === 0) {
    throw new ApiError(404, "Task not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Tasks fetched successfully!"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { assignedTo } = req.body;

  const updatedObject = {};

  const taskExists = await Tasks.findById(taskId);

  if (!taskExists) {
    throw new ApiError(404, "task does not exist");
  }

  if (assignedTo) {
    if (!(await User.findById(assignedTo))) {
      throw new ApiError(404, "Assigned user not found!");
    } else {
      updatedObject.assignedTo = new mongoose.Types.ObjectId(assignedTo);
      updatedObject.assignedBy = new mongoose.Types.ObjectId(req.user._id);
    }
  }

  const files = req.files || [];

  if (files.length > 0) {
    const attachments = files.map((file) => {
      return {
        url: `${process.env.SERVER_URL}/images/${file.originalname}`,
        mimetype: file.mimetype,
        size: file.size,
      };
    });

    updatedObject.attachments = attachments;
  }

  if (Object.keys(updatedObject).length === 0) {
    throw new ApiError(400, "No update fields provided");
  }

  const task = await Tasks.findByIdAndUpdate(taskId, updatedObject, {
    new: true,
  });

  if (!task) {
    throw new ApiError(404, "task does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Tasks.findByIdAndDelete(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found!");
  }

  res
    .status(200)
    .json(new ApiResponse(200, task, "Task deleted successfully!"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;

  const task = await Tasks.findById(taskId);

  if (!task) {
    throw new ApiError(404, "Invalid request");
  }

  await SubTasks.create({
    title,
    task: new mongoose.Types.ObjectId(taskId),
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  res
    .status(201)
    .json(new ApiResponse(201, {}, "Subtask created successfully!"));
});

const updateSubtask = asyncHandler(async (req, res) => {
  const { subTaskId } = req.params;
  const { title } = req.body;

  const subtask = await SubTasks.findByIdAndUpdate(
    subTaskId,
    {
      title: title,
    },
    {
      new: true,
    },
  );

  if (!subtask) {
    throw new ApiError(404, "Subtask does not exists!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully!"));
});

const deleteSubtask = asyncHandler(async (req, res) => {
  const { subTaskId } = req.params;

  const subtask = await SubTasks.findByIdAndDelete(subTaskId);

  if (!subtask) {
    throw new ApiError(404, "No such subtask exists!");
  }

  res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask deleted successfully"));
});

export {
  getTask,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubtask,
  deleteSubtask,
};
