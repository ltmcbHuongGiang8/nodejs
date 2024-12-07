const { User } = require("../model/model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const validator = require("validator");
const Verification = require("../model/Verification"); // Đảm bảo bạn có schema Verification để lưu mã OTP
require('dotenv').config();  // Make sure this is at the top of your app entry point

const userController = {
  
  // Register a new user
  register: async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if required fields are provided
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Please provide all required fields" });
      }

      // Check if the email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json("Email already exists");
      }

      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        authProvider: "local",
        verified: false,
      });

      await newUser.save();

      // Send verification code
      await userController.sendVerificationCode({ body: { email } }, res);

    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // Forgot password (sends verification code)
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json("User not found");

      // Send verification code
      await userController.sendVerificationCode({ body: { email } }, res);

    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // Send Verification Code
  sendVerificationCode: async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json("User not found");
      }

      // Create OTP and save it to MongoDB with expiration time
      const verificationCode = crypto.randomInt(100000, 999999);
      await Verification.create({
        email,
        code: verificationCode,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      });

      // Configure transporter and send email via Nodemailer
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },

        
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Xác nhận mã OTP",
        text: `Mã xác thực của bạn là: ${verificationCode}`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json("Đã gửi mã xác thực qua email.");
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // Verify OTP
  verifyCode: async (req, res) => {
    try {
      const { email, code } = req.body;

      const verification = await Verification.findOne({ email, code });
      if (!verification || verification.expiresAt < Date.now()) {
        return res.status(400).json("Invalid or expired verification code");
      }

      // Update user verified status and delete OTP
      await User.findOneAndUpdate({ email }, { verified: true });
      await Verification.deleteOne({ email });

      res.status(200).json("Email verified successfully");
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // User login with email and password
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json("Email and password are required");
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json("User not found");
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json("Wrong password");
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      const { password: _, ...otherUserDetails } = user._doc;

      res.status(200).json({ token, user: otherUserDetails });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { email, firstName, lastName, authProvider } = req.body; // Nhận dữ liệu từ Android
  
      if (!email || !firstName || !lastName || !authProvider) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields" 
        });
      }
  
      // Kiểm tra xem người dùng đã có trong cơ sở dữ liệu chưa
      let user = await User.findOne({ email });
  
      if (user) {
        // Nếu người dùng đã tồn tại, cập nhật authProvider thành "google"
        user.authProvider = "google";
        await user.save();
  
        return res.status(200).json({
          success: true,
          message: "User updated successfully",
          user: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            authProvider: user.authProvider,
          },
        });
      } else {
        // Nếu người dùng chưa tồn tại, tạo mới người dùng
        user = new User({
          email,
          firstName,
          lastName,
          authProvider,
        });
        await user.save();
  
        return res.status(201).json({
          success: true,
          message: "User created successfully",
          user: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            authProvider: user.authProvider,
          },
        });
      }
    } catch (err) {
      // Nếu có lỗi, trả về lỗi với mã trạng thái 500
      console.error("Error during Google login:", err);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: err.message,
      });
    }
  },
  

  // Update user information
  updateUser: async (req, res) => {
    try {
      if (req.body.userId !== req.params.id) {
        return res.status(403).json("You can only update your own account");
      }

      const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      if (req.body.userId !== req.params.id) {
        return res.status(403).json("You can only delete your own account");
      }

      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("User has been deleted");
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
};

module.exports = userController;
