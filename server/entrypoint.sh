#!/bin/sh
set -e

echo "=== Kridaz Docker Entrypoint ==="
echo "Ensuring database schema is up to date..."

# Capture the output of prisma migrate deploy
# If it fails with P3005 (database not empty), it means we need to baseline
output=$(npx prisma migrate deploy 2>&1) || exit_code=$?

if [ "${exit_code:-0}" -ne 0 ]; then
  if echo "$output" | grep -q "P3005"; then
    echo "Detected unbaselined database (P3005). Baselining with init migration..."
    
    # Get the name of the first migration folder
    INIT_MIGRATION=$(ls -1 prisma/migrations | head -n 1)
    
    if [ -n "$INIT_MIGRATION" ]; then
      echo "Resolving migration: $INIT_MIGRATION"
      npx prisma migrate resolve --applied "$INIT_MIGRATION"
      
      echo "Baselining complete. Re-running deploy..."
      npx prisma migrate deploy
    else
      echo "Failed to find init migration folder."
      exit 1
    fi
  else
    echo "Migration failed with error:"
    echo "$output"
    exit $exit_code
  fi
else
  echo "$output"
fi

echo "Starting server..."
exec node server.js
