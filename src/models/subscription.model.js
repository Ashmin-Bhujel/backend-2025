import mongoose from "mongoose";

const subcriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    channel: {
      type: mongoose.SchemaType.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subcription", subcriptionSchema);
