# Ramirez Family Archive

Static site for browsing digitized family home movies, organized by year and by
person. Hosted on GitHub Pages.

## Adding new footage

Everything lives in [`js/data.js`](js/data.js). Open that file and follow the
instructions at the top — in short:

1. Upload the digitized video to YouTube and grab its video ID.
2. Add a new entry to the `VIDEOS` array with the year, title, and video ID.
3. Add a `clips` entry for each moment worth jumping to, with the timestamp
   (in seconds) and everyone who appears in it.

No other files need to change — the site reads `data.js` and builds the year
list, person list, and chapter jump points automatically.

## Local preview

Just open `index.html` in a browser, or serve the folder with any static
file server (e.g. `npx serve .`).
