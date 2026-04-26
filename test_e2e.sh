#!/bin/bash
# Content Broadcasting System — Full End-to-End Test Script
# Usage: chmod +x test_e2e.sh && ./test_e2e.sh

BASE="http://localhost:5001/api/v1"
PASS=0
FAIL=0

check_status() {
  local label=$1
  local expected=$2
  local actual=$3
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $label — $actual"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label — Expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Content Broadcasting System — E2E Test Runner         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Health Check ────────────────────────────────────────
echo "─── 1. Health Check ───"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/health)
check_status "GET /health" "200" "$HEALTH_STATUS"

# ─── 2. Login Teacher ───────────────────────────────────────
echo ""
echo "─── 2. Login (Teacher) ───"
TEACHER_RESP=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@school.com","password":"teacher@123"}')
TEACHER_STATUS=$(echo $TEACHER_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
TEACHER_TOKEN=$(echo $TEACHER_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
TEACHER_ID=$(echo $TEACHER_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['id'])" 2>/dev/null)
check_status "POST /auth/login (teacher)" "True" "$TEACHER_STATUS"
echo "  → Token: ${TEACHER_TOKEN:0:40}..."
echo "  → Teacher ID: $TEACHER_ID"

# ─── 3. Login Principal ─────────────────────────────────────
echo ""
echo "─── 3. Login (Principal) ───"
PRINCIPAL_RESP=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"principal@school.com","password":"principal@123"}')
PRINCIPAL_STATUS=$(echo $PRINCIPAL_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
PRINCIPAL_TOKEN=$(echo $PRINCIPAL_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check_status "POST /auth/login (principal)" "True" "$PRINCIPAL_STATUS"

# ─── 4. Upload Content ──────────────────────────────────────
echo ""
echo "─── 4. Upload Content (Teacher) ───"
UPLOAD_RESP=$(curl -s -X POST $BASE/content/upload \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -F "file=@./files/test_image.png" \
  -F "title=E2E Test Content" \
  -F "subject=Science" \
  -F "start_time=2024-01-01T00:00:00Z" \
  -F "end_time=2030-12-31T23:59:59Z" \
  -F "duration_minutes=5")
UPLOAD_STATUS=$(echo $UPLOAD_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
check_status "POST /content/upload" "True" "$UPLOAD_STATUS"

# ─── 5. Get My Content ──────────────────────────────────────
echo ""
echo "─── 5. Get My Content (Teacher) ───"
MY_RESP=$(curl -s $BASE/content/my -H "Authorization: Bearer $TEACHER_TOKEN")
MY_STATUS=$(echo $MY_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
CONTENT_ID=$(echo $MY_RESP | python3 -c "import sys,json; c=json.load(sys.stdin)['data']['content']; print(c[0]['id'] if c else 'none')" 2>/dev/null)
CONTENT_COUNT=$(echo $MY_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['pagination']['total'])" 2>/dev/null)
check_status "GET /content/my" "True" "$MY_STATUS"
echo "  → Content count: $CONTENT_COUNT"
echo "  → First Content ID: $CONTENT_ID"

# ─── 6. Get Pending (Principal) ─────────────────────────────
echo ""
echo "─── 6. Get Pending Content (Principal) ───"
PENDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/approval/pending \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN")
check_status "GET /approval/pending" "200" "$PENDING_STATUS"

# ─── 7. Approve Content ─────────────────────────────────────
echo ""
echo "─── 7. Approve Content (Principal) ───"
APPROVE_RESP=$(curl -s -X POST $BASE/approval/$CONTENT_ID/approve \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN")
APPROVE_STATUS=$(echo $APPROVE_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
check_status "POST /approval/:id/approve" "True" "$APPROVE_STATUS"

# ─── 8. Live Content (Public) ───────────────────────────────
echo ""
echo "─── 8. Live Content (Public) ───"
LIVE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/content/live/$TEACHER_ID)
check_status "GET /content/live/:teacherId" "200" "$LIVE_STATUS"

# ─── 9. Analytics ────────────────────────────────────────────
echo ""
echo "─── 9. Analytics (Principal) ───"
ANALYTICS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/analytics/subjects \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN")
check_status "GET /analytics/subjects" "200" "$ANALYTICS_STATUS"

# ─── 10. Auth Guard Test ─────────────────────────────────────
echo ""
echo "─── 10. Auth Guard (No Token) ───"
NO_AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/content/my)
check_status "GET /content/my (no token → 401)" "401" "$NO_AUTH_STATUS"

# ─── 11. Validation Test ─────────────────────────────────────
echo ""
echo "─── 11. Validation (Empty Body) ───"
VALID_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/auth/login \
  -H "Content-Type: application/json" -d '{}')
check_status "POST /auth/login (empty → 400)" "400" "$VALID_STATUS"

# ─── Results ─────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  RESULTS: $PASS passed, $FAIL failed ($(($PASS + $FAIL)) total)              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "❌ Some tests failed. Check output above."
  exit 1
fi
