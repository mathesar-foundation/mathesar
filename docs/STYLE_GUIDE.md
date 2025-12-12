# Documentation style guide

This contains Kriti's notes from when she was revising docs in June 2023. This will eventually be a style guide.

- Use sentence case for titles. Don't capitalize random nouns.
    - Good:
        - Connect a database server
    - Bad:
        - Connect a Database Server
        - Connect a Database server
        - CONNECT A DATABASE SERVER
- When referencing external services or software, refer to them how they refer to themselves. e.g. write "Let's Encrypt", not "lets encrypt"
- When linking to external sites, identify the site. e.g. don't say "[Django settings](https://docs.djangoproject.com/en/4.2/topics/settings/)", say "Django settings ([see Django docs](https://docs.djangoproject.com/en/4.2/topics/settings/))".
    - We don't want to send users to external websites unexpectedly – external links should be clearly identified.
- Every item in a single list should be the same type of thing.
    - Good list:
        - Apples
        - Oranges
        - Bananas
    - Bad list:
        - Apples
        - Apples are grown all over the world
        - You can buy apples at the grocery store
- If you are using lists to collect different types of facts together, then give each list item a title, e.g.
    - Apples
        - **Origin**: Apples are grown all over the world
        = **Where to buy**: You can buy apples at the grocery store
- Don't have bullets on the same line as an info-box. It's okay to have an infobox under a list item, but it should be part of a previous bullet, not have its own bullet.
- Generally aim for simpler language since it's more accessible to non-native speakers. e.g. "acquisition" is more succinct, but "where to buy" is simpler.
     - **Where to buy**: You can buy apples at the grocery store
     - **Acquisition**: You can buy apples at the grocery store
- Don't use short-forms e.g. say "distributions", not "distros"
