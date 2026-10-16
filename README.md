# Petar Danadzhiev — personal site

A single-page CV / portfolio. The page is static HTML/CSS/JS, but **all the content lives in
`data/*.json`** — `script.js` fetches those files on load and generates each section's tabs. To add a
job, a project, a skill, etc., you edit JSON only; you never touch the HTML.

## Running it

Because the page uses `fetch()` to read the JSON, it must be served over HTTP — **opening
`index.html` by double-clicking will show a "couldn't load data" banner** (browser security blocks
`fetch` on `file://`). Use any one of these:

- **Easiest:** double-click **`serve.bat`** (uses Node), then open <http://localhost:8000>.
- **Node:** run `node server.js` in this folder → open <http://localhost:8000>.
- **VS Code:** install the *Live Server* extension, right-click `index.html` → *Open with Live Server*.
- **Python (if installed):** `python -m http.server 8000` → open <http://localhost:8000>.

## Project layout

```
petarPersonalSite/
├─ index.html      # fixed scaffolding only (nav, section headers, empty tab containers, form, footer)
├─ style.css       # dark-orange theme, glassmorphism, animations
├─ script.js       # loads data/*.json and builds the sections; tabs, particles, nav, form
├─ server.js       # tiny zero-dependency Node static server
├─ serve.bat       # one-click local server (runs server.js)
├─ assets/         # avatar.svg + favicon.svg
└─ data/           # ← all content lives here
   ├─ profile.json          personal.json
   ├─ experience.json       education.json
   ├─ courses.json          skills.json
   ├─ projects.json         contact.json
```

## Editing content

Open the relevant file in `data/` and edit the values. **To add an entry, copy an existing object
in the array and change its fields.** Save, then reload the page.

| File | Shape | Fields |
|---|---|---|
| `profile.json` | object | `name`, `role`, `roleAccent`, `tagline`, `status`, `ctas[]`{`label`,`href`,`style`:`primary`\|`ghost`,`download?`}, `socials[]`{`network`,`href`} |
| `personal.json` | array of tabs | each `{label, type}` where `type` is `text` (`heading`,`body`), `facts` (`items[]`{`label`,`value`}), or `chips` (`items[]`) |
| `experience.json` | array | `{title, meta, org, date, summary, bullets[], tags[]}` |
| `education.json` | array | `{title, meta, org, date, summary, tags[], bullets?[]}` |
| `courses.json` | array | `{title, meta, org, date, summary, bullets[], tags[]}` (same shape as `experience.json`) |
| `skills.json` | array of tabs | `{label, type}`: `meters` (`items[]`{`name`,`level` 0–100}) or `chips` (`items[]`) |
| `projects.json` | array | `{title, subtitle, summary, tags[], links[]`{`label`,`href`}`}` |
| `contact.json` | object | `email`, `details[]`{`icon`,`value`,`href?`} (social icons come from `profile.json`) |

Notes:
- **Line breaks:** the prose fields — `summary` (experience, education, courses, projects),
  the personal **About** `body`, and bullet strings — support line breaks. Put `\n` in the string
  where you want a new line, and `\n\n` for a blank line between paragraphs. (Short fields like
  titles, tags and chips are single-line by design.)
- `network` for socials can be `github`, `linkedin`, `email`, `twitter`, or `website` (icon chosen automatically).
- Keep the JSON valid — double quotes around keys/strings, commas between items, **no trailing comma**
  after the last item. If a section goes blank after an edit, that file likely has a JSON typo (check
  the browser console).
- To use a real photo instead of the monogram, replace `assets/avatar.svg` with a square image and
  update the `src` in `index.html`.

## Theming

All colors are CSS variables at the top of `style.css` (`:root`). Change the `--accent*` values to
re-theme the whole site.
