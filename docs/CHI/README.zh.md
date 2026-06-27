# RESOLVE 文档
DOCEOF
cat > docs/ENG/README.md << 'EOF'
# RESOLVE Documentation
DOCEOF

# Add all root files
git add -A
echo "=== Root staged files ==="
git status --short
