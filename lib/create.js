import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a new project based on the selected template
 * @param {string} projectName - The name of the project
 * @param {string} template - The template to use (amap, bmap, cesium, arcgis, openlayers, threejs)
 */
export async function createProject(projectName, template) {
  const spinner = ora('Creating project...').start();
  
  try {
    const targetDir = path.resolve(process.cwd(), projectName);
    const templateDir = path.resolve(__dirname, `../templates/${template}`);

    // Check if project directory already exists
    if (fs.existsSync(targetDir)) {
      spinner.fail(chalk.red(`Project directory ${projectName} already exists.`));
      process.exit(1);
    }

    // Check if template exists
    if (!fs.existsSync(templateDir)) {
      spinner.fail(chalk.red(`Template ${template} not found.`));
      process.exit(1);
    }

    // Create project directory
    await fs.mkdir(targetDir);

    // Copy template to target directory
    await fs.copy(templateDir, targetDir);

    // Modify package.json
    const pkgPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      pkg.name = projectName;
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    }

    // Create .gitignore if it doesn't exist
    const gitignorePath = path.join(targetDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      const gitignoreContent = `node_modules/
.DS_Store
dist/
dist-ssr/
*.local
.env
.env.*
!.env.example

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`;
      await fs.writeFile(gitignorePath, gitignoreContent);
    }

    spinner.succeed(chalk.green(`Successfully created project ${projectName}`));
    
    // Print next steps
    console.log('\nNext steps:');
    console.log(chalk.cyan(`\n  cd ${projectName}`));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  npm run dev\n'));

    // Print template-specific instructions
    switch (template) {
      case 'amap':
        console.log(chalk.yellow('Note: You need to add your AMap API key in the .env file'));
        break;
      case 'bmap':
        console.log(chalk.yellow('Note: You need to add your BMap API key in the .env file'));
        break;
      case 'arcgis':
        console.log(chalk.yellow('Note: You need to add your ArcGIS API key in the .env file'));
        break;
      default:
        break;
    }

  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(error);
    process.exit(1);
  }
} 