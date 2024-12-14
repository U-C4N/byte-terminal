class Terminal {
    constructor() {
        this.apiKey = localStorage.getItem('apiKey') || '';
        this.model = localStorage.getItem('model') || '';
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.pdfHistory = JSON.parse(localStorage.getItem('pdfHistory')) || [];
        this.aliases = JSON.parse(localStorage.getItem('aliases')) || {};
        this.macros = JSON.parse(localStorage.getItem('macros')) || {};
        this.currentTheme = localStorage.getItem('theme') || 'default';
        
        this.inputElement = document.getElementById('input');
        this.outputElement = document.getElementById('output');
        
        this.themes = {
            default: {
                bg: '#0a0a0a',
                text: '#00ff00',
                accent: '#ff00ff',
                secondary: '#0000ff'
            },
            retro: {
                bg: '#2b2b2b',
                text: '#33ff33',
                accent: '#ff3333',
                secondary: '#3333ff'
            },
            solarized: {
                bg: '#002b36',
                text: '#839496',
                accent: '#cb4b16',
                secondary: '#268bd2'
            },
            light: {
                bg: '#ffffff',
                text: '#000000',
                accent: '#ff0000',
                secondary: '#0000ff'
            }
        };
        
        this.commandDocs = {
            groq: {
                syntax: '/groq <api_key> [options]',
                description: 'Set the Groq API key and configure API options',
                options: {
                    'temperature': 'Control randomness (0.0 to 1.0)',
                    'max_tokens': 'Maximum tokens in response'
                },
                examples: [
                    '/groq abc123',
                    '/groq abc123 temperature=0.7 max_tokens=1000'
                ]
            },
            model: {
                syntax: '/model <name> [options]',
                description: 'Set the model and its parameters',
                options: {
                    'temperature': 'Control randomness (0.0 to 1.0)',
                    'context': 'Set context window size'
                },
                examples: [
                    '/model mixtral-8x7b',
                    '/model gpt-4 temperature=0.8'
                ]
            },
            search: {
                syntax: '/search <query> [options]',
                description: 'Search through terminal output or chat history',
                options: {
                    '-h, --history': 'Search in chat history',
                    '-c, --case': 'Case sensitive search',
                    '-r, --regex': 'Use regex pattern'
                },
                examples: [
                    '/search error',
                    '/search "API key" --history',
                    '/search -r "\\berror\\b"'
                ]
            },
            theme: {
                syntax: '/theme <action> [name]',
                description: 'Manage terminal themes',
                options: {
                    'list': 'List available themes',
                    'set': 'Set active theme',
                    'export': 'Export theme to JSON',
                    'import': 'Import theme from JSON'
                },
                examples: [
                    '/theme list',
                    '/theme set retro',
                    '/theme export mytheme'
                ]
            },
            alias: {
                syntax: '/alias <name>=<command>',
                description: 'Create command aliases',
                examples: [
                    '/alias clearall=clear && deletea && deletem',
                    '/alias gpt4=/model gpt-4 temperature=0.7'
                ]
            },
            macro: {
                syntax: '/macro <name> <commands...>',
                description: 'Create command macros (multiple commands)',
                examples: [
                    '/macro setup /groq $KEY /model gpt-4 /theme set retro',
                    '/macro analyze /clear /upload /historyofrag'
                ]
            },
            temp: {
                syntax: '/temp <value>',
                description: 'Set temperature for API responses (0.0 to 1.0)',
                examples: [
                    '/temp 0.7',
                    '/temp 0.2'
                ]
            },
            deletea: {
                syntax: '/deletea',
                description: 'Delete stored API key',
                examples: ['/deletea']
            },
            deletem: {
                syntax: '/deletem',
                description: 'Delete stored model',
                examples: ['/deletem']
            },
            clear: {
                syntax: '/clear',
                description: 'Clear terminal output',
                examples: ['/clear']
            },
            save: {
                syntax: '/save',
                description: 'Save conversation history as JSON',
                examples: ['/save']
            },
            upload: {
                syntax: '/upload',
                description: 'Upload a PDF file for RAG',
                examples: ['/upload']
            },
            historyofrag: {
                syntax: '/historyofrag',
                description: 'Show history of uploaded PDF files',
                examples: ['/historyofrag']
            },
            help: {
                syntax: '/help [command]',
                description: 'Show help for commands',
                examples: [
                    '/help',
                    '/help search'
                ]
            },
            man: {
                syntax: '/man <command>',
                description: 'Show detailed manual for a command',
                examples: ['/man search']
            }
        };
        
        this.initializeEventListeners();
        this.checkStoredCredentials();
        this.applyTheme(this.currentTheme);
    }

    initializeEventListeners() {
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = this.inputElement.value.trim();
                this.inputElement.value = '';
                if (input) this.processInput(input);
            }
        });

        // Command history navigation
        let historyIndex = -1;
        const commandHistory = JSON.parse(localStorage.getItem('commandHistory')) || [];

        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    this.inputElement.value = commandHistory[historyIndex];
                }
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                if (historyIndex > -1) {
                    historyIndex--;
                    this.inputElement.value = historyIndex === -1 ? '' : commandHistory[historyIndex];
                }
                e.preventDefault();
            }
        });
    }

    parseCommandParams(input) {
        const parts = input.split(' ');
        const command = parts[0];
        const args = [];
        const options = {};

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (part.includes('=')) {
                const [key, value] = part.split('=');
                options[key] = value;
            } else {
                args.push(part);
            }
        }

        return { command, args, options };
    }

    processInput(input) {
        // Save to command history
        const commandHistory = JSON.parse(localStorage.getItem('commandHistory')) || [];
        commandHistory.unshift(input);
        if (commandHistory.length > 50) commandHistory.pop();
        localStorage.setItem('commandHistory', JSON.stringify(commandHistory));

        this.appendOutput(`> ${input}`);
        
        // Check for aliases first
        if (this.aliases[input]) {
            input = this.aliases[input];
        }

        // Check for macros
        if (this.macros[input]) {
            const commands = this.macros[input];
            commands.forEach(cmd => this.processInput(cmd));
            return;
        }

        if (input.startsWith('/')) {
            const { command, args, options } = this.parseCommandParams(input);
            this.handleCommand(command, args, options);
        } else if (this.apiKey && this.model) {
            this.callGroqAPI(input);
        } else {
            this.appendOutput('Please set the API key (/groq <key>) and model (/model <name>) first.');
        }

        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    handleCommand(command, args, options) {
        const commands = {
            '/groq': () => this.setGroqAPI(args[0], options),
            '/model': () => this.setModel(args[0], options),
            '/deletea': () => this.deleteAPIKey(),
            '/deletem': () => this.deleteModel(),
            '/help': () => this.displayHelp(args[0]),
            '/clear': () => this.clearTerminal(),
            '/save': () => this.saveConversation(),
            '/upload': () => this.uploadPDF(),
            '/historyofrag': () => this.showRAGHistory(),
            '/search': () => this.searchContent(args[0], options),
            '/theme': () => this.handleTheme(args[0], args[1], options),
            '/alias': () => this.handleAlias(args.join(' ')),
            '/macro': () => this.handleMacro(args[0], args.slice(1).join(' ')),
            '/man': () => this.showManPage(args[0]),
            '/temp': () => this.setTemperature(args[0])
        };

        (commands[command] || (() => this.appendOutput('Unknown command. Type /help for a list of commands.')))();
    }

    showManPage(command) {
        if (!command) {
            this.appendOutput('Usage: /man <command>');
            return;
        }

        const cmd = command.replace('/', '');
        const doc = this.commandDocs[cmd];
        
        if (!doc) {
            this.appendOutput(`No manual entry for ${command}`);
            return;
        }

        const manPage = `
Manual page for ${command}

SYNTAX
    ${doc.syntax}

DESCRIPTION
    ${doc.description}

${doc.options ? `OPTIONS
    ${Object.entries(doc.options).map(([k, v]) => `${k.padEnd(15)} ${v}`).join('\n    ')}` : ''}

EXAMPLES
    ${doc.examples.join('\n    ')}
`;

        this.appendOutput(manPage);
    }

    searchContent(query, options) {
        if (!query) {
            this.appendOutput('Usage: /search <query> [options]');
            return;
        }

        const searchHistory = options.h || options.history;
        const caseSensitive = options.c || options.case;
        const useRegex = options.r || options.regex;

        let content = searchHistory ? 
            this.chatHistory.map(msg => msg.content).join('\n') :
            this.outputElement.textContent;

        let matches = [];
        if (useRegex) {
            try {
                const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
                matches = [...content.matchAll(regex)];
            } catch (e) {
                this.appendOutput(`Invalid regex pattern: ${e.message}`);
                return;
            }
        } else {
            if (!caseSensitive) {
                content = content.toLowerCase();
                query = query.toLowerCase();
            }
            let pos = 0;
            while ((pos = content.indexOf(query, pos)) !== -1) {
                matches.push({ index: pos });
                pos += query.length;
            }
        }

        if (matches.length === 0) {
            this.appendOutput('No matches found.');
            return;
        }

        this.appendOutput(`Found ${matches.length} matches:`);
        matches.forEach((match, i) => {
            const start = Math.max(0, match.index - 40);
            const end = Math.min(content.length, match.index + query.length + 40);
            let snippet = content.substring(start, end);
            if (start > 0) snippet = '...' + snippet;
            if (end < content.length) snippet += '...';
            
            // Highlight the match
            const highlightedSnippet = snippet.replace(
                new RegExp(query, caseSensitive ? 'g' : 'gi'),
                match => `<span style="background-color: yellow; color: black">${match}</span>`
            );
            
            this.appendOutput(`${i + 1}. ${highlightedSnippet}`);
        });
    }

    handleTheme(action, name, options) {
        switch (action) {
            case 'list':
                this.appendOutput('Available themes:\n' + Object.keys(this.themes).join('\n'));
                break;
            case 'set':
                if (this.themes[name]) {
                    this.applyTheme(name);
                    this.currentTheme = name;
                    localStorage.setItem('theme', name);
                    this.appendOutput(`Theme '${name}' applied.`);
                } else {
                    this.appendOutput(`Theme '${name}' not found.`);
                }
                break;
            case 'export':
                const theme = this.themes[name || this.currentTheme];
                if (theme) {
                    const json = JSON.stringify(theme, null, 2);
                    this.downloadFile(`${name || 'theme'}.json`, json);
                    this.appendOutput('Theme exported successfully.');
                }
                break;
            case 'import':
                this.uploadFile('.json', (content) => {
                    try {
                        const theme = JSON.parse(content);
                        const name = options.name || 'custom';
                        this.themes[name] = theme;
                        this.appendOutput(`Theme '${name}' imported successfully.`);
                    } catch (e) {
                        this.appendOutput('Invalid theme file.');
                    }
                });
                break;
            default:
                this.appendOutput('Usage: /theme <list|set|export|import> [name]');
        }
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        root.style.setProperty('--bg-color', theme.bg);
        root.style.setProperty('--text-color', theme.text);
        root.style.setProperty('--accent-color', theme.accent);
        root.style.setProperty('--secondary-color', theme.secondary);
    }

    handleAlias(aliasStr) {
        const [name, ...command] = aliasStr.split('=');
        if (!name || !command.length) {
            this.appendOutput('Usage: /alias <name>=<command>');
            return;
        }

        this.aliases[name] = command.join('=');
        localStorage.setItem('aliases', JSON.stringify(this.aliases));
        this.appendOutput(`Alias '${name}' created.`);
    }

    handleMacro(name, commands) {
        if (!name || !commands) {
            this.appendOutput('Usage: /macro <name> <commands...>');
            return;
        }

        this.macros[name] = commands.split('&&').map(cmd => cmd.trim());
        localStorage.setItem('macros', JSON.stringify(this.macros));
        this.appendOutput(`Macro '${name}' created.`);
    }

    setGroqAPI(key, options = {}) {
        if (!key) {
            this.appendOutput('Usage: /groq <key> [options]');
            return;
        }

        this.apiKey = key;
        this.apiOptions = options;
        localStorage.setItem('apiKey', key);
        localStorage.setItem('apiOptions', JSON.stringify(options));
        this.appendOutput('API key and options set successfully.');
    }

    setModel(name, options = {}) {
        if (!name) {
            this.appendOutput('Usage: /model <name> [options]');
            return;
        }

        this.model = name;
        this.modelOptions = options;
        localStorage.setItem('model', name);
        localStorage.setItem('modelOptions', JSON.stringify(options));
        this.appendOutput('Model and options set successfully.');
    }

    checkStoredCredentials() {
        if (this.apiKey) this.appendOutput('API key loaded from browser storage.');
        if (this.model) this.appendOutput('Model loaded from browser storage.');
    }

    displayHelp(command) {
        if (!command) {
            const commands = Object.entries(this.commandDocs).map(([name, doc]) => {
                return `/${name} - ${doc.description}`;
            });
            this.appendOutput('Available commands:\n' + commands.join('\n'));
            this.appendOutput('\nFor detailed help on a command, type: /help <command>');
            return;
        }

        const cmd = command.replace('/', '');
        const doc = this.commandDocs[cmd];
        
        if (!doc) {
            this.appendOutput(`No help available for ${command}`);
            return;
        }

        const helpPage = `
Help for ${command}

SYNTAX
    ${doc.syntax}

DESCRIPTION
    ${doc.description}

${doc.options ? `OPTIONS
    ${Object.entries(doc.options).map(([k, v]) => `${k.padEnd(15)} ${v}`).join('\n    ')}` : ''}

EXAMPLES
    ${doc.examples.join('\n    ')}
`;

        this.appendOutput(helpPage);
    }

    clearTerminal() {
        this.outputElement.innerHTML = '';
        this.appendOutput('Terminal cleared.');
    }

    saveConversation() {
        const json = JSON.stringify(this.chatHistory, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'conversation_history.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.appendOutput('Conversation saved as JSON.');
    }

    appendOutput(content) {
        if (typeof content === 'string') {
            if (content.startsWith(this.model + ':')) {
                const modelName = `<span class="model-name">${this.model}</span>:`;
                content = content.replace(this.model + ':', modelName);
                content = `<span class="response-text">${content}</span>`;
            } else {
                content = content.replace(/\*\*(.*?)\*\*/g, '<span style="color: #0000ff; font-weight: bold;">$1</span>');
            }
        }
        this.outputElement.innerHTML += `<div>${content}</div>`;
    }

    async callGroqAPI(input) {
        this.appendOutput(`User: ${input}`);
        this.chatHistory.push({role: 'user', content: input});
        this.updateLocalStorage();

        const startTime = performance.now();

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: this.chatHistory,
                    ...this.modelOptions,
                    ...this.apiOptions
                })
            });

            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

            const data = await response.json();
            const botResponse = data.choices[0].message.content;
            const responseTime = (performance.now() - startTime).toFixed(2);

            // Format and syntax highlight code blocks in the response
            const formattedResponse = this.formatResponse(botResponse);
            
            this.appendOutput(`${this.model}: ${formattedResponse}`);
            this.appendOutput(`Response time: ${responseTime} ms`);

            this.chatHistory.push({role: 'assistant', content: botResponse});
            this.updateLocalStorage();
        } catch (error) {
            this.appendOutput(`Error: ${error.message}`);
            console.error('API call error:', error);
        }
    }

    formatResponse(text) {
        // Detect and format code blocks
        return text.replace(/```(\w+)?\n([\s\S]+?)\n```/g, (_, lang, code) => {
            const highlighted = hljs.highlightAuto(code, lang ? [lang] : undefined).value;
            return `<div class="code-container">
                        ${lang ? `<div class="code-header">
                            <span class="code-language">${lang}</span>
                            <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${code}\`)">Copy</button>
                        </div>` : ''}
                        <pre><code>${highlighted}</code></pre>
                    </div>`;
        });
    }

    updateLocalStorage() {
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    uploadPDF() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = (e) => this.handleFileUpload(e);
        input.click();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        const MAX_SIZE = 15 * 1024 * 1024;

        if (file?.type === 'application/pdf' && file.size <= MAX_SIZE) {
            this.appendOutput('Uploading PDF...');
            const arrayBuffer = await file.arrayBuffer();
            const pdfData = new Uint8Array(arrayBuffer);
            this.processPDF(pdfData, file.name);
        } else {
            this.appendOutput('Please select a PDF file of 15 MB or smaller.');
        }
    }

    async processPDF(pdfData, fileName) {
        try {
            const pdf = await pdfjsLib.getDocument({data: pdfData}).promise;
            let text = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ');
            }

            this.chatHistory.push({role: 'system', content: `This is text extracted from a PDF file: ${text}`});
            this.pdfHistory.push({
                name: fileName,
                size: pdfData.length,
                date: new Date().toISOString(),
                pages: pdf.numPages
            });

            localStorage.setItem('pdfHistory', JSON.stringify(this.pdfHistory));
            this.appendOutput('PDF processed and content added to the chat.');
        } catch (error) {
            this.appendOutput(`PDF processing error: ${error.message}`);
        }
    }

    showRAGHistory() {
        if (this.pdfHistory.length === 0) {
            this.appendOutput('No PDFs have been uploaded yet.');
            return;
        }

        const tableHeaders = ['File Name', 'Size (KB)', 'Page Count', 'Upload Date']
            .map(header => `<th style="border: 1px solid #ddd; padding: 8px;">${header}</th>`)
            .join('');

        const tableRows = this.pdfHistory
            .map(pdf => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${pdf.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${(pdf.size / 1024).toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${pdf.pages}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(pdf.date).toLocaleString()}</td>
                </tr>
            `)
            .join('');

        const tableHTML = `
            <table style="width:100%; border-collapse: collapse;">
                <tr>${tableHeaders}</tr>
                ${tableRows}
            </table>
        `;

        this.appendOutput(tableHTML);
    }

    setTemperature(value) {
        if (!value || isNaN(value) || value < 0 || value > 1) {
            this.appendOutput('Usage: /temp <value> (between 0.0 and 1.0)');
            return;
        }

        const temp = parseFloat(value);
        this.apiOptions = { ...this.apiOptions, temperature: temp };
        localStorage.setItem('apiOptions', JSON.stringify(this.apiOptions));
        this.appendOutput(`Temperature set to ${temp}`);
    }
}

// Initialize terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Terminal();
    hljs.highlightAll();
}); 