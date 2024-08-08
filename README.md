# Byte Terminal

Welcome to Byte Terminal - Umutcan Edizaslan's Coder's Playground!

![Byte Terminal Screenshot](https://path-to-your-screenshot-image.png)

## Overview

Byte Terminal is an interactive web-based chat interface that allows users to communicate with AI models using the Groq API. It provides a sleek, terminal-like experience with customizable features and local storage capabilities.

## Features

- **AI Chat Interface**: Interact with AI models through a user-friendly terminal-like interface.
- **Groq API Integration**: Seamlessly connect with Groq's powerful AI models.
- **Local Storage**: Save API keys, model preferences, and chat history locally in the browser.
- **Customizable Commands**: Use built-in commands to manage your experience.
- **Syntax Highlighting**: Enjoy color-coded outputs for better readability.
- **Conversation Export**: Save your chat history as a JSON file.
- **Text Formatting**: 
  - Model names are displayed in blue.
  - AI responses are displayed in white.
  - Text enclosed in double asterisks (`**like this**`) is displayed in blue and bold.

## Usage

### Setting Up

1. Set your Groq API key:
   ```
   /groq your-api-key-here
   ```

2. Set your preferred model:
   ```
   /model model-name-here
   ```

### Commands

- `/help`: Display available commands
- `/groq <key>`: Set the API key
- `/model <name>`: Set the model name
- `/deletea`: Delete the stored API key
- `/deletem`: Delete the stored model name
- `/clear`: Clear the terminal
- `/save`: Save the conversation history as JSON

### Chatting

Once you've set up your API key and model, simply type your message and press Enter to chat with the AI. 

**Note on Formatting**: If you want to emphasize part of your message, you can enclose it in double asterisks. For example, typing "This is **important**" will display "important" in blue and bold in the chat interface.

## Customization

You can customize the appearance of Byte Terminal by modifying the CSS in the <style> section of index.html.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to Groq for providing the AI API.

- Special thanks to all contributors and users of Byte Terminal.

## Contact

Umutcan Edizaslan - @UEdizaslan

Project Link: [https://github.com/U-C4N/byte-terminal](https://github.com/U-C4N/byte-terminal)
