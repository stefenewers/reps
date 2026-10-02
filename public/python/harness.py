# Reps test harness.
#
# Shared by the in-browser Pyodide worker (public/python/worker.js) and the
# local content verifier (scripts/verify_driver.py), so a rep is graded by
# exactly the code that verified it.
#
# __reps_main(code, tests_json) -> JSON string:
#   { "stdout": str, "error": str|None, "errorLine": int|None,
#     "tests": [{ "name", "passed", "hidden", "call", "expected", "actual", "error", "stdout" }] }

import sys as _sys
import io as _io
import json as _json
import math as _math
import traceback as _traceback
from typing import List, Optional, Dict, Set, Tuple  # noqa: F401  (LeetCode-style signatures)


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def __repr__(self):
        return f"ListNode({self.val})"


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self):
        return f"TreeNode({self.val})"


def build_list(values):
    dummy = ListNode()
    cur = dummy
    for v in values:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next


def list_to_array(node):
    out = []
    while node is not None:
        out.append(node.val)
        node = node.next
        if len(out) > 10000:
            raise RuntimeError("linked list looks like it has a cycle")
    return out


def build_tree(values):
    """Level-order list (None for gaps) -> TreeNode, LeetCode style."""
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = [root]
    i = 1
    head = 0
    while head < len(queue) and i < len(values):
        node = queue[head]
        head += 1
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            queue.append(node.right)
        i += 1
    return root


def tree_to_array(root):
    """TreeNode -> level-order list with None gaps, trailing Nones trimmed."""
    if root is None:
        return []
    out = []
    queue = [root]
    head = 0
    while head < len(queue):
        node = queue[head]
        head += 1
        if node is None:
            out.append(None)
            continue
        out.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
        if len(out) > 10000:
            raise RuntimeError("tree too large or has a cycle")
    while out and out[-1] is None:
        out.pop()
    return out


_HELPERS = {
    "ListNode": ListNode,
    "TreeNode": TreeNode,
    "build_list": build_list,
    "list_to_array": list_to_array,
    "build_tree": build_tree,
    "tree_to_array": tree_to_array,
    "List": List,
    "Optional": Optional,
    "Dict": Dict,
    "Set": Set,
    "Tuple": Tuple,
}

_MAX_OUT = 20000


def _normalize_stdout(text):
    lines = [line.rstrip() for line in str(text).replace("\r\n", "\n").split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def _short_repr(value):
    r = repr(value)
    return r if len(r) <= 600 else r[:600] + "…"


def _format_error(exc, origin="<your code>"):
    """One readable line plus the user's line number, no harness frames."""
    if isinstance(exc, SyntaxError) and exc.filename in ("<your code>", "<test>"):
        line = exc.lineno
        text = (exc.text or "").rstrip("\n")
        msg = f"SyntaxError: {exc.msg}"
        if line:
            msg = f"Line {line}: {msg}"
            if text.strip():
                msg += f"\n    {text.strip()}"
        return msg, line
    line = None
    for frame in _traceback.extract_tb(exc.__traceback__):
        if frame.filename == "<your code>":
            line = frame.lineno
    name = type(exc).__name__
    detail = str(exc)
    msg = f"{name}: {detail}" if detail else name
    if isinstance(exc, KeyError):
        msg = f"KeyError: {detail} (that key is not in the dict)"
    if isinstance(exc, RecursionError):
        msg = "RecursionError: maximum recursion depth exceeded (missing or unreachable base case?)"
    if line:
        msg = f"Line {line}: {msg}"
    return msg, line


def _equal(actual, expected, mode):
    if mode == "float":
        try:
            return _math.isclose(actual, expected, rel_tol=1e-6, abs_tol=1e-9)
        except TypeError:
            return False
    if mode == "unordered":
        try:
            return sorted(actual, key=repr) == sorted(expected, key=repr)
        except TypeError:
            return False
    if mode == "sorted-inner":
        try:
            a = sorted((sorted(x) for x in actual), key=repr)
            b = sorted((sorted(x) for x in expected), key=repr)
            return a == b
        except TypeError:
            return False
    # exact: a bool must come back as a bool, so `return 1` is not `True`
    if isinstance(expected, bool) or isinstance(actual, bool):
        return type(actual) is type(expected) and actual == expected
    return actual == expected


class _Capture:
    def __init__(self):
        self.buf = _io.StringIO()
        self.old = None

    def __enter__(self):
        self.old = _sys.stdout
        _sys.stdout = self.buf
        return self

    def __exit__(self, *exc):
        _sys.stdout = self.old
        return False

    def text(self):
        return self.buf.getvalue()[:_MAX_OUT]


def __reps_main(code, tests_json):
    tests = _json.loads(tests_json) if tests_json else []
    ns = {"__name__": "__main__"}
    ns.update(_HELPERS)
    result = {"stdout": "", "error": None, "errorLine": None, "tests": []}

    cap = _Capture()
    with cap:
        try:
            compiled = compile(code, "<your code>", "exec")
            exec(compiled, ns)
        except BaseException as exc:  # noqa: BLE001  (user code may raise anything)
            result["error"], result["errorLine"] = _format_error(exc)
    result["stdout"] = cap.text()

    for i, t in enumerate(tests):
        name = t.get("name") or (t.get("call") or ("output" if "stdout" in t else f"check {i + 1}"))
        entry = {
            "name": name,
            "hidden": bool(t.get("hidden")),
            "passed": False,
            "call": t.get("call"),
            "expected": None,
            "actual": None,
            "error": None,
            "stdout": "",
        }
        if result["error"] is not None:
            entry["error"] = "Not run: your code raised an error before the tests."
            result["tests"].append(entry)
            continue

        if "stdout" in t and t.get("call") is None:
            want = _normalize_stdout(t["stdout"])
            got = _normalize_stdout(result["stdout"])
            entry["expected"] = want
            entry["actual"] = got
            entry["passed"] = want == got
            result["tests"].append(entry)
            continue

        tcap = _Capture()
        with tcap:
            try:
                if t.get("check"):
                    exec(compile(t["check"], "<test>", "exec"), ns)
                    entry["passed"] = True
                else:
                    expected = eval(compile(t["expected"], "<test>", "eval"), ns)
                    entry["expected"] = _short_repr(expected)
                    actual = eval(compile(t["call"], "<test>", "eval"), ns)
                    entry["actual"] = _short_repr(actual)
                    entry["passed"] = bool(_equal(actual, expected, t.get("compare", "exact")))
            except AssertionError as exc:
                entry["error"] = f"Assertion failed{': ' + str(exc) if str(exc) else ''}"
            except BaseException as exc:  # noqa: BLE001
                entry["error"], _ = _format_error(exc)
        entry["stdout"] = tcap.text()
        result["tests"].append(entry)

    return _json.dumps(result)
