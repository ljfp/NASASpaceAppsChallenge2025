# Minimal FastAPI Starter

A barebones FastAPI project that serves a single static HTML page.

## Quickstart

1. Create a virtual environment and install the dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Launch the development server:

   ```bash
   uvicorn src.server:app --reload
   ```

3. Open <http://127.0.0.1:8000/> in your browser to view the page titled **“Minimal FastAPI App.”**

## Project structure

```
NASASpaceAppsChallenge2025/
├── requirements.txt      # FastAPI and Uvicorn dependencies
├── src/
│   ├── __init__.py
│   └── server.py         # FastAPI application serving the HTML page
└── web/
    └── index.html        # Static HTML served at the root route
```

Feel free to build on this foundation for richer APIs or interfaces.
