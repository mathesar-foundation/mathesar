# Contributor Guide

This guide explains Mathesar's collaboration workflow and processes. Also see our [Developer Guide](./DEVELOPER_GUIDE.md) to learn how to work with Mathesar's code.

Mathesar's development happens on [GitHub](https://github.com/mathesar-foundation/mathesar). We welcome contributions of all kinds!

## Joining the Community

We highly recommend joining our [Matrix community](https://wiki.mathesar.org/en/community/matrix) and our [developer mailing list](https://wiki.mathesar.org/en/community/mailing-lists) before making contributions. This is where most of the core team's conversations about building Mathesar happen.

## Contributing code

1. **Get Mathesar [running locally](./DEVELOPER_GUIDE.md#local-development-setup).**

    Make sure to **do this before moving on**. If you need help, ask in [Matrix](https://wiki.mathesar.org/en/community/matrix), taking care to form *specific* questions that people can answer asynchronously.

1. **Find an [issue](https://github.com/mathesar-foundation/mathesar/issues) to work on.**

    - ✅ All issues open to community contribution are labeled [help wanted](https://github.com/mathesar-foundation/mathesar/issues?q=is%3Aopen+is%3Aissue+no%3Aassignee+label%3A%22help+wanted%22). Look through these to find a task.
    - ✅ Additionally, the easiest of those issues are labeled [good first issue](https://github.com/mathesar-foundation/mathesar/issues?q=is%3Aopen+is%3Aissue+no%3Aassignee+label%3A%22good+first+issue%22). However keep in mind that we're not always entirely sure of the necessary steps to solve a problem when we open an issue, so there could be larger challenges lurking within some of that work.
    - ❌ If an issue is _not_ labeled "help wanted", then it is not open to community contribution. One of the Mathesar maintainers will work on it instead.
    - ❌ Issues already assigned to other users are also not open to contribution.

    If you want to work on something for which there is no GitHub issue open yet, [create an issue](https://github.com/mathesar-foundation/mathesar/issues/new/choose) and propose your change there. A Mathesar [team member](https://wiki.mathesar.org/en/team) will evaluate your issue and decide whether we'll accept a pull request for the issue.

1. ***(Optionally)* Claim the issue.**

    If the Mathesar team has already merged one of your PRs, then you may wish to ear-mark the issue for yourself so that other do not work on it concurrently.
    
    However, **if you are brand new to Mathesar, we recommend skipping this step** and making your changes *without* claiming the issue. (A core team member will assign the issue to you *after* you open a PR.) This recommendation is designed to reduce the overhead the core team has experienced from a high volume of contributors failing to follow through with their intent to submit PRs.

    If you decide to claim the issue:

    1. Comment on the ticket, saying *"I'd like to work on this"* or similar. If you're relatively new to the community, mentioning your PR(s) that we have already merged would be helpful.
    1. A core team member will assign you to the ticket.
    1. At this point **you have one week to follow up.** If we don't hear from you by then, we will unassign you from the ticket so that others may claim it. If you need more time, you can ask for an extension, explaining the progress you've made and the challenges you've encountered. If you have not begun work at all, then we will need to unassign you.

    Please do not claim more than 2 issues concurrently before submitting PRs.

1. **Begin making your changes.**

    - Refer to our **[Developer Guide](./DEVELOPER_GUIDE.md)** for questions about the code.
    - Make sure to follow our [front end code standards](./mathesar_ui/STANDARDS.md) and [API standards](./mathesar/api/STANDARDS.md) where applicable.
    - If you are not familiar with GitHub or pull requests, please follow [GitHub's "Hello World" guide](https://guides.github.com/activities/hello-world/) first. Make sure to commit your changes on a new git branch named after the ticket you claimed. Base that new branch on our `develop` branch.
    - Commit early, commit often. Write [good commit messages](https://gist.github.com/robertpainsi/b632364184e70900af4ab688decf6f53). Try to keep pull requests small if possible, since it makes review easier.
    - If you expect your work to last longer than 1 week, open a draft pull request for your in-progress work.

1. **Open a PR.**

    When you are ready for a core team member to review your changes, open a pull request (or mark your draft PR as ready for review). If you have already been corresponding with a core team member about the issue, then you may request a review from that person. Otherwise, you may leave your PR without any review requests and a core team member will assign someone to review it.

1. **Address critique from PR review.**

    - When making changes to address review critique, feel free to reply to threads within the PR (especially to point to specific commits which you think should address the critique), but do not click the "Resolve conversation" button on threads which other people have started.
    - If you are ready for a subsequent round of review, comment on the PR requesting another review and tagging the original reviewer.

## Contributing PR reviews

We encourage and appreciate code review by contributors. Feel free to review any open pull requests. Follow our [code review guidelines](https://wiki.mathesar.org/en/engineering/code-review).

## Contributing documentation

- Help improve our user and administrator documentation (published to https://docs.mathesar.org/) by editing the markdown files in the `/docs` directory of this repo. See our [Documentation guide](./docs/README.md) for more info.

- Developer-focused documentation lives in other markdown files throughout this repo, and we welcome PRs to improve this content. All PRs should target the `develop` branch.

## Contributing to UX and graphic design

Due to limited capacity, we are currently unable to accept design volunteers. Please return to this page for updates.

Please read through our [Design](https://wiki.mathesar.org/en/design) section to learn more about our design process.

