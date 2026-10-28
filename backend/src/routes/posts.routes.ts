import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postsRouter = Router();
postsRouter.use(requireAuth);

const postSchema = z.object({
  text: z.string().trim().min(1).max(2_000),
  imageData: z.string()
    .max(1_100_000)
    .regex(/^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/, "Post image must be a valid base64 image.")
    .optional(),
});

postsRouter.get("/", asyncHandler(async (_request, response) => {
  const posts = await Post.find().sort({ createdAt: -1 }).limit(50).populate("author", "name role").lean();
  response.json({ posts });
}));

postsRouter.get("/mine", asyncHandler(async (request, response) => {
  const posts = await Post.find({ author: request.auth!.userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("author", "name role")
    .lean();
  response.json({ posts });
}));

postsRouter.post("/", asyncHandler(async (request, response) => {
  const input = postSchema.parse(request.body);
  const post = await Post.create({ ...input, author: request.auth!.userId });
  await post.populate("author", "name role");
  response.status(201).json({ post });
}));

postsRouter.delete("/:postId", asyncHandler(async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.postId)) {
    response.status(400).json({ error: "Post identifier is invalid." });
    return;
  }

  const post = await Post.findById(request.params.postId);
  if (!post) {
    response.status(404).json({ error: "Post not found." });
    return;
  }
  if (request.auth!.role !== "admin" && post.author.toString() !== request.auth!.userId) {
    response.status(403).json({ error: "You can only delete your own posts." });
    return;
  }

  await post.deleteOne();
  response.status(204).end();
}));
