# Deploy to Vercel

This project is a static website, so it can be deployed directly on Vercel.

## Steps

1. Push the project to GitHub.
2. Open https://vercel.com and sign in.
3. Click "Add New..." > "Project".
4. Import the GitHub repository.
5. Choose the repository root as the project root.
6. Leave the default build settings as-is.
   - Framework Preset: Other / Static
   - Build Command: leave empty
   - Output Directory: .
7. Click "Deploy".

## Notes

- The site uses static HTML, CSS, and JavaScript files.
- Vercel will serve the root files directly, including index.html, login.html, and admin.html.
- If you want custom routes, you can add them later with rewrites, but the current setup is already compatible with Vercel.

## Local preview

You can preview the site locally by opening the project folder in a browser, or by running a simple static server.

Example with Python:

```bash
python -m http.server 8000
```

Then open http://localhost:8000
