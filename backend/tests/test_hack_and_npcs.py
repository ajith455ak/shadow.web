"""Backend tests for Shadow Nexus hacking + NPC + messenger features."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("BACKEND_URL", os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://localhost:8001")).rstrip("/")
API = f"{BASE_URL}/api"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_ctx(session):
    """Register a fresh user + create character; return token+headers."""
    suffix = uuid.uuid4().hex[:8]
    email = f"test_{suffix}@nexus.io"
    payload = {"username": f"tu_{suffix}", "email": email, "password": "SecurePassword123!"}
    r = session.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    v_token = data.get("verification_token_demo")
    if v_token:
        v_res = session.post(f"{API}/auth/verify-email", json={
            "email": email,
            "token": v_token
        })
        assert v_res.status_code == 200, v_res.text
    token = data["token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    # Create character
    cc = session.post(
        f"{API}/character",
        json={"name": f"Agent_{suffix}", "avatar_id": "avatar_1", "cyber_class": "penetration_tester"},
        headers=headers, timeout=30,
    )
    assert cc.status_code == 200, cc.text
    return {"token": token, "headers": headers, "email": email, "user_id": data["user"]["id"]}


# ---------- previous endpoints regression ----------
class TestRegression:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json()["app"] == "Shadow Nexus"

    def test_auth_me(self, session, user_ctx):
        r = session.get(f"{API}/auth/me", headers=user_ctx["headers"])
        assert r.status_code == 200
        assert r.json()["character"] is not None

    def test_character(self, session, user_ctx):
        r = session.get(f"{API}/character", headers=user_ctx["headers"])
        assert r.status_code == 200
        assert r.json()["cyber_class"] == "penetration_tester"

    def test_dashboard(self, session, user_ctx):
        r = session.get(f"{API}/dashboard", headers=user_ctx["headers"])
        assert r.status_code == 200
        assert "character" in r.json()

    def test_chapters(self, session, user_ctx):
        r = session.get(f"{API}/chapters", headers=user_ctx["headers"])
        assert r.status_code == 200 and len(r.json()) == 5

    def test_inventory(self, session, user_ctx):
        r = session.get(f"{API}/inventory", headers=user_ctx["headers"])
        assert r.status_code == 200

    def test_skills(self, session, user_ctx):
        r = session.get(f"{API}/skills", headers=user_ctx["headers"])
        assert r.status_code == 200

    def test_achievements(self, session, user_ctx):
        r = session.get(f"{API}/achievements", headers=user_ctx["headers"])
        assert r.status_code == 200

    def test_daily(self, session, user_ctx):
        r = session.get(f"{API}/daily-challenges", headers=user_ctx["headers"])
        assert r.status_code == 200 and len(r.json()) == 3

    def test_leaderboard(self, session):
        r = session.get(f"{API}/leaderboard")
        assert r.status_code == 200

    def test_combat(self, session, user_ctx):
        r = session.get(f"{API}/combat/m5", headers=user_ctx["headers"])
        assert r.status_code == 200

    def test_npc_history(self, session, user_ctx):
        r = session.get(f"{API}/npcs/nova/history", headers=user_ctx["headers"])
        assert r.status_code == 200


# ---------- NPCs ----------
class TestNPCs:
    def test_list_includes_new(self, session):
        r = session.get(f"{API}/npcs")
        assert r.status_code == 200
        npcs = r.json()
        ids = {n["id"] for n in npcs}
        # The "8 NPCs" requirement
        assert len(npcs) >= 8, f"Expected 8 NPCs got {len(npcs)}"
        for must in ("aria", "jin", "vector"):
            assert must in ids, f"Missing NPC {must}"
        for n in npcs:
            assert n.get("portrait", "").startswith("http"), f"{n['id']} missing portrait"
            assert "faction" in n and "hostile" in n and "tag" in n

    def test_npc_chat(self, session, user_ctx):
        r = session.post(f"{API}/npcs/chat",
                         json={"npc_id": "nova", "message": "Sitrep, Commander."},
                         headers=user_ctx["headers"], timeout=60)
        assert r.status_code == 200
        assert "reply" in r.json()

    def test_persuade_valid(self, session, user_ctx):
        r = session.post(f"{API}/npcs/persuade",
                         json={"npc_id": "jin", "approach": "sympathize"},
                         headers=user_ctx["headers"], timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["approach"] == "sympathize"
        assert "delta" in data and "trust" in data and "reaction" in data
        # Verify trust persistence
        t = session.get(f"{API}/npcs/trust", headers=user_ctx["headers"])
        assert t.status_code == 200
        assert t.json()["trust"].get("jin") == data["trust"]
        # Verify reaction is non-fallback LLM (not static)
        assert data["reaction"] not in ("...", "[static]"), "LLM fallback returned"

    def test_persuade_invalid_approach(self, session, user_ctx):
        r = session.post(f"{API}/npcs/persuade",
                         json={"npc_id": "jin", "approach": "wave"},
                         headers=user_ctx["headers"])
        assert r.status_code == 400


# ---------- Messenger ----------
class TestMessenger:
    def test_seed_and_inbox(self, session, user_ctx):
        r = session.post(f"{API}/messenger/seed-tipoffs", headers=user_ctx["headers"])
        assert r.status_code == 200
        inbox = session.get(f"{API}/messenger/inbox", headers=user_ctx["headers"])
        assert inbox.status_code == 200
        msgs = inbox.json()["messages"]
        senders = {m["sender_npc"] for m in msgs}
        for s in ("jin", "vector", "cipher"):
            assert s in senders
        assert inbox.json()["unread"] >= 3

    def test_mark_read(self, session, user_ctx):
        r = session.post(f"{API}/messenger/read", headers=user_ctx["headers"])
        assert r.status_code == 200
        inbox = session.get(f"{API}/messenger/inbox", headers=user_ctx["headers"]).json()
        assert inbox["unread"] == 0


# ---------- Hacking ----------
class TestHack:
    def test_targets(self, session):
        r = session.get(f"{API}/hack/targets")
        assert r.status_code == 200
        d = r.json()
        assert len(d["targets"]) == 6
        labels = {s["id"] for s in d["stages"]}
        assert labels == {"recon", "exploit", "privesc", "exfil"}

    def test_full_chain_and_complete(self, session, user_ctx):
        h = user_ctx["headers"]
        # Start with helix_corp_perimeter
        r = session.post(f"{API}/hack/start",
                         json={"target": "helix_corp_perimeter"}, headers=h)
        assert r.status_code == 200
        sess = r.json()
        sid = sess["id"]
        assert sess["stage"] == "recon"
        assert len(sess["nodes"]) == 6
        ip = sess["target"]["ip"]

        # GET session
        g = session.get(f"{API}/hack/{sid}", headers=h)
        assert g.status_code == 200 and g.json()["id"] == sid

        # nmap → recon→exploit
        r = session.post(f"{API}/hack/cmd",
                         json={"session_id": sid, "command": f"nmap {ip}"}, headers=h)
        assert r.status_code == 200
        assert r.json()["stage"] == "exploit"
        assert "8080" in r.json()["discovered_ports"]

        # exploit wrong port stays in exploit
        r = session.post(f"{API}/hack/cmd",
                         json={"session_id": sid, "command": "exploit 22"}, headers=h)
        assert r.status_code == 200
        assert r.json()["stage"] == "exploit"
        assert r.json()["exploit_success"] is False

        # exploit 8080 → privesc
        r = session.post(f"{API}/hack/cmd",
                         json={"session_id": sid, "command": "exploit 8080"}, headers=h)
        assert r.status_code == 200
        d = r.json()
        assert d["exploit_success"] is True
        assert d["stage"] == "privesc"

        # puzzle
        p = session.get(f"{API}/hack/{sid}/puzzle", headers=h)
        assert p.status_code == 200
        puz = p.json()
        assert "options" in puz and len(puz["options"]) >= 2
        correct = puz["options"][0]
        # Wrong answer first
        bad = session.post(f"{API}/hack/inject",
                          json={"session_id": sid, "answer": "console.log(1)"}, headers=h)
        assert bad.status_code == 200 and bad.json()["ok"] is False
        # Correct answer via terminal inject command
        good = session.post(f"{API}/hack/cmd",
                           json={"session_id": sid, "command": f"inject {correct}"}, headers=h)
        assert good.status_code == 200
        assert good.json()["code_puzzle_solved"] is True

        # crack progress
        cp = session.get(f"{API}/hack/{sid}/crack-progress", headers=h)
        assert cp.status_code == 200
        lines = cp.json()["lines"]
        # Extract candidate passwords from the lines (format: "<hash>  ← <pw>")
        candidates = [ln.split("←", 1)[-1].strip() for ln in lines if "←" in ln]
        assert len(candidates) >= 5
        # Wrong guess
        wrong = session.post(f"{API}/hack/crack",
                            json={"session_id": sid, "guess": "definitely_not"}, headers=h)
        assert wrong.status_code == 200 and wrong.json()["ok"] is False
        # Try each candidate to find the real one (dictionary list ALWAYS contains it)
        cracked = False
        for cand in candidates:
            r = session.post(f"{API}/hack/crack",
                            json={"session_id": sid, "guess": cand}, headers=h)
            assert r.status_code == 200
            if r.json()["ok"]:
                cracked = True
                assert r.json()["session"]["stage"] == "exfil"
                break
        assert cracked, "Real password not found in dictionary"

        # Complete should fail before exfil
        cf = session.post(f"{API}/hack/complete",
                         json={"session_id": sid}, headers=h)
        assert cf.status_code == 400

        # exfil command
        r = session.post(f"{API}/hack/cmd",
                         json={"session_id": sid, "command": "exfil"}, headers=h)
        assert r.status_code == 200
        assert r.json()["exfil_complete"] is True

        # baseline trust before complete
        t0 = session.get(f"{API}/npcs/trust", headers=h).json()["trust"]
        aria0 = t0.get("aria", 0)
        jin0 = t0.get("jin", 0)

        # complete
        ok = session.post(f"{API}/hack/complete",
                        json={"session_id": sid}, headers=h)
        assert ok.status_code == 200, ok.text
        data = ok.json()
        assert data["xp_gained"] == 350 and data["coins_gained"] == 200

        # trust changes (Helix → aria -25, jin +15)
        t1 = data["trust_changes"]
        assert t1.get("aria", 0) == aria0 - 25
        assert t1.get("jin", 0) == jin0 + 15

        # cannot claim twice
        again = session.post(f"{API}/hack/complete",
                            json={"session_id": sid}, headers=h)
        assert again.status_code == 400

        # Inbox should have BYTE celebration + ARIA threat
        inbox = session.get(f"{API}/messenger/inbox", headers=h).json()
        senders = {m["sender_npc"] for m in inbox["messages"]}
        assert "byte" in senders
        assert "aria" in senders

    def test_terminal_misc_commands(self, session, user_ctx):
        h = user_ctx["headers"]
        r = session.post(f"{API}/hack/start", json={"target": "phantom_relay"}, headers=h)
        sid = r.json()["id"]
        ip = r.json()["target"]["ip"]
        for cmd in ["help", "tutorial", f"ping {ip}", f"traceroute {ip}", "ls", "cat .bash_history",
                    "chmod 777 file", "map", "decrypt abcXYZ", "clear"]:
            rr = session.post(f"{API}/hack/cmd",
                             json={"session_id": sid, "command": cmd}, headers=h)
            assert rr.status_code == 200, f"Command {cmd} failed: {rr.text}"

    def test_sql_injector_target_and_puzzle(self, session, user_ctx):
        h = user_ctx["headers"]
        r = session.post(f"{API}/hack/start", json={"target": "secure_sql_injector"}, headers=h)
        assert r.status_code == 200
        sess = r.json()
        sid = sess["id"]
        assert sess["target"]["id"] == "secure_sql_injector"
        ip = sess["target"]["ip"]

        r = session.post(f"{API}/hack/cmd", json={"session_id": sid, "command": f"nmap {ip}"}, headers=h)
        assert r.status_code == 200
        assert r.json()["stage"] == "exploit"

        r = session.post(f"{API}/hack/cmd", json={"session_id": sid, "command": "exploit 5432"}, headers=h)
        assert r.status_code == 200
        assert r.json()["stage"] == "privesc"

        p = session.get(f"{API}/hack/{sid}/puzzle", headers=h)
        assert p.status_code == 200
        puz = p.json()
        assert "-- SQL Vulnerable Query Bypass" in puz["code_template"][0]
        assert puz["options"][0] == "' OR '1'='1"

        bad = session.post(f"{API}/hack/inject", json={"session_id": sid, "answer": "wrong_payload"}, headers=h)
        assert bad.status_code == 200
        assert bad.json()["ok"] is False

        good = session.post(f"{API}/hack/cmd", json={"session_id": sid, "command": "inject ' OR '1'='1"}, headers=h)
        assert good.status_code == 200
        assert good.json()["code_puzzle_solved"] is True

    def test_weak_password_registration(self, session):
        suffix = uuid.uuid4().hex[:8]
        # Password too short
        r = session.post(f"{API}/auth/register", json={
            "username": f"tu_{suffix}",
            "email": f"test_{suffix}@nexus.io",
            "password": "Short1!"
        })
        assert r.status_code in (400, 422)

        # Password without uppercase
        r = session.post(f"{API}/auth/register", json={
            "username": f"tu_{suffix}",
            "email": f"test_{suffix}@nexus.io",
            "password": "nouppercase123!"
        })
        assert r.status_code in (400, 422)

        # Password without lowercase
        r = session.post(f"{API}/auth/register", json={
            "username": f"tu_{suffix}",
            "email": f"test_{suffix}@nexus.io",
            "password": "NOLOWERCASE123!"
        })
        assert r.status_code in (400, 422)

        # Password without digit
        r = session.post(f"{API}/auth/register", json={
            "username": f"tu_{suffix}",
            "email": f"test_{suffix}@nexus.io",
            "password": "NoDigitsPassword!"
        })
        assert r.status_code in (400, 422)

        # Password without special char
        r = session.post(f"{API}/auth/register", json={
            "username": f"tu_{suffix}",
            "email": f"test_{suffix}@nexus.io",
            "password": "NoSpecialChar123"
        })
        assert r.status_code in (400, 422)

    def test_trace_level_hazards_and_clear_logs(self, session, user_ctx):
        h = user_ctx["headers"]
        r = session.post(f"{API}/hack/start", json={"target": "cyber_academy_sandbox"}, headers=h)
        assert r.status_code == 200
        sess = r.json()
        sid = sess["id"]
        assert sess["trace_level"] == 0

        # Scan to advance stage so we can ssh
        r = session.post(f"{API}/hack/cmd", json={"session_id": sid, "command": f"nmap {sess['target']['ip']}"}, headers=h)
        assert r.status_code == 200
        sess = r.json()
        assert sess["trace_level"] > 0
        first_trace = sess["trace_level"]

        # Run clear-logs to check mitigation
        r = session.post(f"{API}/hack/cmd", json={"session_id": sid, "command": "clear-logs"}, headers=h)
        assert r.status_code == 200
        sess = r.json()
        assert sess["trace_level"] == 0 or sess["trace_level"] < first_trace

        # Run noise generating commands to force 100% trace
        # SSH command generates 15 trace noise
        for _ in range(8):
            r = session.post(f"{API}/hack/cmd", json={"session_id": sid, "command": f"ssh admin@{sess['target']['ip']}"}, headers=h)
            assert r.status_code == 200
            sess = r.json()
            if sess["stage"] == "failed":
                break

        assert sess["stage"] == "failed"
        assert sess["trace_level"] == 100

        # Verify future commands are rejected
        r = session.post(f"{API}/hack/cmd", json={"session_id": sid, "command": "help"}, headers=h)
        assert r.status_code == 200
        assert "ERROR" in r.json()["history"][-1]["output"]

        # Verify other actions are blocked
        r_crack = session.post(f"{API}/hack/crack", json={"session_id": sid, "guess": "letmein"}, headers=h)
        assert r_crack.status_code == 400

        r_inject = session.post(f"{API}/hack/inject", json={"session_id": sid, "answer": "bypass"}, headers=h)
        assert r_inject.status_code == 400

        r_complete = session.post(f"{API}/hack/complete", json={"session_id": sid}, headers=h)
        assert r_complete.status_code == 400

    def test_xss_and_decryption_target_puzzles(self, session, user_ctx):
        h = user_ctx["headers"]
        # Helix Corp Perimeter -> XSS
        r = session.post(f"{API}/hack/start", json={"target": "helix_corp_perimeter"}, headers=h)
        assert r.status_code == 200
        sid_xss = r.json()["id"]
        p_xss = session.get(f"{API}/hack/{sid_xss}/puzzle", headers=h).json()
        assert "XSS Vulnerable" in p_xss["code_template"][0]

        # Dark Web Vault -> Decryption
        r = session.post(f"{API}/hack/start", json={"target": "dark_web_vault"}, headers=h)
        assert r.status_code == 200
        sid_dec = r.json()["id"]
        p_dec = session.get(f"{API}/hack/{sid_dec}/puzzle", headers=h).json()
        assert "Decryption Cipher" in p_dec["code_template"][0]

