# Temporary credential handoff

Owner: D081/D008/D011, [administration](../../context/use-cases/administration.md). Apply after bootstrap or verified account reset; never create a shared administrator identity.

1. Verify the staff member and unique personnel code independently. Confirm username, environment and trusted HTTPS origin.
2. Authorized operator enters a new credential in the hidden TTY prompt: 15–128 Unicode code points with exact whitespace/case/accents; approved common-password rejection applies. Never put it in flags, env defaults, tickets, Git, logs or screenshots.
3. Deliver it only to the verified person through the organization's approved confidential channel. Agree channel/recipient with the operator; no email/SMS provider is selected. Communicate expiry/origin and retain no credential in the handoff record.
4. Temporary credentials expire after 24 hours. Once US2 is implemented, recipient logs in, completes the mandatory personal password change and logs in again. Until then only necessary change/logout access is allowed. Expiry requires authorized reissue; unlocking does not extend the credential or revive sessions. Pending UI behavior is not executed acceptance evidence.
5. Record non-secret evidence only: environment, verified recipient/personnel reference, issuing operator, issue/expiry times, confidential-channel confirmation and completion/reissue need. Reset/change invalidates all sessions. Dispose of temporary copies under the approved channel policy.

Remaining O08 evidence is actual operator/recipient delivery and completed lifecycle. Synthetic fixture credentials are isolated test inputs, never installation defaults.
