// uploadRoutes.js
const express = require('express');
const upload = require('../models/upload');
const router = express.Router();

// 状态码
const HTTP_STATUS_CODES = require('../utils/httpStatusCodes');
const { BAD_REQUEST } = HTTP_STATUS_CODES;

router.post('/', upload.array('files', 10), (req, res) => {
	if (req.files) {
		res.json({
			success: true,
			files: req.files,
			urls: req.files.map(
				(file) => `/uploads/${req.query.category}/${file.filename}`,
			),
		});
	} else {
		res.status(BAD_REQUEST).json({ success: false, message: '上传失败' });
	}
});

module.exports = router;
