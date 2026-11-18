'use strict';

const app = require('./app');
const logger = require('./logger');

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => logger.info({ port }, 'TP4 API demarree'));
