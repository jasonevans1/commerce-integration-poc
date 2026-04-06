# Task 007: Update index.html with Explicit Script Tag

**Status**: complete
**Depends on**: 006
**Retry count**: 0

## Description

Update `web-src/public/index.html` to add an explicit `<script>` tag pointing to the entry point, matching the sample's `index.html`. The current file has no script tag and relies on parcel auto-injection; the sample explicitly declares the entry point as `./src/index.js` (which maps to our `./src/index.jsx`).

## Context

- File to modify: `src/commerce-backend-ui-1/web-src/public/index.html`
- Sample `index.html`:
  ```html
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, shrink-to-fit=no"
      />
      <meta name="theme-color" content="#333333" />
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />
      <title>Delivery Fees</title>
    </head>
    <body>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root"></div>
      <script src="./src/index.jsx" async="true" type="module"></script>
    </body>
  </html>
  ```
- Title should be `Delivery Fees` (project-specific, not `SampleExtension`)
- Script src points to `./src/index.jsx` (our file uses `.jsx` extension)
- Add `<noscript>` fallback message
- Add `meta http-equiv="X-UA-Compatible"` and `theme-color` meta tags

## Requirements (Test Descriptions)

- [x] `index.html contains a script tag with src pointing to ./src/index.jsx`
- [x] `index.html contains the noscript fallback element`
- [x] `index.html title is Delivery Fees`
- [x] `index.html has X-UA-Compatible meta tag`
- [x] `index.html has div with id root for React mounting`

## Acceptance Criteria

- All requirements have passing tests
- Valid HTML5 document
- Script tag present with correct src and `type="module"`
