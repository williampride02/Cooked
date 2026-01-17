---
title: "Story 7.4 - Stakes System (Post-MVP Placeholder)"
aliases:
  - "Story 7.4"
  - "Stakes System"
  - "Post-MVP Placeholder"
tags:
  - cooked
  - implementation
  - story
  - epic-7
  - post-mvp
  - monetization
status: ready-for-dev
created: 2026-01-16
updated: 2026-01-16
epic: 7
story: 4
related:
  - "[[Architecture]]"
  - "[[Epics]]"
---

# Story 7.4: Stakes System (Post-MVP Placeholder)

Status: ready-for-dev

## Story

As a **pact creator**,
I want **to add money stakes to pacts**,
So that **there are real financial consequences for folding**.

## Acceptance Criteria

**Note: This story is deferred to post-MVP. This is a placeholder for future implementation.**

1. **AC1: Add Stakes to Pact (Future)**
   - Given the stakes feature is enabled (future)
   - When I create a pact
   - Then I can optionally add a stake amount
   - And the stake amount is displayed to all participants

2. **AC2: Stakes Collection (Future)**
   - Given stakes are active
   - When someone folds
   - Then their stake goes to the pot
   - And winners split the pot at the end of the pact period

3. **AC3: Facilitation Fee (Future)**
   - Given Cooked facilitates stakes
   - When money is transferred
   - Then Cooked takes a 5-10% facilitation fee
   - And the remainder is distributed to winners

## Tasks / Subtasks

- [ ] **Task 1: Research Payment Processing** (Future)
  - [ ] Research Stripe Connect for marketplace payments
  - [ ] Research legal requirements for money handling
  - [ ] Research tax implications
  - [ ] Design payment flow architecture

- [ ] **Task 2: Database Schema Design (Future)**
  - [ ] Design stakes table structure
  - [ ] Design payment tracking tables
  - [ ] Design escrow/pot management
  - [ ] Design winner distribution logic

- [ ] **Task 3: Stripe Integration (Future)**
  - [ ] Set up Stripe Connect accounts
  - [ ] Implement payment collection
  - [ ] Implement escrow holding
  - [ ] Implement payout distribution

- [ ] **Task 4: UI/UX Design (Future)**
  - [ ] Design stakes selection in pact creation
  - [ ] Design stakes display in pact details
  - [ ] Design pot/winnings display
  - [ ] Design payment confirmation flows

- [ ] **Task 5: Legal and Compliance (Future)**
  - [ ] Consult legal counsel on money handling
  - [ ] Set up terms of service for stakes
  - [ ] Set up user agreements
  - [ ] Implement age verification (18+)

## Dev Notes

### Architecture Requirements (Future)

**Payment Processing:**
- Stripe Connect for marketplace model
- Escrow account for holding stakes
- Automated payout system
- Fee calculation and collection

**Database Schema (Future):**
- `pact_stakes` table for stake amounts per pact
- `stake_payments` table for payment tracking
- `stake_pot` table for escrow tracking
- `stake_distributions` table for winner payouts

**Legal Considerations:**
- Money transmission licenses (varies by jurisdiction)
- Tax reporting requirements
- User age verification (must be 18+)
- Terms of service and user agreements
- Dispute resolution process

### Technical Notes

**From Epics:**
- Implements: FR-PAY-004
- Requires: Stripe Connect integration
- Status: DEFERRED to post-MVP
- Facilitation fee: 5-10%

**From Architecture:**
- Stripe mentioned as post-MVP payment solution
- Requires careful legal and compliance planning
- Complex implementation due to money handling regulations

**Deferral Rationale:**
- MVP focuses on core accountability features
- Stakes add significant legal/compliance complexity
- Payment processing requires additional infrastructure
- Better to validate core product before adding monetization complexity

**Future Implementation Notes:**
- Start with research phase (legal, technical, UX)
- Prototype with test mode first
- Roll out gradually by jurisdiction
- Consider starting with small stakes only
- Implement robust fraud prevention

### References

- [Source: planning-artifacts/epics.md#Story-7.4]
- [Source: planning-artifacts/architecture.md#External-Services]
- [Source: planning-artifacts/prd.md#FR-PAY-004]

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

**Current Status:** Placeholder story file created. Implementation deferred to post-MVP.

**Next Steps (Post-MVP):**
1. Legal consultation on money handling
2. Stripe Connect integration research
3. Database schema design
4. Prototype development
5. Beta testing with small user group

### File List

TBD (No files created - placeholder story)
