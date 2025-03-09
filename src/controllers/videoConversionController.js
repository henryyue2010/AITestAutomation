import videoConverterService from '../services/videoConversionService.js';

export const runTest = async (req, res) => {
    try {
      const testResult = await videoConverterService.runTest({id: 'youtube-conversion-001'})
      res.json(testResult);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };