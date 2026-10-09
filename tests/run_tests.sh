#!/bin/bash

# Test /about.json endpoint
echo "Testing /about.json endpoint..."

RESPONSE=$(curl -s http://localhost:8080/about.json)

if [ -z "$RESPONSE" ]; then
  echo "❌ Error: Empty response from http://localhost:8080/about.json"
  exit 1
fi

# Check if client.host exists
HOST=$(echo $RESPONSE | jq -r '.client.host')
if [ "$HOST" == "null" ]; then
  echo "❌ Error: client.host is missing"
  exit 1
fi

# Check if server.current_time exists
CURRENT_TIME=$(echo $RESPONSE | jq -r '.server.current_time')
if [ "$CURRENT_TIME" == "null" ]; then
  echo "❌ Error: server.current_time is missing"
  exit 1
fi

# Check if services array exists and has elements
SERVICES_COUNT=$(echo $RESPONSE | jq '.server.services | length')
if [ "$SERVICES_COUNT" == "0" ] || [ "$SERVICES_COUNT" == "null" ]; then
  echo "❌ Error: No services found or array is missing"
  exit 1
fi

echo "✅ /about.json endpoint is valid!"
exit 0
