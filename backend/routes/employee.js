const express = require('express');
const router = express.Router();
const employeeService = require('../services/employeeService');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// 従業員一覧取得（管理者のみ）
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
});

// 従業員登録（管理者のみ）
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

// 従業員詳細取得
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

// 従業員更新（管理者のみ）
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

// 従業員削除（管理者のみ）
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    res.json({ success: true, message: '削除が完了しました' });
  } catch (error) {
    next(error);
  }
});

// ロール変更（管理者のみ）
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await employeeService.updateRole(req.params.id, req.body.role);
    res.json({ success: true, message: 'ロールを変更しました' });
  } catch (error) {
    next(error);
  }
});

// カラーランダム変更
router.post('/color/random', requireAuth, async (req, res, next) => {
  try {
    const employee = await employeeService.updateColorRandom(req.session.employeeId);
    req.session.color = employee.color;
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

// カラー変更（指定）
router.patch('/:id/color', requireAuth, async (req, res, next) => {
  try {
    const { color } = req.body;

    // 自分のカラーのみ変更可能
    if (req.params.id !== req.session.employeeId) {
      return res.status(403).json({
        success: false,
        error: '権限がありません'
      });
    }

    if (!color || !/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({
        success: false,
        error: '有効なカラーコードを指定してください'
      });
    }

    const employee = await employeeService.updateColor(req.params.id, color);
    req.session.color = employee.color;
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
