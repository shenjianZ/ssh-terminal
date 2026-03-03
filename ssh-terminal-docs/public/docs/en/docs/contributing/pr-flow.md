# PR Flow

This document introduces how to contribute code to the SSH Terminal project, including branch management, submission flow, Code Review, and other best practices.

## Table of Contents

- [PR Flow Overview](#pr-flow-overview)
- [Branch Management](#branch-management)
- [Creating Pull Request](#creating-pull-request)
- [Code Review](#code-review)
- [Handling Feedback](#handling-feedback)
- [Merging Pull Request](#merging-pull-request)
- [Common Questions](#common-questions)

---

## PR Flow Overview

### Standard Submission Flow

```
1. Fork Repository
   ↓
2. Clone to Local
   ↓
3. Create Feature Branch
   ↓
4. Develop and Commit
   ↓
5. Push to Remote
   ↓
6. Create Pull Request
   ↓
7. Code Review
   ↓
8. Modify and Update
   ↓
9. Merge to Main Branch
```

### Workflow Diagram

```
master (main branch)
  ↑
  │ Merge
  │
feature/your-feature (feature branch)
  ↑
  │ Push
  │
local (local development)
```

---

## Branch Management

### Branch Strategy

SSH Terminal uses **Git Flow** branch strategy:

| Branch | Description | Protection Rules |
|--------|-------------|------------------|
| `main` | Main branch, stable version | ✅ Must pass CI ✅ Requires Review ✅ Direct push forbidden |
| `develop` | Development branch, integrates new features | ✅ Must pass CI ✅ Requires Review |
| `feature/*` | Feature branches | - |
| `fix/*` | Fix branches | - |
| `release/*` | Release branches | - |

### Branch Naming Conventions

#### Feature Branches

```bash
feature/feature-name
feature/ssh-public-key-auth
feature/ai-streaming-response
```

#### Fix Branches

```bash
fix/issue-name
fix/ssh-connection-timeout
fix/ai-api-error-handling
```

#### Release Branches

```bash
release/version-number
release/1.2.0
```

### Create Feature Branch

```bash
# 1. Ensure on main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development
# ...
```

---

## Creating Pull Request

### Pre-Check

Before creating PR, ensure:

- [ ] Code passes all tests
- [ ] Code passes ESLint check
- [ ] Code passes Prettier formatting
- [ ] Code passes Rust clippy check
- [ ] Added necessary tests
- [ ] Updated related documentation
- [ ] Commit message follows standards

### Submit Code

```bash
# 1. Add changes
git add .

# 2. Commit changes
git commit -m "feat: add new feature"

# 3. Push to remote
git push origin feature/your-feature-name
```

### Commit Message Standards

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation update |
| `style` | Code formatting (no functional changes) |
| `refactor` | Refactoring (not new feature nor fix) |
| `test` | Test related |
| `chore` | Build/toolchain related |

#### Examples

```
feat(ssh): add public key authentication support

Added SSH public key authentication feature, supporting RSA, ECDSA and Ed25519 keys.
Users can select local private key file and enter key password (if any).

Closes #123
```

```
fix(ai): resolve streaming response buffering issue

Fixed buffering issue during AI streaming responses, now can display response content in real-time.
Problem was caused by improper implementation of event listener.

Fixes #456
```

### Create PR

#### Create via GitHub

1. Visit repository page
2. Click "Pull requests"
3. Click "New pull request"
4. Select your feature branch
5. Fill in PR template
6. Click "Create pull request"

#### PR Template

```markdown
## Description
Briefly describe the content and purpose of this PR.

## Type
- [ ] New feature (feat)
- [ ] Bug fix (fix)
- [ ] Documentation update (docs)
- [ ] Code refactoring (refactor)
- [ ] Test related (test)
- [ ] Other (chore)

## Changes
- Added ...
- Modified ...
- Deleted ...

## Testing
- [ ] Added unit tests
- [ ] Added integration tests
- [ ] All tests pass

## Screenshots
If UI changes are involved, please provide screenshots.

## Related Issue
Closes #123

## Checklist
- [ ] Code passes ESLint check
- [ ] Code passes Prettier formatting
- [ ] Code passes Rust clippy check
- [ ] Added necessary tests
- [ ] Updated related documentation
```

---

## Code Review

### Reviewer Checklist

#### Code Quality

- [ ] Code logic is clear and easy to understand
- [ ] No duplicate code
- [ ] Follows project code standards
- [ ] No security vulnerabilities
- [ ] No performance issues

#### Functional Correctness

- [ ] Feature implementation meets requirements
- [ ] Edge cases handled correctly
- [ ] Error handling is comprehensive
- [ ] Test coverage is sufficient

#### Documentation Completeness

- [ ] Added necessary comments
- [ ] Updated related documentation
- [ ] Commit message is clear

#### Compatibility

- [ ] Does not break existing functionality
- [ ] Backward compatible (if applicable)
- [ ] Cross-platform compatible

### Review Comments

#### Suggested Changes (Non-blocking)

``` markdown
**Suggestion**: Consider using `useMemo` to optimize performance.

Current implementation recalculates array on every render, can use `useMemo` to cache results.
```

#### Required Changes (Blocking)

**Issue**: Memory leak risk exists.

In `useEffect`, timer is not cleaned up, suggest adding cleanup function:

``` typescript
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);  // ✅ Add cleanup
}, []);
```

#### Questions

**Question**: Why choose to use `HashMap` instead of `BTreeMap`?

Considering performance and memory usage, can you explain the reason for this choice?

---

## Handling Feedback

### Modify Code

Modify code based on Reviewer feedback:

```bash
# 1. Create fix branch (optional)
git checkout feature/your-feature-name
git checkout -b fix/pr-feedback

# 2. Modify code
# ...

# 3. Commit modifications
git add .
git commit -m "fix: address review feedback"

# 4. Push to remote
git push origin fix/pr-feedback
```

### Update PR

Modifications will automatically update to original PR, no need to create new PR.

### Reply to Comments

For each Review comment, you need to reply:

- **Fixed**: Explain how it was fixed
- **Not Fixed**: Explain reason
- **Need Discussion**: Ask questions or make suggestions

```markdown
@reviewer Thanks for the suggestion! I've added cleanup function, please review again.
```

---

## Merging Pull Request

### Pre-Merge Check

- [ ] All CI checks pass
- [ ] At least one Reviewer approved
- [ ] All Review comments addressed
- [ ] No merge conflicts

### Merge Methods

#### Squash and Merge (Recommended)

```bash
# Squash multiple commits into one
git checkout main
git pull origin main
git merge --squash feature/your-feature-name
git commit -m "feat: add new feature"
git push origin main
```

#### Merge Commit

```bash
# Keep all commit history
git checkout main
git pull origin main
git merge feature/your-feature-name
git push origin main
```

### Delete Branch

```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name
```

---

## Common Questions

### Q1: How to resolve merge conflicts?

```bash
# 1. Switch to feature branch
git checkout feature/your-feature-name

# 2. Pull latest main branch
git fetch origin
git merge origin/main

# 3. Resolve conflicts
# Edit conflict files, keep needed code

# 4. Commit merge
git add .
git commit -m "resolve merge conflicts"

# 5. Push to remote
git push origin feature/your-feature-name
```

### Q2: How to undo commits?

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo pushed commit (create new commit)
git revert HEAD
```

### Q3: How to update outdated PR?

```bash
# 1. Switch to feature branch
git checkout feature/your-feature-name

# 2. Pull latest main branch
git fetch origin
git rebase origin/main

# 3. Push to remote
git push origin feature/your-feature-name --force
```

### Q4: How to view commit history?

```bash
# View commit history
git log --oneline --graph --all

# View commit history for specific file
git log --follow filename

# View commit details
git show <commit-hash>
```

### Q5: How to temporarily save work?

```bash
# Save current work
git stash

# View saved work
git stash list

# Restore saved work
git stash pop

# Delete saved work
git stash drop
```

---

## Related Resources

- [Git Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) - Git Flow
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit standards