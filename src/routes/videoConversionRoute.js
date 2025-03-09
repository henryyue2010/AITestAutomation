import express from 'express';
const router = express.Router();
import * as videoConversionTestController from '../controllers/videoConversionController.js';

router.get('/run/test', videoConversionTestController.runTest);

export default router;