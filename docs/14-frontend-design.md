# Frontend Design Skill

## Purpose

This document guides AI agents when designing or reshaping UI for DailySnap Expense.

Use this document for tasks involving:

- Mobile screens
- Navigation
- Camera flow
- Snap preview
- Timeline / Feed
- Memories / Calendar
- Statistics UI
- Profile / Social UI
- Visual redesigns

Do not use this document for backend-only tasks, database-only tasks, or pure API logic unless the task also changes visible UI behavior.

---

## Product direction

DailySnap Expense is a camera-first photo journal combined with expense tags.

The app should not feel like a generic expense tracker.

The product identity is:

- Camera-first
- Personal journal
- Dark mode
- Glassmorphism
- Mobile-native
- Snap cards
- Caption overlays
- Expense tags as metadata
- Memories over time

After login, the app should prioritize Camera/Home, not ExpenseList.

Users should feel:

> “I capture a moment first, then attach the money context.”

---

## Core design principles

### 1. Camera-first

The camera is the primary action.

Do not make “Add expense” the main CTA of the authenticated app shell.

Expense creation can still exist, but it should support the snap/journal flow.

### 2. Image is the hero

For Timeline, Memories, Camera Preview, and Social Feed:

- Use large image surfaces.
- Use rounded corners.
- Keep caption close to image context.
- Use expense tags as supporting metadata, not the main visual object.

### 3. Dark glass identity

Prefer:

- Sleek dark backgrounds
- Soft translucent surfaces
- Teal/amber highlights
- Large radii
- Subtle borders
- Soft shadows
- Minimal but expressive iconography

Avoid:

- Generic white cards
- Generic finance dashboard look
- Overly colorful SaaS templates
- Dense tables as primary UI

### 4. One signature element per screen

Each screen should have one memorable design idea.

Examples:

- Camera/Home: floating capture orb and privacy pill.
- Timeline: large snap card with bottom caption fog.
- Memories: month grid with glowing snap days.
- Statistics: one large money number with category atmosphere.
- Profile: soft avatar card with relationship/social actions.

Do not overload screens with too many visual effects.

### 5. Do not copy references 1:1

Reference apps such as Locket or Snap-style journals can inspire:

- Camera-first layout
- Bottom control feeling
- Memories grid
- Fullscreen image rhythm

But DailySnap Expense must have its own identity:

- Expense tags
- Caption + spending context
- Personal finance memory layer

### 6. React Native constraints

This project is React Native Expo SDK 54.

Do not propose web-only CSS, DOM APIs, or browser-specific layout.

Do not add animation/chart/UI libraries unless the current task explicitly allows it.

Use existing project UI tools first:

- `theme.ts`
- `GlassButton`
- `GlassInput`
- `GlassCard`
- React Native core components
- Existing installed navigation/image/camera packages

---

## Design process for UI tasks

Before coding a UI-heavy task, the agent must produce a short design plan.

The plan should include:

1. Screen purpose
2. User's main action
3. Visual direction
4. Color usage
5. Typography/spacing treatment
6. Layout structure
7. One signature element
8. What will stay intentionally simple
9. Risk or trade-off
10. How the UI fits camera-first flow

For important screens, include a small ASCII wireframe.

Example:

```txt
[ status / top pills ]

        [ large camera/photo area ]

[ caption / quick action area ]

[ bottom nav / capture controls ]
```

---

## Copywriting rules

UI text should be short and action-based.

Use Vietnamese labels that describe what users control.

Prefer:

* “Lưu snap”
* “Thêm chi tiêu”
* “Chụp lại”
* “Kỷ niệm”
* “Dòng thời gian”
* “Riêng tư”
* “Bạn bè”

Avoid vague text:

* “Submit”
* “OK”
* “Action”
* “Data”
* “Management”

Error messages should explain what to fix.

Good:

```txt
Vui lòng chọn danh mục.
File ảnh là bắt buộc.
Số tiền phải lớn hơn 0.
```

Bad:

```txt
Có lỗi xảy ra.
Invalid.
Failed.
```

---

## DailySnap Expense screen direction

### Camera/Home

Goal: capture first.

Design notes:

* Camera or camera entry should be dominant.
* Capture button should feel central.
* Privacy/friend visibility can be a soft top pill.
* Avoid showing too much finance data here.

### Snap Preview

Goal: prepare snap before saving.

Design notes:

* Show compressed image clearly.
* Caption input should feel like part of the image story.
* Privacy selector should be visible but not dominant.
* Quick expenses should look like small contextual tags/items.

### Timeline/Feed

Goal: review captured moments.

Design notes:

* Use vertical snap cards.
* Image large and rounded.
* Caption overlay near bottom of image.
* Expense tags below image or attached to card.
* Avoid turning Timeline into ExpenseList.

### Memories

Goal: revisit time.

Design notes:

* Month grid / calendar-like memory map.
* Days with snaps should glow or show thumbnails.
* Highlight streaks or recent memories if data supports it.
* Keep it emotional, not spreadsheet-like.

### Expenses

Goal: inspect spending details.

Design notes:

* This is supporting UI.
* Keep it clear and useful.
* It can be more data-oriented than Timeline, but should still share the same visual language.

### Statistics

Goal: understand spending pattern.

Design notes:

* Large total number can be the focal point.
* Category breakdown should be visual.
* Use colors intentionally and avoid generic chart dashboard look.

### Profile/Social

Goal: identity and relationships.

Design notes:

* Avatar and social actions should be simple.
* Friend features should feel private and personal.

---

## Quality checklist

Before finalizing a UI task, verify:

* The screen matches camera-first product direction.
* The UI does not look like a generic template.
* App.tsx is not accumulating screen UI.
* The screen uses existing theme/components where suitable.
* No unnecessary package was added.
* No web-only styling or APIs were used.
* Empty/error/loading states are handled.
* Touch targets are comfortable on mobile.
* Dark mode contrast is readable.
* TypeScript passes.
