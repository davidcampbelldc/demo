# GitHub Multi-Account Configuration

## Overview

This repository is now configured to use **davidcampbelldc** (no hyphen) account, while other repositories can continue using **davidcampbell-dc** (with hyphen) account.

## SSH Configuration

### Account 1: davidcampbell-dc (with hyphen)
- **Host**: `github.com` (default)
- **SSH Key**: `~/.ssh/id_ed25519_github`
- **Authentication**: `Hi davidcampbell-dc!`

### Account 2: davidcampbelldc (no hyphen)
- **Host**: `github.com-davidcampbelldc` (alias)
- **SSH Key**: `~/.ssh/id_rsa`
- **Authentication**: `Hi davidcampbelldc!`

## Git Configuration

```bash
Username: davidcampbelldc
Email:    loadmagic@gmail.com
```

## This Repository

```
Remote URL: git@github.com-davidcampbelldc:davidcampbelldc/demo.git
```

This uses the **github.com-davidcampbelldc** host alias, which authenticates with the `davidcampbelldc` account.

## Other Repositories

Repositories using the default `git@github.com:...` format will authenticate with the **davidcampbell-dc** account.

Examples:
- `dcai` → uses default github.com → davidcampbell-dc account
- `peak3000` → uses github.com-davidcampbelldc → davidcampbelldc account
- `jmeter-dcai` → uses github.com-davidcampbelldc → davidcampbelldc account

## Testing SSH Authentication

```bash
# Test davidcampbell-dc account (default)
ssh -T git@github.com

# Test davidcampbelldc account (alias)
ssh -T git@github.com-davidcampbelldc
```

## Creating New Repos

### For davidcampbelldc account:
```bash
git remote add origin git@github.com-davidcampbelldc:davidcampbelldc/repo-name.git
```

### For davidcampbell-dc account:
```bash
git remote add origin git@github.com:davidcampbell-dc/repo-name.git
```

## Troubleshooting

If you get authentication errors, check which account is being used:
```bash
ssh -T git@[host]
```

This will tell you which GitHub account is authenticated.
