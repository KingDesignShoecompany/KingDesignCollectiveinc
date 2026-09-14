#!/usr/bin/env bash
# fusion_flow_example.sh
# Simulate fusion flow: request fusion, receive writePackage, validate token (requires sample_write_service running)
API_BASE="http://localhost:3000"
WRITE_SERVICE="http://localhost:4000"
USER_ID="user-uuid-sample"
CARD_A="UID_A_123"
CARD_B="UID_B_456"
# 1) Request fusion
echo "Requesting fusion..."
curl -s -X POST "$API_BASE/fusionRequest" -H "Content-Type: application/json" -d \
"{\"userId\":\"$USER_ID\",\"cardA\":\"$CARD_A\",\"cardB\":\"$CARD_B\"}" | jq .
# 2) Assume server returns writeToken and writePackage; simulate validating token
# (In real flow, client would write to tag using platform bridge)
