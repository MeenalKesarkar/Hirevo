import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: "Validation failed.", details: error.issues });
    return;
  }
  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({ error: "The submitted data is invalid." });
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    response.status(400).json({ error: "A supplied identifier is invalid." });
    return;
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    response.status(409).json({ error: "A record with that value already exists." });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "An unexpected server error occurred." });
};
