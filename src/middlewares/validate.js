const { validationResult } = require('express-validator');

const validate = (validations) => {
	return async (req, res, next) => {
		await Promise.all(validations.map((validation) => validation.run(req)));

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res
				.status(400)
				.json({ message: '输入验证失败', errors: errors.array(), success: false, validate: false });
		}

		next();
	};
};

module.exports = validate;
