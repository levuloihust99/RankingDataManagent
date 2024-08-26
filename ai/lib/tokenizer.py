import re

token_regex = re.compile(
    r"""
        [!\"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+ | # consecutive punctuations
        [^\s!\"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+ # words
    """,
    re.VERBOSE,
)


def tokenize_with_offsets(text: str) -> list[dict]:
    matches = token_regex.finditer(text)
    ret = []
    for match in matches:
        ret.append({"token": match.group(), "start": match.start(), "end": match.end()})
    return ret


def tokenize_with_whitespace(text: str) -> list[str]:
    tokens_with_offsets = tokenize_with_offsets(text)
    tokens_with_whitespaces = []
    pointer = 0
    for token_with_offset in tokens_with_offsets:
        if token_with_offset["start"] > pointer:
            tokens_with_whitespaces.append(text[pointer : token_with_offset["start"]])
        tokens_with_whitespaces.append(token_with_offset["token"])
        pointer = token_with_offset["end"]
    if token_with_offset["end"] < len(text):
        tokens_with_whitespaces.append(text[token_with_offset["end"] :])
    return tokens_with_whitespaces
