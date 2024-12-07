const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Đăng ký người dùng mới
router.post("/register", userController.register);

// Đăng nhập người dùng
router.post("/login", userController.login);

// Đăng nhập bằng Google
router.post("/google", userController.googleLogin);

// Quên mật khẩu (gửi mã xác thực qua email)
router.post("/forgot-password", userController.forgotPassword);

// Gửi mã OTP qua email
router.post("/send-verification-code", userController.sendVerificationCode);

// Xác thực mã OTP
router.post("/verify-code", userController.verifyCode);

// Lấy thông tin người dùng
router.get("/:id", userController.getUser);

// Cập nhật thông tin người dùng
router.put("/:id", userController.updateUser);

// Xóa người dùng
router.delete("/:id", userController.deleteUser);

module.exports = router;
