// Configuration
const config = {
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-reasoner',
    baseURL: 'https://api.deepseek.com/v1'
  },
  website: 'https://video-converter.com',
  testFilesDir: './test-files/',
  screenshotsDir: './test-screen-shots/',
  reportDir: './test-reports/',
  reportFile: './test-reports/test-report.json'
};

export default config;
