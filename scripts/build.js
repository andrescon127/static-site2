const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const Handlebars = require('handlebars');

async function buildSite() {
    try {
        const contentDir = path.join(__dirname, '../src/content');
        const publicDir = path.join(__dirname, '../public');
        
        // Ensure public directory exists
        await fs.mkdir(publicDir, { recursive: true });
        
        // Copy static assets
        await copyStyles();
        await copyImages();
        
        // Build pages
        await buildPages();
        
        // Build blog
        await buildBlog();
        
        console.log('Site built successfully!');
    } catch (error) {
        console.error('Error building site:', error);
        throw error;
    }
}

async function buildPages() {
    const pagesDir = path.join(__dirname, '../src/content/pages');
    const publicDir = path.join(__dirname, '../public');
    const templateDir = path.join(__dirname, '../src/templates');

    // Read available templates
    const templates = {
        page: await fs.readFile(path.join(templateDir, 'page.html'), 'utf-8'),
        blog: await fs.readFile(path.join(templateDir, 'blog-post.html'), 'utf-8')
    };

    // Get all markdown files
    const files = await fs.readdir(pagesDir);
    
    for (const file of files) {
        if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(pagesDir, file), 'utf-8');
            const { data, content: markdown } = matter(content);
            const htmlContent = marked(markdown);
            
            // Skip blog posts (they're handled by buildBlog)
            if (data.template === 'blog') continue;
            
            // Get the appropriate template
            const templateName = data.template || 'page';
            const template = Handlebars.compile(templates[templateName]);
            
            // Generate the HTML
            const html = template({
                ...data,
                content: htmlContent
            });
            
            // Create the output path
            const outputPath = path.join(
                publicDir,
                file.replace('.md', '.html')
            );
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            
            // Write the file
            await fs.writeFile(outputPath, html);
            console.log(`Built page: ${file}`);
        }
    }
}

async function processIndex(indexPath, publicDir) {
    const content = await fs.readFile(indexPath, 'utf-8');
    const htmlContent = marked.parse(content);
    
    // Read the index template
    const indexTemplate = await fs.readFile(
        path.join(__dirname, '../src/templates/index.html'),
        'utf-8'
    );
    
    // Replace content in template
    const finalHtml = indexTemplate.replace('{{content}}', htmlContent);
    
    await fs.writeFile(path.join(publicDir, 'index.html'), finalHtml);
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
    const srcStylesDir = path.join(__dirname, '../src/styles');
    const publicStylesDir = path.join(__dirname, '../public/styles');
    
    await fs.mkdir(publicStylesDir, { recursive: true });
    await fs.copyFile(
        path.join(srcStylesDir, 'main.css'),
        path.join(publicStylesDir, 'main.css')
    );
}

async function copyImages() {
    const srcImagesDir = path.join(__dirname, '../src/images');
    const publicImagesDir = path.join(__dirname, '../public/images');
    
    try {
        await fs.mkdir(publicImagesDir, { recursive: true });
        const images = await fs.readdir(srcImagesDir);
        for (const image of images) {
            await fs.copyFile(
                path.join(srcImagesDir, image),
                path.join(publicImagesDir, image)
            );
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}

async function buildBlog() {
    try {
        // Create necessary directories
        await fs.mkdir('public/blog', { recursive: true });
        await fs.mkdir('public/templates', { recursive: true });
        
        console.log('Starting blog build...');

        // Default blog index template
        const defaultBlogIndex = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - Part-Time YouTuber Academy</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 5%;
            background-color: white;
        }

        .logo {
            height: 40px;
            cursor: pointer;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
        }

        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
        }

        .blog-list {
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
        }

        .page-title {
            font-size: 2.5rem;
            color: #4169e1;
            margin-bottom: 2rem;
            text-align: center;
        }

        .post-card {
            margin-bottom: 2rem;
            padding: 1.5rem;
            border: 1px solid #eee;
            border-radius: 8px;
            transition: transform 0.2s;
        }

        .post-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .post-title {
            font-size: 1.5rem;
            color: #4169e1;
            margin-bottom: 0.5rem;
        }

        .post-meta {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }

        .post-excerpt {
            color: #333;
            margin-bottom: 1rem;
        }

        .read-more {
            color: #4169e1;
            text-decoration: none;
            font-weight: 500;
        }

        .site-footer {
            background-color: #1a1a2e;
            color: white;
            padding: 4rem 1rem 1rem;
            margin-top: 4rem;
        }

        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .footer-section h3 {
            color: #4169e1;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }

        .footer-section p {
            color: #ccc;
            line-height: 1.6;
        }

        .footer-section ul {
            list-style: none;
            padding: 0;
        }

        .footer-section ul li {
            margin-bottom: 0.5rem;
        }

        .footer-section ul li a {
            color: #ccc;
            text-decoration: none;
            transition: color 0.2s;
        }

        .footer-section ul li a:hover {
            color: #4169e1;
        }

        .footer-bottom {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid #333;
            color: #888;
        }
    </style>
</head>
<body>
    <nav>
        <img src="/logo.png" alt="Part-Time YouTuber Academy Logo" class="logo">
        <div class="nav-links">
            <a href="/">Home</a>
            <a href="/blog">Blog</a>
            <a href="/academy">Academy</a>
            <a href="/login">Course Login</a>
        </div>
    </nav>

    <main class="blog-list">
        <h1 class="page-title">Blog Posts</h1>
        
        <div class="posts">
            {{#each posts}}
            <article class="post-card">
                <h2 class="post-title">{{title}}</h2>
                <div class="post-meta">
                    <time datetime="{{date}}">{{formatted_date}}</time>
                    {{#if author}} • By {{author}}{{/if}}
                </div>
                <p class="post-excerpt">{{excerpt}}</p>
                <a href="{{url}}" class="read-more">Read more →</a>
            </article>
            {{/each}}
        </div>
    </main>
    
    <footer class="site-footer">
        <div class="footer-content">
            <div class="footer-section">
                <h3>Part-Time YouTuber Academy</h3>
                <p>Helping creators build successful YouTube channels while keeping their day jobs.</p>
            </div>
            <div class="footer-section">
                <h3>Quick Links</h3>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/blog">Blog</a></li>
                    <li><a href="/academy">Academy</a></li>
                    <li><a href="/login">Course Login</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>Connect</h3>
                <ul>
                    <li><a href="https://youtube.com">YouTube</a></li>
                    <li><a href="https://twitter.com">Twitter</a></li>
                    <li><a href="https://instagram.com">Instagram</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2024 Part-Time YouTuber Academy. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;

        // Write the default blog index template
        await fs.writeFile('public/blog/index.html', defaultBlogIndex);
        console.log('Created default blog index template');

        // Read blog post template
        const blogTemplate = await fs.readFile('public/templates/blog-post.html', 'utf-8');
        console.log('Blog template loaded, length:', blogTemplate.length);
        const template = Handlebars.compile(blogTemplate);

        // Now read the blog index template we just created
        const indexTemplate = await fs.readFile('public/blog/index.html', 'utf-8');
        console.log('Index template loaded, length:', indexTemplate.length);
        const listTemplate = Handlebars.compile(indexTemplate);

        // Get all markdown files from content/pages
        const files = await fs.readdir('src/content/pages');
        console.log('Found markdown files:', files);
        
        const posts = [];
        
        // Process each markdown file
        for (const file of files) {
            if (file.endsWith('.md') && file !== 'about.md') {
                console.log('Processing:', file);
                const content = await fs.readFile(`src/content/pages/${file}`, 'utf-8');
                const { data, content: markdown } = matter(content);
                
                // Convert markdown to HTML
                const htmlContent = marked(markdown);
                
                // Create URL-friendly slug from filename
                const slug = file.replace('.md', '');
                
                // Add post metadata to posts array
                posts.push({
                    ...data,
                    url: `/blog/${slug}.html`,
                    date: data.date,
                    formatted_date: new Date(data.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                });
                
                // Generate HTML file for each post
                const html = template({
                    ...data,
                    content: htmlContent,
                    formatted_date: new Date(data.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                });
                
                const outputPath = `public/blog/${slug}.html`;
                await fs.writeFile(outputPath, html);
                console.log('Generated blog post:', outputPath);
                
                // Verify the generated file
                const verifyContent = await fs.readFile(outputPath, 'utf-8');
                console.log('Generated file length:', verifyContent.length);
                console.log('File contains footer:', verifyContent.includes('site-footer'));
            }
        }
        
        // Sort posts by date
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Generate blog index page with footer
        const indexHtml = listTemplate({ posts });
        await fs.writeFile('public/blog/index.html', indexHtml);
        console.log('Generated blog index page');
        
        // Verify the index page
        const verifyIndex = await fs.readFile('public/blog/index.html', 'utf-8');
        console.log('Index page length:', verifyIndex.length);
        console.log('Index contains footer:', verifyIndex.includes('site-footer'));
        
    } catch (error) {
        console.error('Error building blog:', error);
        throw error;
    }
}

buildSite().catch(console.error); 