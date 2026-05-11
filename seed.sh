#!/bin/bash
API_KEY="ast_5083b5ac-7f40-4805-b951-966d727f8cf1"
BASE_URL="http://localhost:3001"

features=("resume-parser" "chat-assistant" "email-summarizer" "onboarding-flow" "image-analyzer")
providers=("openai" "anthropic" "google")
models=("gpt-4o" "gpt-4o-mini" "claude-3-5-sonnet-20241022" "claude-3-5-haiku-20241022" "gemini-1.5-flash")
users=("user_001" "user_002" "user_003" "user_004" "user_005")

for i in {1..50}; do
  feature=${features[$((RANDOM % 5))]}
  provider=${providers[$((RANDOM % 3))]}
  model=${models[$((RANDOM % 5))]}
  user=${users[$((RANDOM % 5))]}
  input_tokens=$((RANDOM % 800 + 100))
  output_tokens=$((RANDOM % 300 + 50))
  cost=$(echo "scale=5; $input_tokens * 0.000005 + $output_tokens * 0.000015" | bc)
  latency=$((RANDOM % 2000 + 500))

  days_ago=$((RANDOM % 30))
  timestamp=$(date -u -v-${days_ago}d +%Y-%m-%dT%H:%M:%SZ)

  curl -s -X POST $BASE_URL/api/v1/log \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{
      \"provider\": \"$provider\",
      \"model\": \"$model\",
      \"inputTokens\": $input_tokens,
      \"outputTokens\": $output_tokens,
      \"cost\": $cost,
      \"latencyMs\": $latency,
      \"timestamp\": \"$timestamp\",
      \"metadata\": {
        \"feature\": \"$feature\",
        \"userId\": \"$user\",
        \"environment\": \"production\"
      }
    }" > /dev/null

  echo "Sent event $i/50 — $feature via $provider ($model)"
  sleep 0.1
done

echo "Done! 50 events sent."
