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

    # modify ops
    modified_ops = []
    non_eq_op = None
    for idx, op in enumerate(ops):
        modified_ops.append({**op})
        if op["op"] != "equal":
            if non_eq_op and non_eq_op["op"] == op["op"]:
                for i in range(non_eq_op["idx"] + 1, idx):
                    modified_ops[i]["op"] = op["op"]
                    if op["op"] == "replace":
                        modified_ops[i]["by"] = modified_ops[i]["text"]
            non_eq_op = {"idx": idx, **op}
        else:
            is_whitespace = re.match(r"^\s*$", op["text"])
            if not is_whitespace:
                non_eq_op = None

    # first merge
    merged_ops = []
    for op in modified_ops:
        if not merged_ops:
            merged_ops.append({**op})
        else:
            if merged_ops[-1]["op"] == op["op"]:
                merged_ops[-1]["text"] += op["text"]
                if op["op"] == "replace":
                    merged_ops[-1]["by"] += op["by"]
            else:
                merged_ops.append({**op})

    # second merge
    second_merged_ops = []
    for op in merged_ops:
        if not second_merged_ops:
            second_merged_ops.append({**op})
        else:
            if op["op"] == "replace":
                if second_merged_ops[-1]["op"] != "equal":
                    second_merged_ops[-1]["op"] = "replace"
                    if second_merged_ops[-1]["op"] == "insert":
                        second_merged_ops[-1]["by"] = second_merged_ops["text"] + op["by"]
                        second_merged_ops[-1]["text"] = op["text"]
                    else: # delete
                        second_merged_ops[-1]["text"] = second_merged_ops["text"] + op["text"]
                        second_merged_ops[-1]["by"] = op["by"]
                else:
                    second_merged_ops.append({**op})
            elif op["op"] == "insert":
                if second_merged_ops[-1]["op"] == "replace":
                    second_merged_ops[-1]["by"] += op["text"]
                else:
                    second_merged_ops.append({**op})
            elif op["op"] == "delete":
                if second_merged_ops[-1]["op"] == "replace":
                    second_merged_ops[-1]["text"] += op["text"]
                else:
                    second_merged_ops.append({**op})
            else:
                second_merged_ops.append({**op})

    return second_merged_ops
