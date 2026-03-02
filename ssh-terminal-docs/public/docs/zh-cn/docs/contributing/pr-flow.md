# 提交流程

本文档介绍如何为 SSH Terminal 项目贡献代码，包括分支管理、提交流程、Code Review 等最佳实践。

## 目录

- [提交流程概述](#提交流程概述)
- [分支管理](#分支管理)
- [创建 Pull Request](#创建-pull-request)
- [Code Review](#code-review)
- [处理反馈](#处理反馈)
- [合并 Pull Request](#合并-pull-request)
- [常见问题](#常见问题)

---

## 提交流程概述

### 标准提交流程

```
1. Fork 仓库
   ↓
2. 克隆到本地
   ↓
3. 创建功能分支
   ↓
4. 开发并提交
   ↓
5. 推送到远程
   ↓
6. 创建 Pull Request
   ↓
7. Code Review
   ↓
8. 修改并更新
   ↓
9. 合并到主分支
```

### 工作流程图

```
main (主分支)
  ↑
  │ 合并
  │
feature/your-feature (功能分支)
  ↑
  │ 推送
  │
local (本地开发)
```

---

## 分支管理

### 分支策略

SSH Terminal 使用 **Git Flow** 分支策略：

| 分支 | 说明 | 保护规则 |
|------|------|---------|
| `main` | 主分支，稳定版本 | ✅ 必须通过 CI ✅ 需要 Review ✅ 禁止直接推送 |
| `develop` | 开发分支，集成新功能 | ✅ 必须通过 CI ✅ 需要 Review |
| `feature/*` | 功能分支 | - |
| `fix/*` | 修复分支 | - |
| `release/*` | 发布分支 | - |

### 分支命名规范

#### 功能分支

```bash
feature/feature-name
feature/ssh-public-key-auth
feature/ai-streaming-response
```

#### 修复分支

```bash
fix/issue-name
fix/ssh-connection-timeout
fix/ai-api-error-handling
```

#### 发布分支

```bash
release/version-number
release/1.2.0
```

### 创建功能分支

```bash
# 1. 确保在主分支
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 开始开发
# ...
```

---

## 创建 Pull Request

### 前置检查

在创建 PR 之前，确保：

- [ ] 代码通过所有测试
- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 Prettier 格式化
- [ ] 代码通过 Rust clippy 检查
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] Commit 信息符合规范

### 提交代码

```bash
# 1. 添加更改
git add .

# 2. 提交更改
git commit -m "feat: add new feature"

# 3. 推送到远程
git push origin feature/your-feature-name
```

### Commit 信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能）|
| `refactor` | 重构（不是新功能也不是修复）|
| `test` | 测试相关 |
| `chore` | 构建/工具链相关 |

#### 示例

```
feat(ssh): add public key authentication support

添加了 SSH 公钥认证功能，支持 RSA、ECDSA 和 Ed25519 密钥。
用户可以选择本地私钥文件并输入密钥密码（如果有）。

Closes #123
```

```
fix(ai): resolve streaming response buffering issue

修复了 AI 流式响应时的缓冲问题，现在可以实时显示响应内容。
问题是由事件监听器的实现不当引起的。

Fixes #456
```

### 创建 PR

#### 通过 GitHub 创建

1. 访问仓库页面
2. 点击「Pull requests」
3. 点击「New pull request」
4. 选择你的功能分支
5. 填写 PR 模板
6. 点击「Create pull request」

#### PR 模板

```markdown
## 描述
简要描述这个 PR 的内容和目的。

## 类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 测试相关 (test)
- [ ] 其他 (chore)

## 变更内容
- 添加了 ...
- 修改了 ...
- 删除了 ...

## 测试
- [ ] 添加了单元测试
- [ ] 添加了集成测试
- [ ] 所有测试通过

## 截图
如果涉及 UI 变更，请提供截图。

## 相关 Issue
Closes #123

## 检查清单
- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 Prettier 格式化
- [ ] 代码通过 Rust clippy 检查
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
```

---

## Code Review

### Reviewer 检查清单

#### 代码质量

- [ ] 代码逻辑清晰，易于理解
- [ ] 没有重复代码
- [ ] 遵循项目代码规范
- [ ] 没有安全漏洞
- [ ] 没有性能问题

#### 功能正确性

- [ ] 功能实现符合需求
- [ ] 边界情况处理正确
- [ ] 错误处理完善
- [ ] 测试覆盖充分

#### 文档完整性

- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] Commit 信息清晰

#### 兼容性

- [ ] 不破坏现有功能
- [ ] 向后兼容（如适用）
- [ ] 跨平台兼容

### Review 评审意见

#### 建议修改（非阻塞）

```markdown
**建议**：可以考虑使用 `useMemo` 优化性能。

当前实现在每次渲染时都会重新计算数组，可以使用 `useMemo` 缓存结果。
```

#### 必须修改（阻塞）

```markdown
**问题**：存在内存泄漏风险。

在 `useEffect` 中没有清理定时器，建议添加清理函数：

```typescript
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);  // ✅ 添加清理
}, []);
```
```

#### 问题询问

```markdown
**问题**：为什么选择使用 `HashMap` 而不是 `BTreeMap`？

考虑到性能和内存使用，是否可以解释一下这个选择的理由？
```

---

## 处理反馈

### 修改代码

根据 Reviewer 的反馈修改代码：

```bash
# 1. 创建修复分支（可选）
git checkout feature/your-feature-name
git checkout -b fix/pr-feedback

# 2. 修改代码
# ...

# 3. 提交修改
git add .
git commit -m "fix: address review feedback"

# 4. 推送到远程
git push origin fix/pr-feedback
```

### 更新 PR

修改会自动更新到原 PR，无需创建新的 PR。

### 回复评论

对于每条 Review 评论，都需要回复：

- **已修复**：说明如何修复
- **不修复**：说明原因
- **需要讨论**：提出疑问或建议

```markdown
@reviewer 感谢建议！我已经添加了清理函数，请再次查看。
```

---

## 合并 Pull Request

### 合并前检查

- [ ] 所有 CI 检查通过
- [ ] 至少一个 Reviewer 批准
- [ ] 所有 Review 评论已处理
- [ ] 无合并冲突

### 合并方式

#### Squash and Merge（推荐）

```bash
# 将多个 commit 压缩为一个
git checkout main
git pull origin main
git merge --squash feature/your-feature-name
git commit -m "feat: add new feature"
git push origin main
```

#### Merge Commit

```bash
# 保留所有 commit 历史
git checkout main
git pull origin main
git merge feature/your-feature-name
git push origin main
```

### 删除分支

```bash
# 删除本地分支
git branch -d feature/your-feature-name

# 删除远程分支
git push origin --delete feature/your-feature-name
```

---

## 常见问题

### Q1: 如何解决合并冲突？

```bash
# 1. 切换到功能分支
git checkout feature/your-feature-name

# 2. 拉取最新主分支
git fetch origin
git merge origin/main

# 3. 解决冲突
# 编辑冲突文件，保留需要的代码

# 4. 提交合并
git add .
git commit -m "resolve merge conflicts"

# 5. 推送到远程
git push origin feature/your-feature-name
```

### Q2: 如何撤销提交？

```bash
# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃更改）
git reset --hard HEAD~1

# 撤销已推送的提交（创建新提交）
git revert HEAD
```

### Q3: 如何更新过时的 PR？

```bash
# 1. 切换到功能分支
git checkout feature/your-feature-name

# 2. 拉取最新主分支
git fetch origin
git rebase origin/main

# 3. 推送到远程
git push origin feature/your-feature-name --force
```

### Q4: 如何查看提交历史？

```bash
# 查看提交历史
git log --oneline --graph --all

# 查看特定文件的提交历史
git log --follow filename

# 查看提交详情
git show <commit-hash>
```

### Q5: 如何暂时保存工作？

```bash
# 保存当前工作
git stash

# 查看保存的工作
git stash list

# 恢复保存的工作
git stash pop

# 删除保存的工作
git stash drop
```

---

## 相关资源

- [代码规范](./code-style.md) - 代码质量规范
- [测试指南](./testing.md) - 测试规范
- [环境搭建](./setup.md) - 开发环境配置
- [Git 工作流](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) - Git Flow
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit 规范