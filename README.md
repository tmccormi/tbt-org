# Tomorrow's Bread Today Website

This repository contains the source for the Tomorrow's Bread Today website. It is a lightweight static site generated with [Eleventy](https://www.11ty.dev/) so content can be maintained in Markdown while sharing a consistent layout and footer across every page.

## Project Structure

```
pages/                # Markdown and Nunjucks content for each page
  blog/               # Blog index and posts
  admin/              # Secure tools such as the comment moderation console
assets/
  images/             # Place shared site imagery here
  documents/          # Upload downloadable PDFs and reference files
  js/                 # Front-end scripts passed through to the built site
layouts/              # Shared layouts and partials for the site
data/                 # Global Eleventy data files
functions/            # Firebase Cloud Functions source code
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
   set ELEVENTY_PATH_PREFIX=/tbt-org/
   npm run build
   ```

## Commenting system & Firebase setup

Blog posts can opt into reader comments (`enableComments: true`) which are stored in Firebase. The comment form and moderation
dashboard require a configured Firebase project, Cloud Functions, and Google reCAPTCHA keys.

### 1. Configure Firebase

1. Create a Firebase project (https://console.firebase.google.com/) and add a **Web app**. Copy the web configuration values—they
   map to the `FIREBASE_*` environment variables listed below.
2. In **Build → Authentication → Sign-in method**, enable **Google** as a provider.
3. In **Build → Firestore Database**, create a database in **Production mode** (native mode).
4. Create a `functions/moderators.json` entry or set the `ALLOWED_MODERATORS` environment variable with the Google email
   addresses that should moderate comments.

### 2. Generate reCAPTCHA keys

1. Visit https://www.google.com/recaptcha/admin/create and generate site/secret keys (reCAPTCHA v2 Checkbox works for the public
   form; the admin dashboard uses the same key in invisible mode).
2. Store the site key in `RECAPTCHA_SITE_KEY` for Eleventy builds and the secret in `RECAPTCHA_SECRET_KEY` (or set
   `firebase functions:config:set recaptcha.secret=YOUR_SECRET` so Cloud Functions can read it).

### 3. Environment variables

Set the following variables before running `npm run serve`/`npm run build`. You can export them in your shell or create a `.env`
file and load it with a tool such as [`dotenv-cli`](https://www.npmjs.com/package/dotenv-cli).

| Variable | Description |
| --- | --- |
| `FIREBASE_API_KEY` | Web API key from the Firebase console. |
| `FIREBASE_AUTH_DOMAIN` | Auth domain for the project (usually `PROJECT.firebaseapp.com`). |
| `FIREBASE_PROJECT_ID` | Firebase project ID. |
| `FIREBASE_STORAGE_BUCKET` | Optional storage bucket name. |
| `FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID from the Firebase config. |
| `FIREBASE_APP_ID` | Web app ID from Firebase. |
| `FIREBASE_FUNCTIONS_REGION` | Cloud Functions region (defaults to `us-central1` if omitted). |
| `RECAPTCHA_SITE_KEY` | Public reCAPTCHA site key for the comment form. |
| `RECAPTCHA_SECRET_KEY` | (Functions) reCAPTCHA secret if not using `functions.config().recaptcha.secret`. |
| `ALLOWED_MODERATORS` | Comma-separated list of moderator Google emails (overrides `functions/moderators.json`). |

Cloud Functions additionally require access to the reCAPTCHA secret (set `RECAPTCHA_SECRET_KEY` in the deployment environment or
`firebase functions:config:set recaptcha.secret=...`). For local testing with emulators you can set:

```
export FIREBASE_EMULATOR_FIRESTORE=localhost:8081
export FIREBASE_EMULATOR_FUNCTIONS=localhost:5001
```

### 4. Deploy Cloud Functions

1. Install the Firebase CLI and authenticate: `npm install -g firebase-tools` then `firebase login`.
2. From the `functions/` directory run `npm install` to install dependencies.
3. Ensure the correct project is selected (`firebase use --add`).
4. Deploy the callable functions: `firebase deploy --only functions`.

Once deployed, the public blog post form will call `submitComment`, and the moderation dashboard at `/admin/comments/` will use
`moderateComment` to approve or reject submissions after verifying reCAPTCHA tokens server-side.

## Deploying to GitHub Pages

GitHub Pages can publish the contents of the `docs/` directory. To deploy:

1. Run `npm run build` to regenerate `docs/` after editing Markdown files.
2. Commit the updated source files and the `docs/` output directory.
3. Push to the `main` branch and enable GitHub Pages in the repository settings, choosing **Deploy from a branch** → `main` branch → `/docs` folder.

Every time you update content and rebuild, push the new commit and GitHub Pages will serve the refreshed site automatically.

Base URL: https://github.com/tmccormi/tbt-org
