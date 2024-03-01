const cors = require('cors');

const getApplicationAllowedOrigins = () => {
	const env = process.env.NODE_ENV;
	switch (env) {
		case 'production':
			return [
				'https://grat.dev',
			];

		case 'development':
			return [
				'http://localhost:3000',
				'http://localhost:3300',
				'https://grat.dev',
			];
	}
};

const corsOptions = {
	origin: getApplicationAllowedOrigins(),
	methods: ['PUT', 'GET', 'POST', 'OPTIONS', 'DELETE'],
	optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
