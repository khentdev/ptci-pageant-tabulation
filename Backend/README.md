# Backend Template

This is a personal backend template designed for rapid project initialization and fast iteration.

It consolidates standardized coding patterns extracted from previous projects to ensure a DRY (Don't Repeat Yourself) workflow. This template significantly speeds up setup compared to writing boilerplate code from scratch.

## Dev database seed

```bash
npm run seed:admin   # once — creates admin from .env
npm run seed:dev     # wipes non-admin data, inserts PTCI 2026 scenario
```

See [`prisma/seeds/SEED_REFERENCE.md`](prisma/seeds/SEED_REFERENCE.md) for logins, round states, and error-toast test targets.