# Backend (Symfony) — learning demo

A **syntax-learning** Symfony + Doctrine backend for the incident wizard. It
shows how **one JSON object** from the Vue form is fanned out into **four
database tables**. It is intentionally **not runnable** — there's no `composer`,
no config, and no database yet. Read it as annotated reference code.

## The idea in one picture

The form sends one JSON object. The `POST` controller splits it across tables:

```
              incoming JSON (one object)
                        │
        ┌───────────────┼───────────────────────────┐
        ▼               ▼                            ▼
 incident_report   participant (×N)          (per injured participant)
  type,location,    name, role, injured               │
  occurred_at,          │                    ┌─────────┴──────────┐
  description,          │                    ▼                    ▼
  status, created_at    └── FK ──▶       injury              first_aid_used (×M)
                                     details, participant_id   aid, injury_id
```

- `incident_report` — one row per report.
- `participant` — one row per person (FK `incident_report_id`).
- `injury` — one row per **injured** participant (FK `participant_id`).
- `first_aid_used` — one row **per item** in the `firstAid` array (FK `injury_id`).

## Files

```
backend/
└── src/
    ├── Entity/
    │   ├── IncidentReport.php   # table incident_report  (1 ─▶ n participants)
    │   ├── Participant.php      # table participant      (n ─▶ 1 incident, 1 ─▶ 1 injury)
    │   ├── Injury.php           # table injury           (1 ─▶ n first_aid_used)
    │   └── FirstAidUsed.php     # table first_aid_used
    └── Controller/
        └── IncidentController.php  # GET list, GET one, POST create
```

## Endpoints

| Method & path            | What it does                                  |
| ------------------------ | --------------------------------------------- |
| `GET /api/incidents`     | List all incidents (nested participants).     |
| `GET /api/incidents/{id}`| One incident by id, or `404`.                 |
| `POST /api/incidents`    | Create; splits the JSON across the 4 tables.  |

### Example `POST` body (what the Vue form sends)

```json
{
  "type": "work",
  "location": "Warehouse B, loading dock",
  "occurredAt": "2026-07-22T14:30:00",
  "description": "Slipped on a wet floor.",
  "status": "submitted",
  "participants": [
    {
      "name": "Alice Tan",
      "role": "Operator",
      "injured": true,
      "injuryDetails": "Cut on left hand",
      "firstAid": ["Bandage / dressing", "Disinfection"]
    },
    { "name": "Bob Lee", "role": "Witness", "injured": false, "injuryDetails": "", "firstAid": [] }
  ]
}
```

That single body produces: **1** `incident_report` row, **2** `participant`
rows, **1** `injury` row (only Alice), and **2** `first_aid_used` rows.

## Syntax concepts to take away

- **Entity = table.** A plain PHP class becomes a table via `#[ORM\Entity]` /
  `#[ORM\Table]`; each `#[ORM\Column]` property becomes a column.
- **Relationships** are declared with `#[ORM\OneToMany]`, `#[ORM\ManyToOne]`,
  `#[ORM\OneToOne]`. The side with `#[ORM\JoinColumn]` **owns the foreign key**.
- **Cascade persist** (`cascade: ['persist']`) is the trick that lets a single
  `$em->persist($report); $em->flush();` write to all four tables — Doctrine
  walks the object graph for you.
- **Keep both sides in sync** with helper methods (`addParticipant`,
  `setInjury`, `addFirstAidUsed`) so the FK always gets set.
- **Controller** = a class; methods map to routes via `#[Route(..., methods: [...])]`.
  Type-hinted services like `EntityManagerInterface` are **auto-injected**.
- **Request/response**: `json_decode($request->getContent(), true)` reads the
  body; `$this->json(...)` writes the response.
- **DATETIME2**: Doctrine's `datetime` type maps to `DATETIME2` on SQL Server,
  matching the `occurredAt` value the form builds.

## What's intentionally left out

- Images (`incident_image` table) — add later, same pattern.
- Validation, auth, error handling beyond a couple of guards.
- `composer.json`, framework config, migrations, and an actual database.
- Timezone handling: `DATETIME2` stores no offset. When we wire up the DB we'll
  decide local vs UTC (or switch to `DATETIMEOFFSET`).
