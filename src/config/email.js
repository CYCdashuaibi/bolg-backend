const nodemailer = require('nodemailer');
require('dotenv').config();

// 修改邮件服务配置为QQ邮箱
const transporter = nodemailer.createTransport({
	host: 'smtp.qq.com', // QQ邮箱的SMTP服务器地址
	port: process.env.EMAIL_PORT, // SMTP服务使用的端口，QQ邮箱通常使用465
	secure: true, // 开启安全连接
	auth: {
		user: process.env.EMAIL_USER, // 你的QQ邮箱
		pass: process.env.EMAIL_PASS, // 你的QQ邮箱SMTP授权码
	},
});

const sendEmail = async (to, subject, text) => {
	try {
		await transporter.sendMail({
			from: `"cyc" <${process.env.EMAIL_USER}>`, // 设置发件人名称和邮箱
			to,
			subject,
			text,
		});
		return true;
	} catch (error) {
		console.error('❌ 发送邮件失败：', error);
		return false;
	}
};

module.exports = sendEmail;
