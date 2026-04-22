# FlashDeck Write-up

I built **FlashDeck**, a PDF-to-flashcard learning app focused on one core problem: students can collect notes, but they struggle to turn that material into high-quality practice and retain it over time.

Instead of only extracting text from PDFs and generating shallow cards, I designed a full learning loop where a student uploads a chapter (for example, quadratic equations or history notes), receives teacher-style question cards, and continues with spaced repetition and clear progress tracking.

## What I built

I built a full-stack flashcard platform with:

- PDF ingestion + AI card generation (OpenAI-first, with provider fallback)
- Strict card quality controls (question-style fronts, explanation-style backs, schema normalization)
- Spaced repetition review loop (SM-2 inspired grading with due dates)
- Progress analytics (reviews per day, mastery growth, status breakdown)
- Deck management (create/edit/delete/pin/public/private/search/filter)
- Resume flow (continue from where the learner left off)
- UX delight touches (milestone toasts, mastery feedback, session celebration)

## Problem I chose

I focused on the gap between **content conversion** and **effective studying**.

Many tools stop at "PDF -> cards."  
The harder and more valuable part is what happens after:

- Are cards actually useful?
- Is scheduling intelligent?
- Is progress visible but not overwhelming?
- Can users resume naturally after interruptions?

That is the problem FlashDeck is optimized for.

## Key decisions and tradeoffs

- **OpenAI-first provider strategy**  
  Decision: prioritize OpenAI for card generation, keep Gemini/Anthropic as fallback.  
  Tradeoff: better consistency vs added multi-provider parsing complexity.

- **Strict output schema (`front/back/hint/topic`)**  
  Decision: enforce one canonical schema and normalize variants.  
  Tradeoff: malformed outputs are rejected instead of saved in "best effort" mode.

- **No low-quality heuristic fallback**  
  Decision: remove "auto-extracted summarize" fallback cards.  
  Tradeoff: generation may fail fast, but weak cards are not shipped.

- **12-card generation cap**  
  Decision: hard-limit to 12 cards per upload run.  
  Tradeoff: less breadth per pass, better quality/focus/cost control.

- **Session resume persistence**  
  Decision: keep unfinished sessions and track `currentCardIndex`.  
  Tradeoff: more state handling, much better real-world continuity.

- **Mastery threshold tuning**  
  Decision: set mastery at `interval >= 7 && repetitions >= 3`.  
  Tradeoff: faster positive feedback vs stricter long-term mastery criteria.

## Challenges and how I solved them

- **Cards were generic/weak**  
  Cause: prompt-output mismatch and schema inconsistency.  
  Fix: tightened prompts, normalized fields, enforced question format, removed weak fallback.

- **Progress graph showed zero activity**  
  Cause: session stats were inconsistently written; legacy records were uneven.  
  Fix: hardened grade-to-session mapping, added fallback aggregation from grade counts, improved date handling.

- **Continue study reopened from card 1**  
  Cause: session finishing behavior and session selection issues.  
  Fix: switched early exit to pause behavior, resumed most-progressed unfinished session, persisted `currentCardIndex`.

- **Resume position mismatch (e.g., `1/36` vs `4/40`)**  
  Cause: due-subset list instead of full deck list.  
  Fix: aligned session flow to full deck list for stable position continuity.

## Highest-priority next upgrades

- Visible "shaky cards" widget (high lapses / low ease factor) so learners know what needs immediate attention
- Light/Dark mode toggle for comfortable day/night studying
- One-click review mode switch: "Due only" vs "Full deck"

## What I'd improve with more time

- Second-pass card critic/rewrite to improve weak AI cards automatically
- Adaptive difficulty sequencing for shaky cards
- Shaky-topic insights and recommendations
- Pagination + virtualization for very large deck libraries
- Quality scoring/moderation for public decks
- Better observability dashboards for generation, session, and stats pipelines
- Global leaderboard (weekly/all-time, friend mode, anti-cheat safeguards)
- Full theme system (Light/Dark/System) with persistent preference
- OTP-based authentication (signup/login/reset flows)

## Closing note

My biggest takeaway: AI generation alone is not enough.  
The real value comes from making the entire loop reliable and motivating - quality cards, smart scheduling, clear progress, and seamless resume behavior.

