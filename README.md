# Tomorrow's Bread Today Website

This repository contains the source for the Tomorrow's Bread Today website. It is a lightweight static site generated with [Eleventy](https://www.11ty.dev/) so content can be maintained in Markdown while sharing a consistent layout and footer across every page.

## Project Structure

```
pages/                # Markdown and Nunjucks content for each page
  blog/               # Blog index and posts
assets/
  images/             # Place shared site imagery here
  documents/          # Upload downloadable PDFs and reference files
layouts/              # Shared layouts and partials for the site
data/                 # Global Eleventy data files
docs/                 # Generated site output served by GitHub Pages
```

## Updating an existing Page
1. Browse to the file inside `pages/` (for example `survice-providers.md`).
2. Click the Edit (pencil icon).
3. Edit the page.
4. Click "Commit Changes" and add a comment on what changed.

## Adding a New Page

1. Create a new "branch" to hold your changes.
2. Create a Markdown file inside `pages/` (for example `pages/your-page.md`). Include front matter so Eleventy can set the
   title and layout:

   ```markdown
   ---
   title: Your Page Title
   layout: base.njk
   ---

   Your page content written in Markdown.
   ```

3. Update the navigation menu in `layouts/base.njk`. The header template contains a hard-coded `<ul>` list—add a new `<li>` with
   the link to your page (Eleventy will output `/your-page/`).
4. Create a Pull Request for review to be merged into the main site.

## FOR THE DEVELOPER ONLY

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the local development server with live reload:

   ```bash
   npm run serve
   ```

   The site will be available at http://localhost:8080/.

3. Build the production-ready site into the `docs/` folder:

   ```bash
   npm run build
   ```

## Deploying to GitHub Pages

GitHub Pages can publish the contents of the `docs/` directory. To deploy:

1. Run `npm run build` to regenerate `docs/` after editing Markdown files.
2. Commit the updated source files and the `docs/` output directory.
3. Push to the `main` branch and enable GitHub Pages in the repository settings, choosing **Deploy from a branch** → `main` branch → `/docs` folder.

Every time you update content and rebuild, push the new commit and GitHub Pages will serve the refreshed site automatically.

Base URL: https://github.com/tmccormi/tbt-org
