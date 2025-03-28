const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const Handlebars = require('handlebars');

const baseUrl = process.env.NODE_ENV === 'production' 
  ? '/static-site2'
  : '';

async function buildSite() {
    try {
        console.log('Building for:', process.env.NODE_ENV);
        console.log('Using baseUrl:', baseUrl);

        const contentDir = path.join(__dirname, '../src/content');
        const publicDir = path.join(__dirname, '../public');
        
        // Ensure public directory exists
        await fs.mkdir(publicDir, { recursive: true });
        
        // Copy static assets
        await copyStyles();
        await copyImages();
        
        // Process index page
        await processIndex(null, publicDir);
        
        // Add verification step
        await verifyBuild();
        
        console.log('Site built successfully!');
    } catch (error) {
        console.error('Error building site:', error);
        throw error;
    }
}

async function processIndex(indexPath, publicDir) {
    try {
        const indexTemplate = Handlebars.compile(await fs.readFile(
            path.join(__dirname, '../src/templates/index.html'),
            'utf-8'
        ));
        
        const finalHtml = indexTemplate({
            baseUrl: baseUrl
        });
        
        await fs.writeFile(path.join(publicDir, 'index.html'), finalHtml);
        
        const written = await fs.readFile(path.join(publicDir, 'index.html'), 'utf-8');
        console.log('Verified baseUrl in generated HTML:', written.includes(baseUrl));
    } catch (error) {
        console.error('Error processing index:', error);
        throw error;
    }
}

async function processDirectory(dirPath, type, template, excludeFiles = []) {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
        if (path.extname(file) === '.md' && !excludeFiles.includes(file)) {
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
    try {
        const srcStylesDir = path.join(__dirname, '../src/styles');
        const publicStylesDir = path.join(__dirname, '../public/styles');
        
        // Create styles directory if it doesn't exist
        await fs.mkdir(publicStylesDir, { recursive: true });
        
        // Copy CSS file
        await fs.copyFile(
            path.join(srcStylesDir, 'main.css'),
            path.join(publicStylesDir, 'main.css')
        );
        
        console.log('Styles copied successfully');
    } catch (error) {
        console.error('Error copying styles:', error);
        throw error;
    }
}

async function copyImages() {
    const srcImagesDir = path.join(__dirname, '../src/images');
    const publicImagesDir = path.join(__dirname, '../public/images');
    
    try {
        // Create images directory if it doesn't exist
        await fs.mkdir(publicImagesDir, { recursive: true });
        
        // Log directories for debugging
        console.log('Source images directory:', srcImagesDir);
        console.log('Public images directory:', publicImagesDir);
        
        // Get all files from source images directory
        const files = await fs.readdir(srcImagesDir);
        console.log('Found image files:', files);
        
        // Copy each file
        for (const file of files) {
            const srcPath = path.join(srcImagesDir, file);
            const destPath = path.join(publicImagesDir, file);
            await fs.copyFile(srcPath, destPath);
            console.log(`Copied image from ${srcPath} to ${destPath}`);
        }
    } catch (error) {
        console.error('Error copying images:', error);
        throw error;
    }
}

async function verifyBuild() {
    try {
        const publicDir = path.join(__dirname, '../public');
        
        // Read and verify index.html
        const indexHtml = await fs.readFile(path.join(publicDir, 'index.html'), 'utf-8');
        console.log('\nVerifying build...');
        console.log('1. Checking image paths:');
        console.log('- Logo path:', indexHtml.includes('/static-site2/images/logo.svg'));
        
        // Verify image file exists
        const logoExists = await fs.access(path.join(publicDir, 'images/logo.svg'))
            .then(() => true)
            .catch(() => false);
        console.log('2. Checking files:');
        console.log('- Logo file exists:', logoExists);
        
        // Check all asset paths
        const assetPaths = indexHtml.match(/src="[^"]*"|href="[^"]*"/g) || [];
        console.log('3. All asset paths:');
        assetPaths.forEach(path => {
            console.log('-', path);
        });

    } catch (error) {
        console.error('Verification failed:', error);
        throw error;
    }
}

buildSite().catch(console.error); 