# 1. Record architecture decisions

Date: 2026-06-25

## Status

Accepted

## Context

We need to record the architectural decisions made on this project, so the reasoning survives the
people and agents who made them, and so a future contributor can tell *why* a thing is the way it is.

## Decision

We will use Architecture Decision Records, as described by Michael Nygard, stored in
`.agentic/decisions/` and numbered sequentially. Each significant or hard-to-reverse decision —
especially anything that changes the locked stack — gets an ADR.

## Consequences

Decisions are durable and reviewable. The cost is the discipline of writing one when it matters; the
payoff is that no one has to reverse-engineer intent from code.
