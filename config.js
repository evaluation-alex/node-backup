var config = {
	frequency: "00 00 01 * * *",
	paths: [
		"c:\\importantfiles"
	],
	s3: {
		id: "MY_ACCESS_ID",
		key: "MY_ACCESS_SECRET_KEY",
		bucket: "MY_BUCKET_NAME"
	}
};

module.exports = config;
