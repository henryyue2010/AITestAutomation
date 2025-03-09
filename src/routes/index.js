import express from 'express';
const router = express.Router();

import videoConversionTestRouter from './videoConversionRoute.js';

// Setup routes
router.use('/videoConversion', videoConversionTestRouter);

export default router;