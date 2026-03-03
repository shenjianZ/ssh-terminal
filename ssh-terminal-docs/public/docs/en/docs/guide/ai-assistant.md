# AI Intelligent Assistant

SSH Terminal has a built-in powerful AI intelligent assistant to help you manage servers and execute commands more efficiently.

---

## AI Assistant Introduction

The AI intelligent assistant integrates multiple AI service providers, providing the following core features:
- Explain complex shell commands
- Convert natural language to executable commands
- Diagnose and resolve errors
- Real-time streaming dialogue

**Supported AI Providers:**
- OpenAI (GPT-4, GPT-3.5)
- Ollama (local large models)
- Qwen (Tongyi Qianwen)
- ERNIE Bot (Baidu)
- DeepSeek
- Other services compatible with OpenAI API

---

## Configure AI Provider

### Add AI Provider

1. Open the settings page, switch to the "AI" tab
2. Click the "Add New Service" button
3. Select service type (requires API Key, does not require API Key)
4. Fill in configuration information:
   - **Service Name** - Custom name (e.g., "OpenAI GPT-4")
   - **API Key** - API key provided by the service provider
   - **Base URL** - API endpoint address (Ollama local use `http://localhost:11434`)
   - **Model Name** - Model to use (e.g., `gpt-4`, `qwen-turbo`)
5. Click "Test Connection" to verify configuration
6. Click "Save" to complete configuration

### Ollama Local Configuration

If you want to use local Ollama models:

1. Install Ollama: `ollama pull qwen`
2. Add Ollama Provider in SSH Terminal:
   - Base URL: `http://localhost:11434`
   - Model Name: `qwen` (or other downloaded models)
   - API Key: Can be left blank

**Advantages:**
- Runs completely locally, data does not leave your computer
- No API fees required
- Supports multiple open source models

### Set Default Provider

After configuring multiple Providers, you can set one as the default Provider:
- In the settings page's "Default AI Service", select an enabled service as the default service

---

## Core Features

### Command Explanation

When you encounter unfamiliar shell commands, you can ask the AI assistant to explain their meaning.

**Usage:**
1. Select the command text to explain in the terminal
2. Press `Ctrl+Shift+E` (or customize in settings)
3. AI will return detailed explanation, including:
   - Function of the command
   - Meaning of each parameter
   - Usage examples
   - Notes

**Example:**
```
Command: ps aux | grep nginx

Explanation: This command is used to find running nginx processes
- ps aux: Display detailed information of all processes
- |: Pipe, passes the output of the previous command to the next command
- grep nginx: Filter lines containing "nginx"
```

### Natural Language to Command

Describe what you want to do in natural language, and AI will generate corresponding commands.

**Usage:**
1. Press `Ctrl+Shift+#` (or customize in settings)
2. Enter your requirement (Chinese or English)
3. AI will return recommended commands

**Example:**
```
Input: Check system memory usage

AI Recommendation: free -h

Input: Find process occupying port 8080

AI Recommendation: lsof -i :8080
```

### Error Diagnosis

When you encounter an error, let AI help you analyze the cause and solution.

**Usage:**
1. Press `Ctrl+Shift+A` (or customize in settings)
2. Enter error message or select error text
3. AI will analyze possible causes and provide solutions

**Example:**
```
Error: Permission denied when trying to delete a file

AI Analysis:
Possible causes:
1. Insufficient file permissions
2. File is occupied by another process
3. File system is read-only

Solutions:
1. Use sudo to elevate permissions
2. Check and close the process occupying the file
3. Check file system mount options
```

### Streaming Dialogue

Have real-time conversations with AI to get more in-depth help.

**Usage:**
1. Click the "AI Assistant" icon in the sidebar (in active terminal, use Ctrl+Shift+I)
2. Enter your question in the chat box
3. AI will return answers in real-time, supporting streaming output

**Use Cases:**
- Seeking technical advice
- Code review and optimization
- Learning new technical concepts
- Solving complex technical problems

---

## Conversation History Management

### Automatic Saving

The AI assistant automatically saves conversation history for each connection:
- Each terminal connection has independent conversation history
- Conversations are grouped and stored by server
- Supports viewing historical conversation records

### View History

1. In the AI assistant page, the left side displays history grouped by server
2. Click the server name to view all conversations for that server
3. Click on specific conversation records to load complete content

### Clear History

You can clear conversation history for specific connections:
- In the AI assistant page, select the connection to clear
- Click the delete icon button

---

## AI Caching Mechanism

SSH Terminal has a built-in intelligent caching system that significantly improves AI response speed.

### How It Works

- Same configuration is automatically reused without repeated creation
- Old cache is automatically cleared when configuration changes
- Response speed improves by 90% when cache is hit

### Performance Comparison

| Operation | No Cache | With Cache | Improvement |
|-----------|----------|------------|-------------|
| First Call | ~500ms | ~500ms | - |
| Subsequent Calls | ~500ms/call | ~50ms/call | ⚡ 90% ↑ |

### Monitor Cache

You can view cache information in the AI tab of the settings page:
- Number of currently cached Providers
- Cache hit status
- Performance metrics

---

## Next Steps

Now that you have mastered how to use the AI assistant, you can continue learning:

- [Basics](/docs/guide/basics) - Review basic operations
- [SSH Connection Management](/docs/guide/ssh-connection) - Manage your server connections
- [SFTP File Management](/docs/guide/sftp) - Efficiently manage remote files
- [Cloud Sync](/docs/guide/cloud-sync) - Sync configuration to cloud