# Scoring Criteria Reference

Copy-paste reference for the scoring fields (criteria) of every category.
Enter these manually in the deployed admin UI: **Categories → [ Fields ] → Save Fields**.

Every category must total exactly **100**. The system enforces this — `Save Fields` stays
disabled until the live counter reads `100 / 100`, and the backend rejects anything else
with `CATEGORY_FIELDS_TOTAL_INVALID`.

> **Enter these before judging starts.** A category locks permanently the moment any judge
> submits a score for it (`CATEGORY_LOCKED`) — the field editor becomes read-only and the
> criteria can no longer be changed.

---

## Round 1 — Preliminary

### Advocacy

| Field name | Max score |
|---|---|
| Content & Relevance of Advocacy | 35 |
| Delivery & Communication Skills | 30 |
| Persuasiveness & Impact | 20 |
| Poise & Stage Presence | 15 |
| **Total** | **100** |

### Gown & Barong

| Field name | Max score |
|---|---|
| Elegance & Fit of Attire | 30 |
| Poise, Grace & Carriage | 30 |
| Stage Presence & Projection | 25 |
| Overall Impact | 15 |
| **Total** | **100** |

### Production

| Field name | Max score |
|---|---|
| Choreography & Execution | 35 |
| Synchronization & Timing | 25 |
| Showmanship & Energy | 25 |
| Costume & Overall Presentation | 15 |
| **Total** | **100** |

### School Uniform

| Field name | Max score |
|---|---|
| Proper Wearing & Neatness of Uniform | 30 |
| Poise & Bearing | 30 |
| Confidence & Personality | 25 |
| Overall Impression | 15 |
| **Total** | **100** |

### Swimwear — single field

| Field name | Max score |
|---|---|
| Overall Impression (Figure, Poise & Confidence) | 100 |
| **Total** | **100** |

Alternative wording if the panel prefers a different name for the single field:

- `Body Proportion, Poise & Stage Projection`
- `Overall Physical Fitness & Confidence`

---

## Round 2 — Top 5

### Gown

| Field name | Max score |
|---|---|
| Elegance & Fit of Gown | 30 |
| Poise, Grace & Carriage | 30 |
| Stage Presence & Projection | 25 |
| Overall Impact | 15 |
| **Total** | **100** |

### Question & Answer

| Field name | Max score |
|---|---|
| Content & Substance of Answer | 40 |
| Delivery & Articulation | 30 |
| Relevance to the Question | 20 |
| Confidence & Composure | 10 |
| **Total** | **100** |

---

## Quick reference

```
PRELIMINARY
  Advocacy          35 / 30 / 20 / 15
  Gown & Barong     30 / 30 / 25 / 15
  Production        35 / 25 / 25 / 15
  School Uniform    30 / 30 / 25 / 15
  Swimwear          100  (single field)

TOP 5
  Gown              30 / 30 / 25 / 15
  Q&A               40 / 30 / 20 / 10
```

All values are whole numbers and every category sums to exactly 100, so nothing rounds
awkwardly against the `decimal(5,2)` storage.

---

## Why these weights

- **Advocacy** and **Q&A** are message-driven, so substance carries the highest weight
  (35 and 40 respectively), with delivery second.
- The visual categories (**Gown & Barong**, **School Uniform**, **Gown**) weight poise and
  attire evenly at 30/30, since neither dominates the other on stage.
- **Production** leads with choreography execution (35) because it is a performance
  category; costume is a supporting element at 15.
- **Top 5 Gown** deliberately mirrors **Gown & Barong** so judges score the same way in
  both rounds and the two scores stay comparable.

---

## How to enter them

1. Admin → **Rounds** → confirm `Preliminary` and `Top 5` exist.
2. Admin → **Categories** → confirm all 7 categories exist under the correct round.
3. For each category, click **[ Fields ]**, add the rows above, and confirm the running
   total reads **100 / 100**.
4. Click **Save Fields**. Repeat for all 7 categories.

Fields are saved as a full batch — the backend replaces the entire field set for that
category in one transaction, so always submit the complete list.

---

## Notes and caveats

**Category weighting is equal, not per-category.** The overall score is the *unweighted
mean* of the per-category averages — there is no per-category weight setting. So each of
the 5 preliminary categories counts for 20% of the preliminary score, and Swimwear's
single 100-point field carries exactly the same weight as Advocacy's four fields combined.
If the instructor wants Advocacy to count for more than Swimwear, that is a
category-weighting change to the system, not something these fields can express.

**`maxValue` is the weight.** There is no separate percentage column. Judges score each
field directly out of its max value (minimum 1), and a judge's category total is the plain
sum of their field scores — which lands on a 0–100 scale precisely because the max values
sum to 100. There is no 1–10 scale conversion.

**Category naming.** The development seed data uses `"Production Number"` rather than
`"Production"`. Use whichever name the instructor specified — just keep it consistent
between this document and the deployed data.

**Categories are per-round.** `Gown & Barong` in Preliminary and `Gown` in Top 5 are two
separate category records with their own field sets. Entering fields for one does not
affect the other.
