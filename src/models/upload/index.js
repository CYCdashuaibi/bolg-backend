// upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 根据传入的 category 决定文件存储的文件夹
const getDestinationFolder = (category) => {
	return path.join(__dirname, `../../../uploads/${category || 'default'}`);
};

// 确保目录存在
const ensureDirExists = (dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
};

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const category = req.query.category;
		const folder = getDestinationFolder(category);
		ensureDirExists(folder);
		cb(null, folder);
	},
	filename: (req, file, cb) => {
		// 将原始文件名从 latin1 转换为 utf8，防止中文乱码
		const originalName = Buffer.from(file.originalname, 'latin1').toString(
			'utf8',
		);
		cb(null, Date.now() + '-' + originalName);
	},
});

const upload = multer({ storage });

module.exports = upload;
