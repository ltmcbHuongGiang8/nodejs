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



module.exports = router;
