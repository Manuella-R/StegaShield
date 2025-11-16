"""
Script to copy and update files for the new project structure.
Run this once to set up the project.
"""

import shutil
from pathlib import Path
import os

# Define source and destination
source_dir = Path(__file__).parent.parent  # Go up to 'others'
dest_dir = Path(__file__).parent  # project2

# Files to copy with import updates
files_to_copy = {
    'hybrid_multidomain_embed.py': 'models/hybrid_multidomain_embed.py',
    'hybrid_multidomain_verify.py': 'models/hybrid_multidomain_verify.py',
    'hybrid_multidomain_embed_det.py': 'models/hybrid_multidomain_embed_det.py',
    'hybrid_multidomain_verify_det.py': 'models/hybrid_multidomain_verify_det.py',
    'ml_watermark_models.py': 'models/ml_watermark_models.py',
    'train_ml_watermark.py': 'training/train_ml_watermark.py',
    'test_harness_md_det.py': 'training/test_harness_md_det.py',
}

# Import replacements
import_replacements = {
    'from hybrid_multidomain_embed import': 'from models.hybrid_multidomain_embed import',
    'from hybrid_multidomain_verify import': 'from models.hybrid_multidomain_verify import',
    'from hybrid_multidomain_embed_det import': 'from models.hybrid_multidomain_embed_det import',
    'from hybrid_multidomain_verify_det import': 'from models.hybrid_multidomain_verify_det import',
    'from ml_watermark_models import': 'from models.ml_watermark_models import',
    'from training.attacks import': 'from training.attacks import',
    'from training.utils_data import': 'from training.utils_data import',
}

def update_imports(content: str) -> str:
    """Update imports in file content."""
    for old_import, new_import in import_replacements.items():
        content = content.replace(old_import, new_import)
    return content

def copy_and_update_file(source: Path, dest: Path):
    """Copy file and update imports."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    with open(source, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update imports
    content = update_imports(content)
    
    # Write to destination
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Copied and updated: {dest}")

def main():
    """Main setup function."""
    print("Setting up project structure...")
    
    # Copy files
    for source_file, dest_path in files_to_copy.items():
        source = source_dir / source_file
        dest = dest_dir / dest_path
        
        if source.exists():
            copy_and_update_file(source, dest)
        else:
            print(f"⚠ Source file not found: {source}")
    
    print("\n✓ Project structure setup complete!")
    print(f"Files copied to: {dest_dir}")

if __name__ == "__main__":
    main()

