from pathlib import Path

exclude = {
    "node_modules", ".git", ".next", "venv", "__pycache__",
    "dist", "build", ".history", ".vscode", ".idea", "coverage"
}

def tree(path, prefix=""):
    items = sorted(
        [p for p in path.iterdir() if p.name not in exclude],
        key=lambda x: (not x.is_dir(), x.name.lower())
    )

    for i, item in enumerate(items):
        connector = "└── " if i == len(items) - 1 else "├── "
        print(prefix + connector + item.name)

        if item.is_dir():
            extension = "    " if i == len(items) - 1 else "│   "
            tree(item, prefix + extension)

tree(Path("."))