import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole } from "@/lib/types/user-roles";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  roles: {
    type: [String],
    enum: Object.values(UserRole),
    required: [true, "At least one role is required"],
    default: [UserRole.BD],
    validate: {
      validator: function (roles: string[]) {
        return roles && roles.length > 0;
      },
      message: "User must have at least one role",
    },
  },
  company: {
    type: String,
    trim: true,
    default: "",
  },
  phone: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre("save", async function (next) {
  this.updatedAt = new Date();

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has a specific role
userSchema.methods.hasRole = function (role: UserRole): boolean {
  return this.roles && this.roles.includes(role);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
