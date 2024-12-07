const mongoose = require("mongoose");
const validator = require("validator");
const userSchema = new mongoose.Schema(
  {
    
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Chuyển email thành chữ thường
      validate: {
        validator: (value) => validator.isEmail(value), // Kiểm tra định dạng email hợp lệ
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: function () {
        // Nếu `authProvider` là 'local', mật khẩu là bắt buộc
        return this.authProvider === 'local';
      },
      minlength: [6, "Password must be at least 6 characters long"], // Đảm bảo mật khẩu đủ dài
      sparse: true, // Cho phép null khi đăng nhập bằng Google
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      sparse: true, // Cho phép null khi đăng ký thuần
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'], // Chỉ cho phép 2 giá trị này
      default: 'local', // Mặc định là đăng ký thuần
    },
    verified: {
      type: Boolean,
      default: false, // Mặc định là chưa xác minh
    },
  },
  { timestamps: true }
);

// Tạo chỉ mục cho email để tăng hiệu suất tìm kiếm
userSchema.index({ email: 1 }, { unique: true });

// Trả về thông tin người dùng mà không có mật khẩu
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Xóa mật khẩu khi trả về thông tin người dùng
  return user;
};

const potholeSchema = new mongoose.Schema(
  {
    location: {
      type: { type: String, default: "Point" }, // Type of geography (e.g., "Point")
      coordinates: { type: [Number], required: true }, // Longitude and latitude
    },
    image: { type: String }, // Image URL of the pothole (optional)
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Link to the User model
      required: true, // Make sure this field is required
    },
    dateDetected: { type: Date, default: Date.now }, // Date when the pothole was reported (auto-set to current date)
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Define models
let Pothole = mongoose.model("Pothole", potholeSchema);
let User = mongoose.model("User", userSchema);

// Export both models
module.exports = { Pothole, User };
