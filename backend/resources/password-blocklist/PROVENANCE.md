# Approved local password blocklist — T009 / D097

- Upstream: https://github.com/danielmiessler/SecLists
- Immutable source revision: `1e3a7423c117ea878679a29c760564fe442021c0`.
- Source path: `Passwords/Common-Credentials/10k-most-common.txt`.
- Downloaded on 2026-10-29 (Asia/Bangkok), unchanged bytes.
- Corpus SHA-256: `68782d6a4a19a4768d5f15dd66bd534e7a33055cc755411e33f16d18c50fdcce`.
- License: upstream MIT notice retained verbatim in `LICENSE`.
- License SHA-256: `3dbdc93d5f8829de0941744841730a09c106d0732e5ae0e98ca1d77be7ded66c`.

The credential module verifies the corpus checksum and compares exact password
strings locally; it never calls a password API. Business-field normalization is
never applied to password input. The hash receives the original UTF-8 bytes.
These are public test strings, never user credentials. Copy `resources/` with
the backend artifact when packaging deployment in T018.
