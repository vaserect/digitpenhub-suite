#!/bin/bash
# Background seeding script - runs even if terminal disconnects
# Usage: bash run-seeding-background.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/seeding-$(date +%Y%m%d-%H%M%S).log"

echo "🌱 Starting background seeding process..."
echo "📝 Log file: $LOG_FILE"

# Run in background with nohup (continues even if terminal closes)
nohup node "$SCRIPT_DIR/seed-week1-complete.js" > "$LOG_FILE" 2>&1 &

SEED_PID=$!
echo "✅ Seeding process started with PID: $SEED_PID"
echo "📊 Monitor progress: tail -f $LOG_FILE"
echo "🛑 Stop process: kill $SEED_PID"
echo ""
echo "Process will continue running even if you disconnect from the internet."
echo "Check log file for results when complete."
