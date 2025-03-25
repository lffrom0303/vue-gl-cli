#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProject } from '../lib/create.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .version('1.0.0')
  .description('Vue 3D Library Project Generator CLI');

program
  .command('create <project-name>')
  .description('create a new project')
  .action(async (projectName) => {
    const questions = [
      {
        type: 'list',
        name: 'template',
        message: 'Which 3D library template would you like to use?',
        choices: [
          { name: 'AMap (高德地图)', value: 'amap' },
          { name: 'BMap (百度地图)', value: 'bmap' },
          { name: 'Cesium', value: 'cesium' },
          { name: 'ArcGIS', value: 'arcgis' },
          { name: 'OpenLayers', value: 'openlayers' },
          { name: 'Three.js', value: 'threejs' }
        ]
      }
    ];

    try {
      const answers = await inquirer.prompt(questions);
      await createProject(projectName, answers.template);
    } catch (error) {
      console.error(chalk.red('Error: '), error);
      process.exit(1);
    }
  });

program.parse(process.argv); 