# Security

Clearlink is a self-hostable WebRTC application, not an audited calling service.

Media is encrypted in transit by WebRTC. Signalling and chat require trusted HTTPS for remote use. Room invitations act as access: anyone with the link or code can join a non-full room. There is no account authentication or host approval.

The server does not persist chat or record media. Participants may record, screenshot or copy independently. Public STUN observes public-facing network addresses; direct peers may learn each other’s connection addresses.

Use one server process behind HTTPS and keep its dependencies updated. Do not expose local certificate private keys or administrative secrets. Basic rate limiting is not comprehensive abuse protection.

## Dependency status

As of October 2026, `npm audit` reports zero advisories. Tailwind 3 depends on an older `postcss-selector-parser`, so `package.json` overrides it to the patched 7.x release; the built output is unchanged.

## Reporting

Please report security issues privately through GitHub: open this repository's **Security** tab and choose **Report a vulnerability**. Do not open a public issue for a vulnerability, and avoid posting credentials, session tokens or private call details anywhere public.
