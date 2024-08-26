import re
from typing import Iterable, Optional

from .tokenizer import tokenize_with_whitespace


def calculate_ed(a: Iterable, b: Iterable, tracker: Optional[dict] = None):
    m = len(a)
    n = len(b)
    ed_table = [[-1] * (n + 1) for _ in range(m + 1)]
    for i in range(0, n + 1):
        ed_table[0][i] = i
    for j in range(0, m + 1):
        ed_table[j][0] = j
    trace = {}
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                ed_table[i][j] = ed_table[i - 1][j - 1]
                trace[(i, j)] = ("equal", (i - 1, j - 1))
            else:
                min_ed = ed_table[i][j - 1]
                prev = (i, j - 1)
                op = "insert"
                if min_ed > ed_table[i - 1][j]:
                    min_ed = ed_table[i - 1][j]
                    prev = (i - 1, j)
                    op = "delete"
                if min_ed > ed_table[i - 1][j - 1]:
                    min_ed = ed_table[i - 1][j - 1]
                    prev = (i - 1, j - 1)
                    op = "replace"
                ed_table[i][j] = 1 + min_ed
                trace[(i, j)] = (op, prev)
    if isinstance(tracker, dict):
        tracker["trace"] = trace
    return ed_table[m][n]


def diff_text(s1: str, s2: str) -> list[dict]:
    s1_tokens = tokenize_with_whitespace(s1)
    s2_tokens = tokenize_with_whitespace(s2)
    tracker = {}
    calculate_ed(s1_tokens, s2_tokens, tracker)
    trace = tracker["trace"]

    m = len(s1_tokens)
    n = len(s2_tokens)
    i = m
    j = n
    ops = []

    while i != 0 and j != 0:
        op, prev = trace[(i, j)]
        if op == "equal":
            ops.append({"op": "equal", "text": s2_tokens[j - 1]})
        elif op == "insert":
            ops.append({"op": "insert", "text": s2_tokens[j - 1]})
        elif op == "delete":
            ops.append({"op": "delete", "text": s1_tokens[i - 1]})
        elif op == "replace":
            ops.append(
                {"op": "replace", "text": s1_tokens[i - 1], "by": s2_tokens[j - 1]}
            )
        i, j = prev

    ops = ops[::-1]

    # first merge
    merged_ops = []
    is_prev_op_replace = False
    right_prev_op = None
    marked_idx = None
    for op in ops:
        if not merged_ops:
            merged_ops.append(op)
        else:
            if merged_ops[-1]["op"] == op["op"]:
                merged_ops[-1]["text"] += op["text"]
                if op["op"] == "replace":
                    merged_ops[-1]["by"] += op["by"]
            elif right_prev_op == "replace":
                if op["op"] == "insert":
                    merged_ops[-1]["by"] += op["text"]
                elif op["op"] == "delete":
                    merged_ops[-1]["text"] += op["text"]
            else:
                merged_ops.append(op)
            if is_prev_op_replace is True and op["op"] == "replace":
                to_merge_portion = merged_ops[marked_idx:]
                merged_ops = merged_ops[:marked_idx]
                merged_portion = []
                for _op in to_merge_portion:
                    if not merged_portion:
                        merged_portion = [_op]
                    else:
                        merged_portion[-1]["text"] += _op["text"]
                        if "by" in _op:
                            merged_portion[-1]["by"] += _op["by"]
                        else:
                            merged_portion[-1]["by"] += _op["text"]
                merged_ops += merged_portion
            if op["op"] == "replace":
                is_prev_op_replace = True
                marked_idx = len(merged_ops) - 1
            else:
                is_whitespace = re.match(r"^\s*$", op["text"])
                if not is_whitespace:
                    is_prev_op_replace = False
        right_prev_op = op["op"]
                    
    # second merge
    ops = merged_ops
                        

    return merged_ops
