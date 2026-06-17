# Agent Guidelines

Welcome, agent! This file defines the guidelines, processes, and rules for AI agents working on this project.

## Core Rule
**Always read this file (`AGENTS.md`) and the relevant files in the `docs/` folder before writing or modifying any code.**

## Project Structure
- `AGENTS.md`: Agent rules and guidelines (this file).
- `docs/`: System documentation (updated as the project evolves).
  - `00-project.md`: Project summary, goals, scope, and timeline.
  - `01-business.md`: Business context, workflow, and logic.
  - `02-requirement.md`: Functional and non-functional requirements.
  - `03-user-story.md`: User stories and acceptance criteria.
  - `04-domain.md`: Domain models, entities, and terminology.
  - `05-architecture.md`: System design and high-level architecture.
  - `06-tech-stack.md`: Technology choices, libraries, and frameworks.
  - `07-database.md`: Database schemas, migrations, and patterns.
  - `08-api.md`: API endpoints, request/response models, and protocols.
  - `09-ui.md`: UI/UX designs, wireframes, and layouts.
  - `10-coding-rule.md`: Coding standards, linting, testing, and conventions.
  - `11-task.md`: Tasks and progress tracking.
  - `12-review.md`: Project reviews, retro, and technical debt log.
  - `13-flow.md`: Mobile/backend user flows, navigation flows, and feature flows.
  - `14-frontend-design.md`: Frontend/mobile visual design skill and camera-first UI direction.

## How to Work
1. **Understand first**: Check the requirements in `docs/` before implementing any feature.
2. **Design before coding**: Update `docs/` (especially domain, architecture, database, API, UI, coding-rule) and verify with the user if needed.
3. **Write tests**: Follow the guidelines in `docs/10-coding-rule.md`.
4. **Update docs**: When code implementation changes behavior, update the corresponding markdown documentation in `docs/`.
5. **Keep tasks updated**: Track progress in `docs/11-task.md`.

## Frontend/UI Design Rule

For any task that creates or changes mobile UI, navigation, screen layout, camera flow, timeline, memories, statistics, profile, or social UI, the agent must read:

- `docs/09-ui.md`
- `docs/10-coding-rule.md`
- `docs/14-frontend-design.md`

Before coding, the agent must produce a short UI/design plan when the task is visually significant.

The design must follow the DailySnap Expense camera-first direction and must not look like a generic expense tracker template.
