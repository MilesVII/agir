# Ägir
Janitor-inspired local roleplay frontend

## Features and and other cool things
- Local and (optionally) self-hosted
- Mobile-first
- No sync
- No JLLM
- No mobile app
- Unlimited first messages
- Native import/export

#### rEmber (WIP)
A customizable recap assistant that helps to keep track of roleplay state. Basically a "Chat Memory" from Janitor but not half-assed.

## Usage
1. You need an LLM provider to use with Agir. Janitor AI calls them "proxies", in Agir they are "engines". Refer to [their guide](https://help.janitorai.com/en/article/the-absolute-beginners-guide-to-using-a-proxy-with-janitor-part-one-19to7y9/) to acquire one for free on OpenRouter.
2. Navigate to `Settings` > `Engines`, add your credentials into the form, and hit "Save engine".
3. Navigate to `Settings` > `Personas` and add a persona -- a character representing you in roleplay.
4. Navigate to `Characters` and import or create a scenario.
5. Once ready, pick a scenario from `Characters` library, hit `play`, select a persona and start the roleplay session.

You also can run an LLM locally with [LM Studio](https://lmstudio.ai/) on desktop, just figure out how to host a web server with it and add an engine with localhost connection.

You can use [Fenrir](https://github.com/MilesVII/fenrir) to add characters from Janitor -- it's a sniffer proxy that helps to extract character definition even if it's hidden.

## Credits
Maid Ägir placeholder:
https://gelbooru.com/index.php?page=post&s=view&id=11145081

Send icon (in chat):
https://www.vecteezy.com/vector-art/21909958-abstract-logo-business-shape-element-clip-art-illustration-vector-geometric-simple-modern-and-clear