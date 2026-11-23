Hi! I'll try to keep it short.

# How LLMs work in roleplay
During a roleplay session, the <abbr title="A website or an app like JanitorAI, Saucepan, SillyTavern, Ägir and Kawakaze that offers an interface to interact with LLMs and stores chats and settings.">RP frontend</abbr> sends the chat contents to the <abbr title="Large Language Model, also referred to as &quot;AI&quot;, &quot;chat bot&quot;, &quot;the model&quot;, etc. A program that generates text.">LLM</abbr> through a service like OpenRouter and asks it to write a response. The chat contents are just a list of messages, and each message <abbr title="There are others, like &quot;tool&quot; and &quot;developer&quot;, which aren't relevant for roleplay">has a role</abbr>: `"user"`, `"assistant"` (sometimes `"model"`) or `"system"`. The first two are what you see in the chat interface. The `system` messages contain instructions, including the descriptions of the characters and the roleplay rules. They are made mostly from what the creator writes in the character definition.

# What macros are
When a user starts a chat with a character, the RP frontend takes the character definition and replaces macros like `{{char}}` and `{{user}}` with actual text: `{{char}}` becomes the character's name, and `{{user}}`, `{{persona}}` and the pronoun macros become the name, description and pronouns of the user's persona.

Macros simply mark the spots where text needs to be replaced. The LLM never sees them and doesn't treat them in any special way. Many authors write something like "`{{char}} is Mika`" in their character definitions, apparently expecting it to do some kind of magic trick, while in reality the frontend turns it into "`Mika is Mika`" the moment a user starts a chat. So don't do that.

# I made bots on Janitor, Saucepan or another platform before. How is Ägir different?
Not by much, but there is one key difference. On websites like Janitor, to make a bot you fill in several sections like "Personality", "Scenario" and "Example dialogs". Janitor takes those texts and combines them into a single system message like this:
```
<Mika's persona>
The text you put into the "Personality" section
</Mika's persona>
<User's persona>
The description of the persona the user picked
</User's persona>
<Scenario>
The text you put into the "Scenario" section
</Scenario>
<Example dialogs>
The text you put into the "Example dialogs" section
</Example dialogs>
```

It's made this way to guide you and to show what needs to be written in a prompt for the LLM to work. However, it also limits your options if you have, say, multiple characters or want to give special instructions. Many character cards end up with <abbr title="LLM instructions">prompts</abbr> like this:

```
<Alice & Bob's persona>
...
</Alice & Bob's persona>
...
<Scenario>
Feel free to introduce other characters when the situation allows it. Never speak for the user.
</Scenario>
```

It still works, since LLMs are smart enough to figure out what it means, but it certainly doesn't help, and it simply **feels wrong**.

On Ägir, you control the whole prompt that is sent to the LLM. The character definition is sent as is, with only the macros replaced:
```
# Characters
## {{char}}
{{char}} is a 1337-year-old evil witch.

## {{user}}
{{persona}}

# Scenario
The setting is modern.

# Instructions
The user is {{user}}; all other characters are played by you.
```

That gives you complete freedom: the user's persona is just one of the characters on the list, you can easily add more characters, and you can add or remove any sections you want. There is no strict format you have to follow. That lets you do things like this:
```
# Characters
## Alice
A 1337-year-old evil witch.

## Bob
Alice's landlord.

## {{user}}
{{persona}}
Cursed by Alice to have {{poss}} feet constantly itchy.

## {{user}}'s evil clone
Looks like {{user}}, but with glowing red eyes. Serves Alice.
```

You may have noticed that Janitor's prompts are formatted with angle brackets, while the Ägir examples use [markdown](https://www.markdownguide.org/cheat-sheet/) headers. There's no meaningful difference between these styles; it's a matter of taste. LLMs don't have any special tools to parse these messages: an LLM reads and understands a prompt in roughly the same way a human would, so you are free to pick whatever feels right to you.
