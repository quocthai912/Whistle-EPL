# Authentication and administration: UC01-UC04

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

The records below convert PDF specification tables to Markdown, retaining content and step order; only headers/footers and line wrapping are removed. They are not new feature Specifications. Page and figure references follow the [source conventions](../sources.md). Class/sequence diagrams are analysis models in the report, not approved APIs, schemas, or code structures.

## UC01

**Log in**

Source: §2.4.1.1, pp.67-69 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows internal users to authenticate to access competition-management functions. Permissions follow assigned roles. Public viewers do not need to log in to view information permitted for publication.

**Description:**

Authenticate users and allow access according to their permissions.

**Actors:**

System Administrator, Competition Manager, and business staff issued accounts.

**Preconditions:**

1. The user has an account.
2. The system can process authentication requests.

**Postconditions:**

1. The user's identity is authenticated.
2. The user receives access according to their role.
3. The login event is recorded under security requirements.

**Main flow:**

1. The user opens the login function.
2. The system displays the form.
3. The user enters account credentials and password.
4. The system validates the input.
5. The system verifies the login credentials.
6. The system checks account status and permissions.
7. The system creates a valid session and records the login event.
8. The system redirects the user to the appropriate interface.

**Alternative flow:**

1. Required data is missing or incorrectly formatted: the system requests re-entry.

**Exceptions:**

1. Incorrect credentials: reject login and display an appropriate message.
2. Locked or disabled account: deny access.
3. Authentication or storage failure: report that processing is unavailable and do not create a valid logged-in state.

## UC02

**Log out**

Source: §2.4.1.2, pp.69-71 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows the user to end the current session. After logout, the ended session cannot be reused for internal operations.

**Description:**

End an authenticated working session.

**Actors:**

Logged-in internal user.

**Preconditions:**

The user has a current login session.

**Postconditions:**

1. The session is ended according to the system's authentication mechanism.
2. The user is redirected to the unauthenticated interface.
3. The logout event is recorded according to logging policy.

**Main flow:**

1. The user selects Log out.
2. The system checks the current session.
3. The system ends or invalidates the session using the implemented mechanism.
4. The system records the event.
5. The system redirects to the unauthenticated interface.

**Alternative flow:**

Session already expired: return the user to an unauthenticated state and display an appropriate message.

**Exceptions:**

Session-processing failure: report the error and do not allow further internal operations using an invalid session.

## UC03

**Manage accounts and roles**

Source: §2.4.1.3, pp.72-74 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows the administrator to manage internal user accounts, account status, and assigned roles. The function must ensure users perform business activities only within approved permissions.

**Description:**

Create, update, lock, unlock accounts and assign roles to users.

**Actors:**

System Administrator.

**Preconditions:**

1. The administrator is logged in.
2. The administrator has permission to manage accounts and roles.

**Postconditions:**

1. Account or role information is validly updated.
2. Important changes are recorded in the log.

**Main flow:**

1. The administrator opens account management.
2. The system displays the account list.
3. The administrator selects create, edit, lock, unlock, or assign roles.
4. The system validates data and permission to act.
5. The administrator confirms the change.
6. The system saves the data.
7. The system records the log and reports the result.

**Alternative flow:**

The administrator only searches accounts: display information within the permitted scope.

**Exceptions:**

1. Insufficient permissions: reject the operation.
2. Duplicate or invalid account information: request correction.
3. Data-save failure: do not retain partial changes.

## UC04

**Search activity logs**

Source: §2.4.1.4, pp.75-76 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to inspect important-operation history for checking, traceability, and accountability. Logs must identify the person, time, affected object, and changed content as required by security requirements.

**Description:**

Search and view business-operation logs within permitted access.

**Actors:**

System Administrator.

**Preconditions:**

1. The user is logged in.
2. The user has permission to search logs.

**Postconditions:**

Display logs matching the search conditions; searching does not modify log data.

**Main flow:**

1. The user opens activity-log search.
2. The system displays search conditions.
3. The user enters conditions such as time, operator, business-operation type, or object.
4. The system checks access rights.
5. The system searches logs.
6. The system displays the result list.
7. The user selects a record to view details.

**Alternative flow:**

No filters entered: display the list within permitted query limits.

**Exceptions:**

1. Insufficient permissions: deny access.
2. No results: report that no matching data was found.
3. Query failure: report that logs cannot be loaded.


