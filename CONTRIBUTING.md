---
title: Contributing to Mathesar
description: 
published: true
date: 2023-03-21T13:07:48.773Z
tags: 
editor: markdown
dateCreated: 2021-06-03T13:18:27.111Z
---

Mathesar's development happens on [GitHub](https://github.com/centerofci/mathesar). We welcome contributions of all kinds!

## Joining the Community
We highly recommend joining our [Matrix community](/en/community/matrix) and our [developer mailing list](/en/community/mailing-lists) before making contributions. This is where most of the core team's conversations about building Mathesar happen.

## Contributing code

1. **Get Mathesar [running locally](https://docs.mathesar.org/contributing/local-dev/).**

    Make sure to **do this before moving on**. If you need help, ask in [Matrix](/community/matrix.md), taking care to form *specific* questions that people can answer asynchronously.

1. **Find an [issue](https://github.com/centerofci/mathesar/issues) to work on.**

    - ✅ Our easiest issues are labeled [good first issue](https://github.com/centerofci/mathesar/issues?q=is%3Aopen+is%3Aissue+no%3Aassignee+label%3A%22good+first+issue%22) and are a great place to start. However keep in mind that we're not always entirely sure of the necessary steps to solve a problem when we open an issue. 
    - ✅ Slightly more challenging issues are still labeled [help wanted](https://github.com/centerofci/mathesar/issues?q=is%3Aopen+is%3Aissue+no%3Aassignee+label%3A%22help+wanted%22). These can be a good place to start if you have some experience coding but are not yet familiar with our codebase.
    - ❌ Issues are not appropriate if they meet any of the following criteria:
        - already assigned to someone
        - labeled with a `restricted: ...` label
        - labeled with any `status: ...` label other than `status: ready`
    - ⚠️ Some issues fall into a middle ground, not being labeled "help wanted" or "restricted". These tickets are more challenging and are only appropriate for community contributors who are familiar with our codebase.

    If you want to work on something for which there is no GitHub issue open yet, create an issue and propose your change there. A Mathesar [team member](/team.md) will evaluate your issue and decide whether we'll accept a pull request for the issue.

1. ***(Optionally)* Claim the issue.**

    If the Mathesar team has already merged one of your PRs, then you may wish to ear-mark the issue for yourself so that other do not work on it concurrently.
    
    However, **if you are brand new to Mathesar, we recommend skipping this step** and making your changes *without* claiming the issue. (A core team member will assign the issue to you *after* you open a PR.) This recommendation is designed to reduce the overhead the core team has experienced from a high volume of contributors failing to follow through with their intent to submit PRs.

    If you decide to claim the issue:

    1. Comment on the ticket, saying *"I'd like to work on this"* or similar. If you're relatively new to the community, mentioning your PR(s) that we have already merged would be helpful.
    1. A core team member will assign you to the ticket.
    1. At this point **you have one week to follow up.** If we don't hear from you by then, we will unassign you from the ticket so that others may claim it. If you need more time, you can ask for an extension, explaining the progress you've made and the challenges you've encountered. If you have not begun work at all, then we will need to unassign you.

    Please do not claim more than 2 issues concurrently before submitting PRs.

1. **Begin making your changes.**

    - Make sure to follow our [code standards](/engineering/standards.md).
    - If you are not familiar with GitHub or pull requests, please follow [GitHub's "Hello World" guide](https://guides.github.com/activities/hello-world/) first. Make sure to commit your changes on a new git branch named after the ticket you claimed (instead of on `master`).
    - Commit early, commit often. Write good commit messages. Try to keep pull requests small if possible, since it makes review easier.
    - If you expect your work to last longer than 1 week, open a draft pull request for your in-progress work.

1. **Open a PR.**

    When you are ready for a core team member to review your changes, open a pull request (or mark your draft PR as ready for review). If you have already been corresponding with a core team member about the issue, then you may request a review from that person. Otherwise, you may leave your PR without any review requests and a core team member will assign someone to review it.

1. **Address critique from PR review.**

    - When making changes to address review critique, feel free to reply to threads within the PR (especially to point to specific commits which you think should address the critique), but do not click the "Resolve conversation" button on threads which other people have started.
    - If you are ready for a subsequent round of review, comment on the PR requesting another review and tagging the original reviewer.

## Contributing PR reviews

We encourage and appreciate code review by contributors. Feel free to review any open pull requests. Follow our [code review guidelines](/engineering/code-review.md).


## Contributing to UX and graphic design

> Due to limited capacity, we are currently unable to accept design volunteers. Please return to this page for updates.
{.is-warning}

Please read through our [Design](/design.md) section to learn more about our design process.

