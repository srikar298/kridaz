# Security Policy

We take the security of Kridaz 🏟️ seriously. If you believe you have found a security vulnerability, please report it to us responsibly as outlined below.

## Supported Versions

Only the latest active version of Kridaz is currently supported with security updates. We encourage all users and administrators to run the most recent release.

| Version | Supported |
| ------- | --------- |
| > v1.x  | ✅ Yes    |
| < v1.0  | ❌ No     |

## Reporting a Vulnerability

### 🚨 Direct Private Reporting on GitHub (Recommended)

We encourage users to use **GitHub Private Vulnerability Reporting** to report vulnerabilities securely. This allows you to report vulnerabilities directly to the repository maintainers without disclosing them publicly.

1. Navigate to the main page of the repository on GitHub.
2. Under the repository name, click **Security** (with the shield icon 🛡️).
3. In the left sidebar, click **Advisories**.
4. Click **Report a vulnerability** to open the advisory form.
5. Fill out the details of the vulnerability (including description, steps to reproduce, and impact) and click **Submit advisory**.

### ✉️ Email Reporting

If you prefer not to use GitHub's interface, or if private vulnerability reporting is disabled, you can report security issues by sending an email to our team:

- **Email:** `security@kridaz.com` _(or open an advisory through GitHub)_

Please include the following information in your report:

- **Component/Module affected**: (e.g., HTTP backend, Client dashboard, Reels service, Database models)
- **Vulnerability Type**: (e.g., SQL Injection, XSS, CSRF, RCE, IDOR, Privilege Escalation)
- **Description**: Detailed explanation of the vulnerability and its potential impact.
- **Steps to Reproduce**: Step-by-step instructions (and proof-of-concept code, if applicable) so we can reproduce the issue.
- **Remediation**: Suggestion on how to fix the issue, if you have one.

We request that you do **not** disclose the vulnerability publicly or in public issues until we have had an opportunity to address it.

## Our Commitment

We will acknowledge receipt of your report within **48 hours** and provide a status update on our investigation. If we confirm the vulnerability, we will work to release a patch or mitigation as quickly as possible. We will keep you updated throughout the process and credit you for the discovery (unless you request to remain anonymous).

Thank you for helping keep Kridaz secure!
