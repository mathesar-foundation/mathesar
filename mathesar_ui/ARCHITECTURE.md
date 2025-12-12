# Front end code architecture

## Introduction

This article aims to document the major patterns that are being used in the frontend codebase. Learning about these patterns will help speed up the process of onboarding on the codebase for a completely new person.

There are a lot of varying patterns that you will find in the codebase which we do not recommend anymore and hence are not even documented here.

## Rendering Architecture & Common Data

When you hit the base route in your browser's address bar, the initial request is served by the Django server. Depending on the authentication state of the user an appropriate HTML file is being served.

If the user is authenticated, the server embeds some data in the JSON format inside the HTML. The data is embedded inside an HTML tag with the id `common-data`. Internally we also refer to this data using the terminology `commonData`.

This JSON is used by the frontend code to render the UI on the first load without having to make additional round trips to the server.

Code related to this can be find inside: `src/utils/preload.ts`.

## Store patterns

We use [Svelte stores](https://svelte.dev/tutorial/writable-stores) as our main state management tool. With stores alone being quite simple, we have evolved different patterns for using stores to manage more complex state.

### The immutable class pattern - Coarse Reactivity

A writable Svelte store holds an instance of a custom immutable class.

- **Updating the store**:

  ```typescript
  pizza.update((p) => p.withTopping('mushrooms'));
  ```

- **Benefits**:

  - The class is kept simple.
  - Unit tests for the class can be written declaratively with no need to sequentially build up state.
  - Avoiding invalid state is straightforward because the constructor can serve as a single point of control for complex validation and recovery logic.

- **Examples**: [Filtering](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/stores/table-data/filtering.ts#L42)

### The mutable class pattern - Granular Reactivity

A custom class has a property which holds an instance of a writable Svelte store. The class provides methods to update that store. The class may even have more than one such store.

- **Updating the store**:

  ```typescript
  pizza.addTopping('mushrooms');
  ```

- **Benefits**:

  - The consuming code is kept clean and simple.
  - Reactivity is granular, which might be crucial for performance or UX concerns

- Sub-patterns with varying member visibility

  - **Public**: In many cases the underlying store is public, grating consumers the privilege to modify the store directly without calling the store methods. We would like to avoid this pattern going forward to reduce the opportunity for bugs.

    Example: [RecordsData](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/stores/table-data/records.ts#L269)

  - **Publicly readable, privately writable**: We use the `MakeWritablePropertiesReadable` utility to enforce read-only checks at compile time. We would like to employ this pattern more widely moving forward.

    Example: [WritableUserStore](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/stores/users.ts#L167)

  - **Private**: In some cases the underlying store is made entirely private, and other derived stores publicly expose read-only versions of slightly modified data.

    Example: [RecordSummaryStore](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/stores/table-data/record-summaries/RecordSummaryStore.ts#L23) (two private stores combined into one publicly readable store)

### Nested store patterns - Granular Reactivity

A writable Svelte store can hold one or more writable Svelte stores, with some other stuff in between.

This is more complex, more bespoke, and thus harder to categorize, but here are some examples in our codebase:

- [TabularData](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/stores/table-data/tabularData.ts#L49) contains a bunch of stores, and is also nested inside a writable Svelte store itself via `setTabularDataStoreInContext`. The indirection is handled at the component layer via reactive destructuring.

  ```ts
  const tabularData = getTabularDataStoreFromContext();
  $: ({ isLoading } = $tabularData);
  $: yadaYada = $isLoading;
  ```

- The [Form](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/components/form/form.ts#L34) system is an outer store with one store per field. It handles some of the this indirection _outside_ the component system by using the [unite](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/component-library/common/utils/storeUtils.ts#L43) utility to combine many inner stores into one outer store.

## Passing stores to components

### via props

A component can only receive a store instance from its immediate ancestor.

- This is common enough to be rather trivial, but it's worth mentioning for the sake of contrast.

### via context

A component can use Svelte's [Context API](https://svelte.dev/tutorial/context-api) to receive a store instance from _any_ of its ancestors.

- This pattern is appropriate when props would need to be drilled down through many levels of the component hierarchy. How many is _too_ many? We don't have any rules around this. If you're unsure whether or not to use context, it may be best to start with props and grow to context as needed.
- As a convention, we wrap Svelte's `getContext` and and `setContext` functions in our own utility functions. This makes consuming code a bit simpler, especially with regard to types. See [UserProfileStore](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/stores/userProfile.ts#L11) as an example.

### via ESM imports

The store instance is a global singleton, shared by any components that import it.

- This pattern is appropriate for cases where we expect every single page within the application to always have one and only instance of the store. The toast system is a good example.
- We used this pattern more in early code and we would like to use it less going forward to avoid problems like [this](https://github.com/centerofci/mathesar/pull/2213#discussion_r1081799469). There are some examples of this pattern that we may eventually convert to use other patterns.

## Notable stores

### TabularData

[TabularData](https://github.com/centerofci/mathesar/blob/60d50dbcabb519f4260500724aef2ba6fbc96059/mathesar_ui/src/stores/table-data/tabularData.ts#L49) provides a bit of a nexus where many things come together for when rendering a table. It's a good place to start learning about our store system.

## Dealing with APIs

In the majority of the codebase, the API calls are being tightly coupled with the stores. Look at the schemas store here: `mathesar_ui/src/stores/schemas.ts`.

But with the recent [proposal](https://github.com/centerofci/mathesar-wiki/blob/fe-rfc-users-permissions/engineering/specs/usersandpermissions.md#proposal) the API calls are being separate out in `src/api`.

1. There is a directory `src/api/` that contains `src/api/types` and `src/api/utils`. The new files will be placed within `src/api/`.
2. Each utility file will export its related types. A good example will be to look at: `src/api/users.ts`.

## Component library

Mathesar is built on top of its custom UI library. The library lives inside the `src/component-library`. The code inside the library has the following structure:

```
src
	component-library
		<component-name>
			__meta__
				This contains component playbook stories, and tests for this component

			ComponentName.svelte
			ComponentName.scss
```

See the [Components README](./src/component-library/README.md) for more details.

## Form library

Mathesar uses its own custom form creation and validation library. It lives in `src/components/form`. You can read more about this library here: https://github.com/centerofci/mathesar/pull/1932 under the following headings in the PR description

1. An example form
2. How it works

## Icons

Mathesar uses svg icons throughout the application. There is an `Icon` (can be found here: `mathesar_ui/src/component-library/icon/Icon.svelte`) component inside the `component-library` that is responsible for rendering the correct icon given the svg data.

### Storage of icons from font-awesome

All icons are named after a concept that they denote instead of their appearance. These icons are also stored at two central locations:

1. Icons that belong to the component library - `src/component-library/common/icons.ts`
2. Icons that belong to the application codebase - `src/icons/index.ts`

More on icon naming here: https://github.com/centerofci/mathesar/issues/1187

### Custom Icons

There are a few cases where custom icons or non-font-awesome icons are being the user. The svg data of these icons are stored here: `src/icons/customIcons.ts`. Custom icon data is stored so that it can again be rendered using the `Icons` component.
