# 3. Signed session cookies

Status: accepted

## Context

Tokens in local storage are readable by any script on the page (supersedes 0002).

## Decision

Keep the session in an HttpOnly, signed cookie.
