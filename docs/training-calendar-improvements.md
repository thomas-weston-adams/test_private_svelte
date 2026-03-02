# KYEM Training Calendar: Improvement Recommendations

## Context
I could not directly retrieve the public page content from this environment because outbound HTTP access to the URL returned a `403 Forbidden` response during analysis.

## High-impact improvements (prioritized)

1. **Improve findability with stronger filtering and search**
   - Add filters for: region, course type, delivery mode (in-person/virtual), audience (EM staff, elected officials, volunteers), and date range.
   - Add keyword search that supports common abbreviations (e.g., EOC, ICS, NIMS).
   - Include “Clear all filters” and preserve filter state in the URL for sharing.

2. **Offer two calendar views + one list view**
   - Keep a monthly calendar view for visual planning.
   - Add an agenda/list view for accessibility and easier scanning on mobile.
   - Add a compact “upcoming 30/60/90 days” view for quick decision-making.

3. **Strengthen event detail pages**
   - Standardize fields: prerequisites, seat limits, registration deadline, CEU/credit, instructor, location map, parking/access notes, and cancellation policy.
   - Add explicit “Who should attend?” language and expected outcomes.
   - Show last-updated timestamp and a contact method for each event.

4. **Reduce friction for registration**
   - Put one primary CTA per event: `Register`.
   - Pre-fill common profile fields for returning users (if authenticated).
   - Confirm submission with clear next steps and calendar invite download (`.ics`).

5. **Accessibility and readability upgrades**
   - Ensure WCAG 2.2 AA color contrast, keyboard navigation, and visible focus states.
   - Use semantic headings and landmark regions.
   - Ensure tables/calendars are screen-reader friendly and have text alternatives.
   - Keep plain-language summaries and avoid acronym-only labels.

6. **Mobile-first improvements**
   - Keep filters in an expandable drawer with sticky “Apply”/“Reset.”
   - Ensure date pickers and controls are touch-friendly.
   - Keep event cards concise with progressive disclosure for details.

7. **Trust and transparency signals**
   - Add clear cancellation/weather policy and auto-notification commitment.
   - Show “new/updated/cancelled” badges with timestamps.
   - Provide direct contact for accommodation requests.

8. **Data quality and content governance**
   - Create a single event data model and publishing checklist.
   - Enforce required fields before publishing.
   - Add ownership (who updates what, and when) with SLA for changes.

9. **Performance and technical SEO**
   - Optimize Largest Contentful Paint, defer non-critical scripts, and compress assets.
   - Use structured data where applicable (Event schema) to improve discoverability.
   - Add clean page titles and meta descriptions for calendar/event pages.

10. **Measurement and continuous improvement**
   - Track key metrics: search usage, registration conversion rate, drop-off points, and mobile task completion.
   - Run quarterly usability checks with representative emergency management users.
   - Establish a lightweight experimentation cadence (A/B tests for CTA and form steps).

## Quick-win roadmap

### 0–30 days
- Clarify event detail template and required fields.
- Improve CTA consistency and confirmation messaging.
- Fix obvious accessibility issues (contrast, heading order, focus styles).

### 31–60 days
- Release filter improvements and agenda/list view.
- Add export options (`.ics`, “Add to Google/Outlook”).
- Add “updated/cancelled” badges and policy links.

### 61–90 days
- Add analytics dashboard and funnel reporting.
- Implement schema markup and performance optimizations.
- Conduct moderated usability sessions and prioritize findings.

## Suggested KPIs
- Registration conversion rate (visit → registration complete).
- Time-to-find (seconds to locate relevant training).
- Mobile completion rate for registration.
- Accessibility defect count over time.
- % events updated within governance SLA.
