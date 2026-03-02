Project Management API – Production-Style Backend System

A scalable REST API for managing projects, tasks, and subtasks with secure authentication, layered authorization, file uploads, and email-based user workflows.

Designed to simulate real-world backend architecture with controlled middleware execution and production-ready practices.


🚀 System Overview

This backend powers a collaborative project management environment where:

Users register and verify accounts via email

Authentication is handled securely using JWT

Projects contain tasks and subtasks

Permissions are validated at multiple levels

File uploads are access-controlled

Sensitive credentials are managed through environment variables

The focus is architectural clarity, request lifecycle control, and secure multi-user interaction.


🔐 Authentication & User Lifecycle
Authentication

JWT-based token authentication

Invalid tokens stop execution before reaching business logic

Protected routes using middleware

User Account Workflow

User registration with email verification

Email verification token handling

Secure password reset via email

Token-based password reset validation

Environment-based configuration for secrets and credentials


📧 Email Integration (Nodemailer)

Integrated SMTP-based email handling for:

Account creation confirmation

Email verification

Password reset workflow

Email credentials are securely managed via environment variables.
Email operations are handled asynchronously to prevent blocking request execution.


🧠 Core Engineering Highlights

Layered middleware execution
(Auth → Permission → Validation → Upload → Controller)

Centralized async error handling

Structured API response wrapper

MongoDB relational referencing
(Project ↔ Task ↔ Subtask ↔ User)

Multer-based file upload control

Defensive database validation before mutations

Clean separation of concerns

Environment-based configuration management


📦 Features
Project Management

Create and manage projects

Access validation for project-level resources

Task Management

Create tasks within projects

Assign tasks to users

Update task details

Delete tasks

Fetch tasks by ID or project

Subtask Management

Create subtasks under tasks

Update subtask title

Delete subtasks

Track completion status

File Upload Support

Multer-based upload middleware

Authentication-aware upload control

Controlled access to uploaded files

Email-Based Workflows

Account verification

Password reset mechanism

Secure token-based email actions


🔄 Designed Request Lifecycle

Route is hit

JWT verification

Permission validation

Input validation

File upload handling (if applicable)

Controller execution

Email trigger (if required)

Structured API response

Any failure halts execution immediately with a controlled error response.


🛠️ Tech Stack

Node.js

Express.js

MongoDB

Mongoose

JSON Web Token (JWT)

Multer

Nodemailer


🛡️ Security & Stability Practices

Environment variables for secrets and SMTP credentials

Centralized error handling

Async handler to prevent unhandled promise rejections

Access control at middleware level

Defensive checks before database mutations


🎯 What This Project Demonstrates

Understanding of Express request lifecycle

Middleware chaining control

Secure authentication & authorization

Email-based account workflows

MongoDB relationship modeling

Production-oriented backend structuring


👨‍💻 Author

Soumyajit Baul
Backend Developer | Focused on building structured and scalable backend systems