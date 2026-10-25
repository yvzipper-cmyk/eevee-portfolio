# Eevee Portfolio — GitHub setup

This is the full source for the latest version of Eevee's single-page portfolio, with the Research and Alpine title visibility fixes.

## Files
- `index.html`: website entry point
- `styles.css`, `cinematic.css`: styles and motion
- `app.js`, `gallery-data.js`: navigation, animation, image gallery and video interactions
- `assets/`: all portfolio images
- `research-presentation.pdf`: original research slide deck (retained as a source asset, not linked on the page)

## Upload using GitHub Desktop
1. On github.com create a **private** repository named `eevee-portfolio` with no README or initial files.
2. In GitHub Desktop select **File > Clone repository**, clone the newly created repository.
3. Copy the **contents** of this extracted folder into the local repository directory (not the containing folder itself).
4. Commit with message `Initial Eevee portfolio website` and push to origin.

## Deployment via Netlify
1. On Netlify, choose **Add new project > Import an existing project > GitHub**.
2. Select the GitHub repository; no build command is required, and the publish directory is the repository root (`.`).
3. Verify YouTube embeds and mobile layout after deploying.

## Privacy
The website includes student portraits and activity photos. Get the owner's permission before making the GitHub repository public.
