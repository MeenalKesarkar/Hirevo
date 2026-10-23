import { Schema, model, Types } from "mongoose";

export interface PostRecord {
  author: Types.ObjectId;
  text: string;
  imageData?: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<PostRecord>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 2_000 },
    imageData: { type: String, maxlength: 1_100_000 },
  },
  { timestamps: true },
);

export const Post = model<PostRecord>("Post", postSchema);
