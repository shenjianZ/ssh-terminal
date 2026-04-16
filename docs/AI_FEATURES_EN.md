# AI Features Guide

SSH Terminal integrates a powerful AI intelligent assistant providing natural language to command conversion, command explanation, error analysis, and other features, supporting multiple AI service providers.

## Table of Contents

- [Supported AI Providers](#supported-ai-providers)
- [AI Feature Modules](#ai-feature-modules)
- [AI Configuration](#ai-configuration)
- [AI Caching Mechanism](#ai-caching-mechanism)
- [Use Cases](#use-cases)
- [Advanced Features](#advanced-features)

---

## Supported AI Providers

SSH Terminal supports multiple AI service providers that can be selected based on needs:

### OpenAI

- **Supported Models**: GPT-4, GPT-3.5-turbo, GPT-4-turbo, etc.
- **Features**:
  - Powerful code understanding and generation capabilities
  - Supports streaming output
  - Context length up to 128K tokens
- **Configuration Requirements**:
  - API Key
  - Optional: Custom Base URL (for proxy)

### Ollama

- **Supported Models**: Llama 2, Mistral, Qwen, and other local models
- **Features**:
  - Runs completely locally, protecting privacy
  - No API fees
  - Supports custom models
- **Configuration Requirements**:
  - Ollama service address (default: http://localhost:11434)
  - Model name

### Qwen (Tongyi Qianwen)

- **Supported Models**: qwen-turbo, qwen-plus, qwen-max, etc.
- **Features**:
  - Provided by Alibaba Cloud, strong Chinese capabilities
  - Affordable pricing
  - Supports long context
- **Configuration Requirements**:
  - DashScope API Key
  - Model name

### Wenxin (Wenxin Yiyan)

- **Supported Models**: ERNIE-Bot, ERNIE-Bot-turbo, etc.
- **Features**:
  - Provided by Baidu, optimized for Chinese
  - Strong understanding capabilities
  - Reasonable pricing
- **Configuration Requirements**:
  - Baidu Cloud API Key and Secret Key

### Other OpenAI API Compatible Services

- DeepSeek, Moonshot, Zhipu, etc.
- Only need to provide OpenAI API format compatible interface

---

## AI Feature Modules

### 1. Natural Language to Command (NL to Command)

**Description**: Describe requirements in natural language, AI automatically generates corresponding Shell commands.

**How to Use**:

1. **Trigger with Shortcut**
   - Windows/Linux: `Ctrl+Shift+A`
   - macOS: `Cmd+Shift+A`

2. **Click Button**
   - Click "AI to Command" button in terminal toolbar

3. **Enter Requirements**
   - Enter natural language description in the popup dialog
   - Examples:
     - "View all files in current directory"
     - "Find all files larger than 100MB"
     - "Count files in current directory"
     - "Compress current directory to zip file"

4. **Get Commands**
   - AI generates corresponding Shell commands
   - Displays command and brief explanation
   - Options:
     - Insert into terminal
     - Copy to clipboard
     - Regenerate

**Technical Implementation**:

```typescript
// User enters natural language
const userInput = "View all files in current directory";

// Build prompt
const prompt = `
You are a Linux command line expert. Please generate corresponding Shell commands based on user's natural language description.

User requirement: ${userInput}

Please return JSON in the following format:
{
  "command": "ls -la",
  "explanation": "ls -la will list all files in current directory, including hidden files, and display detailed information"
}
`;

// Call AI API
const response = await aiProvider.chat(prompt, {
  temperature: 0.3,
  max_tokens: 500
});

// Parse and display command
const result = JSON.parse(response.content);
```

**Best Practices**:

- Be clear and specific in description
- Specify target directory or file
- Specify operation type (view, modify, delete, etc.)
- If there are special requirements, mention them in the description

---

### 2. Command Explainer

**Description**: Select command in terminal, AI provides detailed explanation and usage instructions.

**How to Use**:

1. **Select Command**
   - Select command to explain in terminal with mouse
   - Or use shortcut to select entire line

2. **Trigger Explanation**
   - Select "AI Explain Command" from right-click menu
   - Or use shortcut (customizable)

3. **View Explanation**
   - AI returns detailed command explanation
   - Includes:
     - Command purpose
     - Parameter description
     - Usage examples
     - Notes

**Example**:

Input command: `find /var/log -name "*.log" -mtime +7 -size +100M`

AI explanation:

```
【Command Purpose】
Find .log files in /var/log directory modified more than 7 days ago and larger than 100MB

【Parameter Description】
- /var/log: Directory path to search
- -name "*.log": Match files ending with .log
- -mtime +7: Modified more than 7 days ago
- -size +100M: File size larger than 100MB

【Usage Examples】
1. Find and list matching files:
   find /var/log -name "*.log" -mtime +7 -size +100M -ls

2. Delete matching files:
   find /var/log -name "*.log" -mtime +7 -size +100M -delete

【Notes】
- Before using -delete parameter, it's recommended to first use -ls or -print to view matched files
- find command searches subdirectories recursively
- Searching large directories may take a long time
```

---

### 3. Error Analyzer

**Description**: When terminal shows errors, select error message, AI analyzes error cause and provides solutions.

**How to Use**:

1. **Select Error Message**
   - Select error message in terminal
   - Include error code and related information

2. **Trigger Analysis**
   - Select "AI Analyze Error" from right-click menu
   - Or use shortcut (customizable)

3. **View Analysis Result**
   - AI analyzes error cause
   - Provides possible causes
   - Gives solutions
   - Provides prevention suggestions

**Example**:

Error message: `Permission denied: /var/www/html/config.php`

AI analysis:

```
【Error Cause】
Current user does not have permission to access /var/www/html/config.php file

【Possible Causes】
1. File owner is not current user
2. File permissions are too strict
3. Current user is not in allowed user groups

【Solutions】

Solution 1: Use sudo to elevate permissions (use with caution)
sudo cat /var/www/html/config.php

Solution 2: Modify file permissions
sudo chmod 644 /var/www/html/config.php

Solution 3: Modify file owner
sudo chown $USER:$USER /var/www/html/config.php

【Prevention Suggestions】
- Regularly check file permission settings
- Use appropriate user groups to manage file access
- Use sudo with caution, understand its risks
```

---

### 4. AI Chat Interface

**Description**: Independent full-screen chat interface supporting multi-round conversation and context understanding.

**How to Use**:

1. **Open AI Chat**
   - Click "AI Chat" button in sidebar
   - Or use shortcut (customizable)

2. **Start Conversation**
   - Enter question in input box
   - Supports multi-round conversation
   - AI remembers context

3. **Features**
   - Conversation history automatically grouped by server
   - Supports voice input
   - Supports code highlighting
   - Supports copying code
   - Supports exporting conversation records

**Conversation History Management**:

- Each server's conversation managed independently
- Sorted by time
- Supports searching conversation history
- Supports deleting conversations
- Supports exporting conversations (Markdown format)

---

## AI Configuration

### Configuration Entry

1. Open settings page
2. Go to "AI" tab
3. Configure AI Provider

### Basic Configuration

**Select AI Provider**

Choose AI service provider from dropdown list.

**Configure API Key**

- OpenAI: Enter OpenAI API Key
- Qwen: Enter DashScope API Key
- Wenxin: Enter Baidu Cloud API Key and Secret Key
- Ollama: Configure service address (default: http://localhost:11434)

**Select Model**

Select corresponding model based on chosen Provider:
- OpenAI: gpt-4, gpt-3.5-turbo, etc.
- Qwen: qwen-turbo, qwen-plus, qwen-max, etc.
- Wenxin: ERNIE-Bot, ERNIE-Bot-turbo, etc.
- Ollama: Installed model names

### Advanced Configuration

**Temperature**

- Controls output randomness
- Range: 0.0 - 2.0
- Recommended values:
  - Code generation: 0.0 - 0.3
  - Command explanation: 0.3 - 0.5
  - Conversation: 0.5 - 1.0

**Max Tokens**

- Controls maximum response length
- Range: 100 - 4096
- Recommended values:
  - Command generation: 500 - 1000
  - Command explanation: 1000 - 2000
  - Conversation: 2000 - 4096

**Top P**

- Controls sampling range
- Range: 0.0 - 1.0
- Recommended value: 0.9 - 1.0

**System Prompt**

Customize AI behavior and style:

```
You are a Linux command line expert, skilled in Shell scripts and system administration.
Please provide accurate and concise commands and explanations.
```

### Custom Base URL

If you need to use proxy or custom API endpoint, you can configure Base URL:

- OpenAI compatible services: Enter custom API address
- Example: `https://api.openai-proxy.com/v1`

---

## AI Caching Mechanism

SSH Terminal implements intelligent AI caching mechanism to improve response speed and reduce API calls.

### Caching Strategy

**1. Request Caching**

- Same requests return cached results
- Cache time: 30 minutes
- Cache size: 100 entries

**2. Provider Cache Pool**

- Multiple AI Providers load balanced
- Intelligently select fastest responding Provider
- Automatic failover

**3. Streaming Response Caching**

- Streaming responses displayed in real-time
- Complete responses cached locally
- Supports offline viewing of conversation history

### Cache Management

**View Cache**

In AI tab of settings page, you can view:
- Cache hit rate
- Cache entry count
- Cache size

**Clear Cache**

Can manually clear cache:
- Clear specific conversation cache
- Clear all cache

---

## Use Cases

### 1. Beginner Learning

- **Scenario**: Beginners new to Linux command line
- **Usage**:
  - Use natural language to describe requirements
  - Let AI generate commands
  - Learn command usage

### 2. Improve Efficiency

- **Scenario**: Need to quickly complete complex operations
- **Usage**:
  - Describe complex requirements
  - AI generates complete commands
  - Use directly or make minor modifications

### 3. Troubleshooting

- **Scenario**: Encounter errors and don't know how to solve
- **Usage**:
  - Select error message
  - AI analyzes cause
  - Get solutions

### 4. Command Learning

- **Scenario**: See unfamiliar commands
- **Usage**:
  - Select command
  - AI explains purpose and usage
  - Learn new commands

### 5. Script Writing

- **Scenario**: Need to write Shell scripts
- **Usage**:
  - Describe script requirements in AI chat
  - AI generates script code
  - Copy and use

---

## Advanced Features

### 1. Voice Input

**Description**: Supports voice input, converts speech to text and sends to AI.

**How to Use**:
1. Click microphone icon in AI chat interface
2. Allow browser to access microphone
3. Start speaking
4. Automatically recognize and convert to text

**Technical Implementation**:
- Uses Web Speech API
- Supports multiple languages
- Real-time recognition

### 2. Code Highlighting

**Description**: Code returned by AI is automatically highlighted.

**Supported Code Types**:
- Shell / Bash
- Python
- JavaScript / TypeScript
- JSON
- Markdown
- Others

### 3. Conversation Export

**Description**: Export conversation to Markdown file.

**How to Use**:
1. Open conversation history
2. Select conversation to export
3. Click "Export" button
4. Save as .md file

### 4. Custom Shortcuts

**Description**: Can customize AI-related shortcuts.

**Configurable Shortcuts**:
- Open AI chat
- NL to command
- AI explain command
- AI analyze error

**Configuration Method**:
1. Open settings
2. Go to "Shortcuts" tab
3. Find AI-related shortcuts
4. Modify to custom shortcuts

---

## Best Practices

### 1. Prompt Optimization

**Be Clear and Specific**

- ❌ "View file"
- ✅ "View .log files in /var/log directory modified today"

**Provide Context**

- ❌ "Delete file"
- ✅ "Delete all .tmp files in /tmp directory"

**Specify Output Format**

- ❌ "Count files"
- ✅ "Count files in current directory, return only the number"

### 2. Temperature Settings

**Code Generation**: Use lower temperature (0.0 - 0.3)
- Generate stable code
- Reduce randomness

**Conversation**: Use medium temperature (0.5 - 0.8)
- More natural conversation
- More creativity

**Creative Writing**: Use higher temperature (0.8 - 1.0)
- More creative output
- Diverse responses

### 3. Security Considerations

**Don't Enter Sensitive Information**
- Don't enter passwords, keys, or other sensitive information
- AI prompts may be logged

**Verify Generated Commands**
- AI-generated commands need verification
- Especially commands with destructive operations
- Recommended to verify in test environment first

**Use Trusted AI Providers**
- Choose legitimate AI service providers
- Avoid using APIs from unknown sources

---

## FAQ

### Q: Why is AI response slow?

A: Possible reasons:
1. Network issues: Check network connection
2. API rate limiting: Check API usage limits
3. Model parameters: Reducing max_tokens can improve speed
4. Cache miss: Same requests will be faster

### Q: What if AI generates incorrect commands?

A:
1. Try more detailed description
2. Specify context and goals
3. Use command explanation feature to learn correct usage
4. Ask in AI chat for help

### Q: How to use AI offline?

A:
1. Use Ollama local models
2. Configure Ollama service address
3. Select local model
4. Run completely offline

### Q: How long is AI conversation history saved?

A:
- Conversation history saved in local database
- Default saved for 30 days
- Can modify retention time in settings
- Can manually delete conversations

---

## Summary

SSH Terminal's AI features provide powerful command line assistance capabilities, including natural language to command, command explanation, error analysis, and other features. It supports multiple AI service providers that can be selected based on needs. Through proper configuration and usage, it can greatly improve terminal usage efficiency.