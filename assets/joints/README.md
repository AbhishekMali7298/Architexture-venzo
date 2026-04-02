Put custom joint materials in this folder.

Recommended structure:

- `assets/joints/<material-name>/thumb.jpg`
- `assets/joints/<material-name>/main.jpg`

Supported image formats:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

How it works:

- The joint material popup only reads from subfolders inside `assets/joints`
- `thumb.*` is used for the popup card image when present
- `main.*` is used as the selected joint material asset
- If only one image exists, it is used for both
