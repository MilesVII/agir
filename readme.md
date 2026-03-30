# Ägir
Janitor-inspired local roleplay frontend

## Features and other cool things
- Standalone and (optionally) self-hosted
- Mobile-first
- No sync between devices (chats and scenarios stay on your device)
- No JLLM (as in real LLMs only)
- No mobile app (as in no regulations, moderation and censorship)
- Unlimited number of first messages
- Native import/export
- *rEmber (WIP)*: a customizable recap assistant that helps to keep track of roleplay state. Basically a "Chat Memory" from Janitor but not half-assed and actually usable.

### Less cool things
- **No pagination in chats and scenario library (yet)**. It still seems to work well in chats with 500+ messages though.
- **No lorebooks (yet)**. I intend to add SillyTavern lorebooks support, but Janitor's ones can not be extracted.

## Usage
You can use a [github-hosted version](https://milesvii.github.io/agir/). GitHub basically serves a static html-page, so there's no any other traffic going through it (or anyone else except your LLM provider). Instructions for self-hosted version are below.

### Setup
1. You need an LLM provider to use with Ägir. Janitor AI calls them "proxies", in Ägir they are "providers". Refer to [their guide](https://help.janitorai.com/en/article/the-absolute-beginners-guide-to-using-a-proxy-with-janitor-part-one-19to7y9/) to acquire one for free on OpenRouter.
2. Navigate to `Settings` > `LLM providers`, add your credentials into the form, and hit "Save provider".
3. Navigate to `Settings` > `Personas` and add a persona -- a character representing you in roleplay.
4. Navigate to `Characters` and import or create a scenario. The `download` option allows to fetch characters from *janitorai.com* and *jannyai.com*.
5. Once ready, pick a scenario from `Characters` library, hit `play`, select a persona and start the roleplay session.

You also can run an LLM locally with [LM Studio](https://lmstudio.ai/) on desktop, just figure out how to host a web server with it and add a provider with localhost connection.

You can also use [Fenrir](https://github.com/MilesVII/fenrir) to add characters from Janitor -- it's a sniffer proxy that helps to extract character definition even if it's hidden.

### Self-host
Clone or download the repo on your device:
```
git clone https://github.com/MilesVII/agir
cd agir
```
Then just serve the page from root with whatever tool you prefer (i use [`serve`](https://www.npmjs.com/package/serve) for example). If you don't know how, you can ask any free use bot on Janitor for instructions. Or just ChatGPT or Gemini if you're lame and boring.

## Credits
Maid Ägir placeholder:
https://gelbooru.com/index.php?page=post&s=view&id=11145081

Send icon (in chat):
https://www.vecteezy.com/vector-art/21909958-abstract-logo-business-shape-element-clip-art-illustration-vector-geometric-simple-modern-and-clear

### Dependencies
- [`marked`](https://www.npmjs.com/package/marked) and [`dompurify`](https://www.npmjs.com/package/dompurify) for markdown rendering
- [`tokenx`](https://www.npmjs.com/package/tokenx) for token count estimation
- and [`rampike`](https://www.npmjs.com/package/rampike), it's just my own utility lib for rendering elements because the whole thing works on vanilla
