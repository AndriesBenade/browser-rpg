# Browser-RPG
Browser-based modular RPG engine and campaign platform. Run offline via `index.html` or over local HTTP (`python server.py`), and verify with `npm test`.

* `npm run sync:embedded` after editing campaign JSON (keeps the file:// copy inside `index.html` identical).
* `npm install` once, then `npm run build` for a compressed release copy in `dist/` (tested automatically).
