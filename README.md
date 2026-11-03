# The Nature Artists

A growing bilingual archive of ecological and environmental art. English by default, with one-click Chinese translation.

**This is a public test preview.** Artwork and photography remain the property of their respective rights holders. Image permissions are pending review and are visibly marked; credits and original source links accompany the images. Inclusion does not imply affiliation or endorsement.

## Maintain the archive

Edit `content/catalog.json` for artists, works, and sources. Update `content/settings.json` to assign topics and display order. Supplement translations in `content/localization.json`. Image credits, source pages, and permission records live in `content/image-manifest.json`; image files live in `assets/images/`.

```sh
npm run build
npm run check
npm run dev
```

The project uses Node.js 20+ without package dependencies. Fonts and images are served from the site itself. Font licenses are included in `assets/fonts/`.

## Deployment

Push to `main` to deploy with GitHub Actions. The current workflow runs `build:test-site`, which includes the reference images while preserving their actual permission status and adding visible notices. Test pages request no search indexing.

For a release limited to images cleared for publication, change the workflow build command to `npm run build:public`. That command includes only image records with `public_site_ready: true`.

The submission form downloads a suggestion file; it does not send data to a server.
