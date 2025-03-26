const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');

async function buildSite() {
    const contentDir = path.join(__dirname, '../src/content');
    const publicDir = path.join(__dirname, '../public');
    const templatePath = path.join(__dirname, '../src/templates/layout.html');
    
    // Read template
    const template = await fs.readFile(templatePath, 'utf-8');
    
    // Ensure public directory exists
    await fs.mkdir(publicDir, { recursive: true });
    
    // Copy CSS
    await copyStyles();
    
    // Process pages and posts
    await processDirectory(path.join(contentDir, 'pages'), 'pages', template);
    await processDirectory(path.join(contentDir, 'posts'), 'posts', template);
}

async function processDirectory(dirPath, type, template) {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
            const htmlContent = marked.parse(content);
            
            // Simple template replacement
            const title = file.replace('.md', '').replace(/-/g, ' ');
            const finalHtml = template
                .replace('{{title}}', title)
                .replace('{{content}}', htmlContent);
            
            const outputPath = path.join(
                __dirname, 
                '../public',
                type,
                file.replace('.md', '.html')
            );
            
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, finalHtml);
        }
    }
}

async function copyStyles() {
    const srcStylesDir = path.join(__dirname, '../src/styles');
    const publicStylesDir = path.join(__dirname, '../public/styles');
    
    await fs.mkdir(publicStylesDir, { recursive: true });
    await fs.copyFile(
        path.join(srcStylesDir, 'main.css'),
        path.join(publicStylesDir, 'main.css')
    );
}

buildSite().catch(console.error); 