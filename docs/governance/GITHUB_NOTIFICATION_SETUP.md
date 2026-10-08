# GitHub Notification Setup (Owner Guide)

This guide explains practical notification settings for **AcingTime420/Acing-IU-Genesis**.

## Scope: what can be changed where

- **Repository files and documentation (including this file):** can be changed through repository pull requests.
- **Personal notification settings (web/email/mobile):** must be configured by each GitHub account holder.
- **Mobile push preferences:** must be configured by the account holder in GitHub Mobile.

## Recommended baseline (high signal, low noise)

### 1. Keep participating notifications on

In [GitHub notification settings](https://github.com/settings/notifications), keep **Participating** notifications enabled for:

- **On GitHub** (inbox)
- **Email** (optional, but useful as a searchable backup)

Participating notifications include activity such as mentions, assignments, and review requests according to GitHub's current notification settings.

### 2. Set custom watch options for this repository

Open the [Genesis repository](https://github.com/AcingTime420/Acing-IU-Genesis), select **Watch → Custom**, and choose the available categories relevant to you:

- Issues
- Pull requests
- Releases
- Security alerts, when offered

Keep other high-volume categories disabled unless you need them.

### 3. Prioritize reviews and required-check failures

Use the [GitHub notifications inbox](https://github.com/notifications) to review:

- Review requests and mentions
- Unread activity in Acing IU: Genesis
- Failed GitHub Actions workflows

Useful inbox filters to try:

```text
reason:review-requested repo:AcingTime420/Acing-IU-Genesis is:unread
repo:AcingTime420/Acing-IU-Genesis is:unread
```

Configure the **Actions** section in [notification settings](https://github.com/settings/notifications), prioritizing failures rather than every successful workflow run.

Reference: [Notifications for workflow runs](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs).

### 4. Configure Dependabot alert notifications

Dependabot **alerts** and Dependabot **security-update pull requests** are different notification surfaces:

- [Notification settings](https://github.com/settings/notifications): configure alert delivery and frequency where available.
- [Repository Dependabot alerts](https://github.com/AcingTime420/Acing-IU-Genesis/security/dependabot): review alerts if your account has the required repository permissions.
- Security-update pull requests are also surfaced through pull request participation and watch settings.

Keep actionable security alerts enabled and adjust their frequency to match your ability to triage them.

Reference: [Configure Dependabot notifications](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-dependabot-notifications).

### 5. Balance the GitHub inbox with email

In [notification settings](https://github.com/settings/notifications):

- Keep **On GitHub** enabled for triage.
- Consider **Email** for backup and longer-term searching.
- Optionally enable email/GitHub read-state synchronization if your email client supports it.
- Save important notifications in the GitHub inbox if they must remain available beyond normal inbox retention.

Reference: [Configuring notifications](https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications).

### 6. Configure GitHub Mobile for actionable push notifications

In GitHub Mobile on Android, open **Profile → Settings → Configure Notifications**. Enable the supported push categories useful to your workflow, such as:

- Direct mentions
- Assignments
- Pull request review requests

For Dependabot security alerts and workflow failures, use your configured web and email notifications rather than assuming every category supports mobile push. If useful, configure working hours to limit interruptions.

Reference: [GitHub Mobile](https://docs.github.com/en/get-started/using-github/github-mobile).

## Security note

Do not share email passwords, personal access tokens, notification tokens, or device secrets to configure notifications.
