import { chromium } from 'playwright';
import { test, expect } from '@playwright/test';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import config from '../config/config.js';

class VideoConverterService {

    async runTest(scenario) {

        console.log('initializing the test');

        const browser = await chromium.launch({
          downloadsPath: config.outputDir, 
          headless: true,
          timeout: 60000  // Increase default 30s timeout
        });
        
        if (!browser) {
          throw new Error('Browser launch failed');
        }
        
        const page = await browser.newPage();
        
        if (!page) {
          await cleanup(browser, page);
          throw new Error('Page creation failed');
        }

        await page.goto(config.website);
    
        let testData = {
          startTime: new Date().toISOString(),
          steps: [],
          errors: []
        };

        let stepObj = {};
        let step = 0;
        let analysis = '';
        
        try {
          
    
          await Promise.all([
            page.on('dialog', async (dialog) => {
            step = 2;
            
            //stepObj.step = 'Input URL';
            expect(dialog.message()).toEqual('Open file from URL');
            expect(dialog.type()).toBe('prompt');
            await dialog.accept('https://www.youtube.com/watch?v=5yeJ03crTrI');
            //stepObj.status = 'SUCCESS';
            await page.screenshot({ path: config.screenshotsDir + `2.png` });
            //stepObj.screenshot = config.screenshotsDir + `${step}.png`;
            
            testData.steps.push({
              step: 'Input URL',
              status: 'SUCCESS',
              screenshot: config.screenshotsDir + `2.png`
            });  
            console.log('✅ URL Submitted');
    
          }),
            await page.click('#open_link')
            .then( async () => {
              step = 1;
              //stepObj.step = 'Open link';
              //stepObj.status = 'SUCCESS';
              await page.screenshot({ path: config.screenshotsDir + `1.png` });
              //stepObj.screenshot = config.screenshotsDir + `${step}.png`;
              
              testData.steps.push({
                step: 'Open link',
                status: 'SUCCESS',
                screenshot: config.screenshotsDir + `1.png`
              });
              console.log('✅ Open link clicked');
            })
            .catch( async (error) => {
              step = 1;
              stepObj.step = 'Open link';
              stepObj.status = 'FAILED';
              await page.screenshot({ path: config.screenshotsDir + `1.png` });
              testData.steps.push({
                step: 'Open link',
                status: 'FAILED',
                screenshot: config.screenshotsDir + `1.png`,
                error: error.message
              });
              console.log('❌ not able to click open link');
              throw new Error('❌ not able to click open link');
            }),
          ]);
    
          
          step = 3;
          stepObj.step = 'Verify Selection of URL';
          await page.waitForSelector('[data-tmp_filename]', {
            state: 'visible',
            timeout: 60000
          });
          stepObj.status = 'SUCCESS';
         
              
          await page.waitForSelector('#download_box #download_file_link', {
            state: 'visible',
            timeout: 60000
          });
    
              
        } catch (error) {
    
          stepObj.status = 'FAILED';
          stepObj.error = error.message;
          
          await page.screenshot({ path: config.screenshotsDir + `${step}.png` });
          console.log('error', error.message);
          stepObj.screenshot = config.screenshotsDir + `${step}.png`;
          testData.steps.push(JSON.parse(JSON.stringify(stepObj)));
    
          const modal = await page.waitForSelector('#modal-msg', {
            state: 'visible', 
            timeout: 15000
          });
          
          let errorMessage = modal? await modal.textContent(): error.message;
          console.log('errorMessage:', errorMessage);
    
          testData.errors.push({
            message: errorMessage,
            timestamp: new Date().toISOString(),
            screenshot: config.screenshotsDir + `${step}.png`,
            logs: await page.evaluate(() => ({
              console: window.consoleLogs || [],
              network: performance.getEntriesByType('navigation')
            }))
          });
          console.log('Deepseek analyzing...');
          analysis = await this.analyzeWithDeepseek(testData);
          
          console.log('Deepseek Analysis:',analysis);          
        }
    
        let testResult = {
          testId: scenario.id,
          startTime: testData.startTime,
          endTime: new Date().toISOString(),
          steps: testData.steps || [],
          aiAnalysis: JSON.parse(analysis)
        };
    
        await this.generateReport(testResult);
        return testResult;
      }
    
    
      async generateReport(testResult) {
        fs.writeFileSync(config.reportDir + testResult.testId + `-report.json`, JSON.stringify(testResult, null, 2));
      }
    
      async analyzeWithDeepseek(testData) {
        const deepseek = new OpenAI({
            apiKey: config.deepseek.apiKey,
            baseURL: config.deepseek.baseURL
        });

        const prompt = `Analyze this video conversion test failure:
        - Error: ${testData.errors[0].message}
        - Steps Taken: ${testData.steps.join(' -> ')}
        - Console Logs: ${JSON.stringify(testData.errors[0].logs.console)}
        - Network Timing: ${JSON.stringify(testData.errors[0].logs.network)}
        
        Provide:
        1. Failure explanation in natural language
        2. Suggested Playwright code improvements
        3. Give analysis confidence number between 0 and 1
        
        Return the analysis text in following format ONLY, no text outside the JSON object:
        {
          "explanation": "",
          "recommendation": "",
          "confidence": ""
        }
        `;
      
        const response = await deepseek.chat.completions.create({
          model: 'deepseek-reasoner',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500
        });
      
        return response.choices[0].message.content;
      }
    
      async cleanup(browser, page) {
        // Close page if exists
        if (page) {
          await page.close();
          page = null;
        }
        
        // Close browser if exists
        if (browser) {
          await browser.close();
          browser = null;
        }
      }
}

export default new VideoConverterService();