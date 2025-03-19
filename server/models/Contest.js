const mongoose = require("mongoose");

const ContestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  platform: { type: String, required: true, enum: ["Codeforces", "CodeChef", "Leetcode"] },
  date: { type: Date, required: true },
  link: { type: String, required: true },
  youtubeLink: { type: String },
  duration: { type: Number },
  bookmarked: { type: Boolean, default: false },
  // Add a virtual field for status calculation
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for contest status
ContestSchema.virtual('status').get(function() {
  const now = new Date();
  const contestDate = this.date;
  const endDate = new Date(contestDate.getTime() + (this.duration * 1000));
  
  if (now < contestDate) {
    return "upcoming";
  } else if (now >= contestDate && now <= endDate) {
    return "ongoing";
  } else {
    return "past";
  }
});

module.exports = mongoose.model("Contest", ContestSchema);