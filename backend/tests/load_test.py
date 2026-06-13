import asyncio
import time
import random
import sys
import argparse
from typing import Dict, List, Any

try:
    import psutil
    import httpx
except ImportError:
    if "pytest" in sys.modules:
        import pytest
        pytest.skip("psutil or httpx not installed, skipping load test script", allow_module_level=True)
    else:
        raise

BASE_URL = "http://localhost:8001/api"

def get_uvicorn_process():
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            name = (proc.info['name'] or '').lower()
            cmdline = ' '.join(proc.info['cmdline'] or []).lower()
            if 'uvicorn' in name or 'uvicorn' in cmdline:
                return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return None

class MetricsTracker:
    def __init__(self):
        self.latencies = {}
        self.errors = 0
        self.successes = 0

    def record(self, name: str, start_time: float, success: bool):
        latency = (time.monotonic() - start_time) * 1000.0  # ms
        if name not in self.latencies:
            self.latencies[name] = []
        self.latencies[name].append(latency)
        if success:
            self.successes += 1
        else:
            self.errors += 1

    def print_summary(self):
        print("\n" + "="*80)
        print(f"{'Endpoint':<35} | {'Count':<6} | {'Avg (ms)':<9} | {'P50 (ms)':<9} | {'P95 (ms)':<9} | {'P99 (ms)':<9}")
        print("-"*80)
        for name, lats in sorted(self.latencies.items()):
            if not lats:
                continue
            lats_sorted = sorted(lats)
            count = len(lats)
            avg = sum(lats) / count
            p50 = lats_sorted[int(count * 0.50)]
            p95 = lats_sorted[int(count * 0.95)] if count > 1 else lats_sorted[-1]
            p99 = lats_sorted[int(count * 0.99)] if count > 1 else lats_sorted[-1]
            print(f"{name:<35} | {count:<6} | {avg:<9.2f} | {p50:<9.2f} | {p95:<9.2f} | {p99:<9.2f}")
        total = self.successes + self.errors
        err_rate = (self.errors / total * 100.0) if total > 0 else 0.0
        print("-"*80)
        print(f"Total Requests: {total} | Successes: {self.successes} | Errors: {self.errors} | Error Rate: {err_rate:.2f}%")
        print("="*80)

async def simulate_user(user_id: int, tracker: MetricsTracker):
    async with httpx.AsyncClient(timeout=15.0) as client:
        rand_val = random.randint(100000, 999999)
        username = f"load_u_{user_id}_{rand_val}"
        email = f"load_e_{user_id}_{rand_val}@loadtest.com"
        password = "SecurePassword123!"
        
        # 1. Register
        start = time.monotonic()
        try:
            r = await client.post(f"{BASE_URL}/auth/register", json={
                "username": username,
                "email": email,
                "password": password
            })
            if r.status_code == 200:
                tracker.record("POST /auth/register", start, True)
                res_data = r.json()
                otp = res_data.get("verification_token_demo")
            else:
                tracker.record("POST /auth/register", start, False)
                return
        except Exception:
            tracker.record("POST /auth/register", start, False)
            return

        # 2. Verify Email
        start = time.monotonic()
        try:
            r = await client.post(f"{BASE_URL}/auth/verify-email", json={
                "email": email,
                "token": otp
            })
            tracker.record("POST /auth/verify-email", start, r.status_code == 200)
        except Exception:
            tracker.record("POST /auth/verify-email", start, False)
            return

        # 3. Login
        start = time.monotonic()
        token = None
        try:
            r = await client.post(f"{BASE_URL}/auth/login", json={
                "email": email,
                "password": password
            })
            if r.status_code == 200:
                tracker.record("POST /auth/login", start, True)
                token = r.json().get("token")
            else:
                tracker.record("POST /auth/login", start, False)
                return
        except Exception:
            tracker.record("POST /auth/login", start, False)
            return

        if not token:
            return

        headers = {"Authorization": f"Bearer {token}"}

        # 4. Get Character Options
        start = time.monotonic()
        try:
            r = await client.get(f"{BASE_URL}/character/options", headers=headers)
            tracker.record("GET /character/options", start, r.status_code == 200)
        except Exception:
            tracker.record("GET /character/options", start, False)

        # 5. Create Character
        start = time.monotonic()
        try:
            r = await client.post(f"{BASE_URL}/character", headers=headers, json={
                "name": f"char_{user_id}_{rand_val}",
                "avatar_id": "avatar_1",
                "cyber_class": "penetration_tester"
            })
            tracker.record("POST /character", start, r.status_code == 200)
        except Exception:
            tracker.record("POST /character", start, False)
            return

        # 6. Read / Interactive Loop (5 iterations of regular play queries)
        for _ in range(5):
            # GET Dashboard
            start = time.monotonic()
            try:
                r = await client.get(f"{BASE_URL}/dashboard", headers=headers)
                tracker.record("GET /dashboard", start, r.status_code == 200)
            except Exception:
                tracker.record("GET /dashboard", start, False)

            # GET NPCs
            start = time.monotonic()
            try:
                r = await client.get(f"{BASE_URL}/npcs", headers=headers)
                tracker.record("GET /npcs", start, r.status_code == 200)
            except Exception:
                tracker.record("GET /npcs", start, False)

            # GET Leaderboard
            start = time.monotonic()
            try:
                r = await client.get(f"{BASE_URL}/leaderboard", headers=headers)
                tracker.record("GET /leaderboard", start, r.status_code == 200)
            except Exception:
                tracker.record("GET /leaderboard", start, False)

            # GET Skills
            start = time.monotonic()
            try:
                r = await client.get(f"{BASE_URL}/skills", headers=headers)
                tracker.record("GET /skills", start, r.status_code == 200)
            except Exception:
                tracker.record("GET /skills", start, False)

            # GET Inventory
            start = time.monotonic()
            try:
                r = await client.get(f"{BASE_URL}/inventory", headers=headers)
                tracker.record("GET /inventory", start, r.status_code == 200)
            except Exception:
                tracker.record("GET /inventory", start, False)

            await asyncio.sleep(0.1)

async def run_load_test(concurrency: int):
    print(f"\n>>> Starting Load Test: {concurrency} Concurrent Users")
    
    # Process memory before
    proc = get_uvicorn_process()
    mem_before = 0.0
    if proc:
        try:
            mem_before = proc.memory_info().rss / (1024 * 1024)
        except Exception:
            pass
    print(f"FastAPI process memory before test: {mem_before:.2f} MB")

    tracker = MetricsTracker()
    start_test = time.monotonic()

    # Spawning N tasks
    tasks = [asyncio.create_task(simulate_user(i, tracker)) for i in range(concurrency)]
    
    # Run the tests and concurrently check memory in the background
    async def monitor_mem():
        max_mem = mem_before
        while not all(t.done() for t in tasks):
            if proc:
                try:
                    curr = proc.memory_info().rss / (1024 * 1024)
                    if curr > max_mem:
                        max_mem = curr
                except Exception:
                    pass
            await asyncio.sleep(0.5)
        return max_mem

    monitor_task = asyncio.create_task(monitor_mem())
    await asyncio.gather(*tasks)
    max_mem_used = await monitor_task
    
    duration = time.monotonic() - start_test
    mem_after = 0.0
    if proc:
        try:
            mem_after = proc.memory_info().rss / (1024 * 1024)
        except Exception:
            pass
            
    print(f"FastAPI process memory during test (max): {max_mem_used:.2f} MB")
    print(f"FastAPI process memory after test: {mem_after:.2f} MB")
    print(f"Completed simulation of {concurrency} users in {duration:.2f} seconds.")
    tracker.print_summary()
    return tracker

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FastAPI Backend Load Testing Tool")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrency level")
    args = parser.parse_args()
    
    asyncio.run(run_load_test(args.concurrency))


def test_load_test_sanity():
    tracker = MetricsTracker()
    assert tracker.successes == 0
    assert tracker.errors == 0
