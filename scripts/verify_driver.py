# Runs a batch of (id, code, tests) through the Reps harness with local python3.
# stdin: JSON list of {"id", "code", "tests"}; stdout: JSON list of {"id", "result"}.
import json
import os
import signal
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
HARNESS = os.path.join(HERE, "..", "public", "python", "harness.py")

ns = {"__name__": "reps_harness"}
with open(HARNESS) as f:
    exec(compile(f.read(), HARNESS, "exec"), ns)
main = ns["__reps_main"]


class Timeout(Exception):
    pass


def on_alarm(*_):
    # Re-arm: the harness catches exceptions per test, so a runaway test after a
    # runaway module body must be interrupted again.
    signal.alarm(1)
    raise Timeout()


signal.signal(signal.SIGALRM, on_alarm)
sys.setrecursionlimit(3000)

jobs = json.load(sys.stdin)
out = []
for job in jobs:
    signal.alarm(5)
    try:
        res = json.loads(main(job["code"], json.dumps(job.get("tests", []))))
    except Timeout:
        res = {"stdout": "", "error": "TIMEOUT", "errorLine": None, "tests": []}
    finally:
        signal.alarm(0)
    out.append({"id": job["id"], "result": res})

sys.__stdout__.write(json.dumps(out))
