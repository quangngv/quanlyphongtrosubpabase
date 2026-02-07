const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../supabase');
const { authMiddleware } = require('../middleware/auth-supabase');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || '8331fd33-49e9-40f6-9078-04f8ac234d86';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập và mật khẩu'
      });
    }

    // Find admin by username
    let { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    // If no admin exists and credentials match default, create default admin
    if (error || !admin) {
      const defaultUsername = process.env.ADMIN_USERNAME || 'thanhnam';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'thanhtrung';

      if (username === defaultUsername && password === defaultPassword) {
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        
        const { data: newAdmin, error: createError } = await supabase
          .from('admins')
          .insert({
            username: defaultUsername,
            password: hashedPassword,
            name: 'Bà Tuất',
            email: 'batuat@example.com',
            phone: '0123456789',
            address: 'Hà Nội, Việt Nam'
          })
          .select()
          .single();

        if (createError) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi tạo tài khoản mặc định'
          });
        }
        admin = newAdmin;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }
    } else {
      // Verify password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...adminData } = admin;

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: adminData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  const { password, ...adminData } = req.admin;
  res.json({
    success: true,
    data: adminData
  });
});

// Update profile
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;

    const { data: admin, error } = await supabase
      .from('admins')
      .update({ name, email, phone, address })
      .eq('id', req.adminId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const { password, ...adminData } = admin;

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: adminData
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, req.admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const { error } = await supabase
      .from('admins')
      .update({ password: hashedPassword })
      .eq('id', req.adminId);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token removal)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

module.exports = router;
