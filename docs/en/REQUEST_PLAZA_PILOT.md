# Request plaza reaction pilot

This one-week pilot validates demand before building a dedicated request plaza or adding another statistics service. Likes and claiming stay on GitHub, so the experiment adds no real-time Worker traffic.

> Implementation update (July 29, 2026): the website request plaza was approved for early implementation. GitHub Issues remain the source of truth for requests and claims; the site consumes a bounded static snapshot and adds anonymous, reversible support plus device-local progress follows.

## Pilot window

- Start: July 28, 2026
- End: August 4, 2026 at 10:00 UTC
- Requests: #69, #62, #50, #47, and #45
- Like: add a 👍 reaction to the issue's pilot comment
- Claim: a contributor comments that they want to make the pet; a maintainer applies `status: in-progress` after confirming the claim

One GitHub account contributes at most one visible reaction per issue. A like shows community interest; it is not an acceptance or delivery promise. Existing pets and requests for the same character must be linked rather than hidden. A new request remains valid when it asks for a clearly different, independently produced interpretation.

## Snapshot and review

Record one final snapshot after the window closes. Real-time aggregation is intentionally out of scope.

Review:

- likes per request and how concentrated they are
- new claims and the like-to-claim relationship
- duplicate requests discovered during the pilot
- moderation effort and unclear claim states

The first static request plaza now follows those boundaries: it consumes a bounded GitHub-generated snapshot during the build, reuses existing status labels, and reads static statistics on normal page loads instead of continuously polling the Worker. Pilot data still informs later decisions about sorting, claims, and community conversion.
