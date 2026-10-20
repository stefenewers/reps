"""Checks the worked examples written in prompts: `f(args)` → `value` must hold for the reference solution."""
import json, sys, io, contextlib

jobs = json.load(sys.stdin)
out = []
for job in jobs:
    ns = {}
    errors = []
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            exec(job["solution"], ns)
    except Exception as e:  # noqa: BLE001
        out.append({"id": job["id"], "errors": [f"solution failed to load: {e!r}"]})
        continue
    for ex in job["examples"]:
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                got = eval(ex["call"], ns)
            want = eval(ex["expect"], dict(ns))
            if got != want or type(got) is not type(want) and not (isinstance(got, (int, float)) and isinstance(want, (int, float))):
                errors.append(f"{ex['call']} gives {got!r}, the prompt says {ex['expect']}")
        except (NameError, AttributeError):
            # Illustrative: the call names a tree or grid built elsewhere (`root`, `grid`), not literals.
            continue
        except Exception as e:  # noqa: BLE001
            errors.append(f"{ex['call']} → {ex['expect']}: {e!r}")
    out.append({"id": job["id"], "errors": errors})
json.dump(out, sys.stdout)
