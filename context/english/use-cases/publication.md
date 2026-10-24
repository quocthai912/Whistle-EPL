# Lookup, reports, and news: UC21-UC25

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

The records below convert PDF specification tables to Markdown, retaining content and step order; only headers/footers and line wrapping are removed. They are not new feature Specifications. Page and figure references follow the [source conventions](../sources.md). Class/sequence diagrams are analysis models in the report, not approved APIs, schemas, or code structures.

## UC21

**Look up match information**

Source: §2.4.1.21, pp.123-126 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows users to search match information by season, round, or club, including the pairing, time, stadium, and corresponding result. Information follows access rights; a score becomes public only after official confirmation.

**Description:**

Look up matches by season, round, or club; publish the score only after result confirmation.

**Actors:**

Public Viewer; Results Officer; Organizing Committee / Season Manager.

**Preconditions:**

The system has match data for the requested season.

**Postconditions:**

Display data matching search conditions without modifying business data.

**Main flow:**

1. The user opens match-information lookup.
2. The system requests a season or filter conditions.
3. The user enters conditions.
4. The system retrieves corresponding data.
5. The system checks publication status and access rights.
6. The system displays results.

**Alternative flow:**

No detailed conditions: display data within the default scope.

**Exceptions:**

1. No matching data: report no results.
2. Unconfirmed result: do not publish the score; published match information may still be shown.
3. Query failure: report that data cannot be loaded.

## UC22

**Generate and export competition reports**

Source: §2.4.1.22, pp.127-130 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to generate reports from confirmed data and applicable seasonal regulations. The function must provide BM5.1, BM5.2, and BM5.3. It must not fabricate unsupported data or substitute draft results for official ones.

**Description:**

Aggregate, display, and export competition reports in required business forms.

**Actors:**

Organizing Committee / Season Manager.

**Preconditions:**

1. The user has report-generation permission.
2. The target season exists.
3. Necessary source data is accessible.

**Postconditions:**

Aggregate reports from valid sources, with preview and file export in supported formats.

**Main flow:**

1. The user opens report generation.
2. The system requests the season and report type.
3. The user selects a supported report type.
4. The system checks permissions and source-data completeness.
5. The system aggregates data using the relevant rules.
6. The system displays a preview.
7. The user confirms export in a supported format.
8. The system creates the report file and provides it for download.

**Alternative flow:**

1. Season-summary conditions are unmet: report missing data or conditions.
2. The user changes report type: aggregate again for the selected type.

**Exceptions:**

1. Insufficient permissions: deny report generation.
2. Inconsistent source data: do not export it as official data.
3. Aggregation/export failure: report the error and do not return an incomplete file as a successful report.

## UC23

**Look up club and player information and statistics**

Source: §2.4.1.23, pp.130-133 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows users to search club/player information and statistics by season and access scope. Statistics must be aggregated from valid business data, particularly confirmed results and related events.

**Description:**

Search and view club/player information and statistics by season and filters.

**Actors:**

Public Viewer; Registration Officer; Organizing Committee / Season Manager.

**Preconditions:**

Club/player data exists for the requested season; statistics are aggregated from valid sources.

**Postconditions:**

Display information/statistics according to search conditions and access rights.

**Main flow:**

1. The user selects club/player information or statistics lookup.
2. The system requests the season and filters.
3. The user enters or selects conditions.
4. The system retrieves club/player information and related official results when statistics must be aggregated.
5. The system aggregates information and calculates or retrieves supported statistics.
6. The system checks permitted access and publication scope.
7. The system displays appropriate information and statistics.

**Alternative flow:**

No detailed filters: display statistics within the default scope.

**Exceptions:**

1. No data: report no results.
2. Insufficient data for aggregation: report data limitations.
3. Query failure: report that statistics cannot be loaded.

## UC24

**Manage competition news and announcements**

Source: §2.4.1.24, pp.134-136 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows the Organizing Committee to create, update, and manage news/announcement statuses for the Premier League. Content may be saved as draft or published with appropriate authority; only published content is public.

**Description:**

Create, update, manage status, and publish competition news and announcements.

**Actors:**

Organizing Committee / Season Manager.

**Preconditions:**

The operator is logged in and has permission to manage competition news and announcements.

**Postconditions:**

Save content in an appropriate status; only published content is publicly visible.

**Main flow:**

1. The user opens competition news/announcement management.
2. The system displays existing announcements.
3. The user creates or updates content.
4. The system checks management permission and required information.
5. The user confirms saving.
6. The system saves content and reports the result.

**Alternative flow:**

1. List only: display announcements according to permissions.
2. The user publishes saved content: check publication permission, change status to published, and record the action.

**Exceptions:**

1. No management permission: reject.
2. Missing required content information: request correction.
3. No publication permission: reject publication and preserve content status.

## UC25

**View competition news and announcements**

Source: §2.4.1.25, pp.136-139 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows users to search and view news/announcement lists and content published by the Organizing Committee. Only published content is publicly visible.

**Description:**

Display published competition news/announcement lists and content.

**Actors:**

Public Viewer.

**Preconditions:**

The news/announcement viewing function is operational.

**Postconditions:**

The user can view content permitted for publication.

**Main flow:**

1. The user opens competition news and announcements.
2. The system displays published news and announcements.
3. The user selects an item to view.
4. The system checks publication status.
5. The system displays the content.

**Alternative flow:**

No published news or announcements: display an empty-list state.

**Exceptions:**

1. Content is no longer permitted for publication: do not display it.
2. Query failure: report that data cannot be loaded.


