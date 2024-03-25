# Front end code standards

## General

### Naming conventions

- File names for Components, Classes and Stylesheets should be in PascalCase. Examples:

  ```txt
  App.svelte
  CancellablePromise.ts
  App.scss
  ```

- Typescript file names should be in lowerCamelCase. Examples:

  ```txt
  index.ts
  utilityFunctions.ts
  ```

- All variables and constants should be in lowerCamelCase. Examples:

  ```javascript
  export let randomVariable;
  let aNewVariable = 'new variable';
  const someValue = 'constant value';
  ```

- All function names should be in lowerCamelCase. Examples:

  ```javascript
  function someFunction() {
    /* ... */
  }
  let someOtherFn = () => {
    /* ... */
  };
  const someConstFn = () => {
    /* ... */
  };
  ```

- All CSS class names should be in kebab-case. Examples:

  ```html
  <div class="cell-fabric"></div>
  <span class="editable-cell"></span>
  ```

- All directory names should be in kebab-case (hyphen-delimited). Examples:

  ```txt
  /components/text-input/
  /components/combo-boxes/multi-select/
  ```

- Acronyms within PascalCase and camelCase should be treated as words. Examples:

  ```txt
  UrlInput.svelte
  ```

  ```ts
  function getApiUrl() {
    /* ... */
  }
  let currentDbName;
  ```

  - [discussion](https://github.com/centerofci/mathesar/discussions/908)
  - Not all code conforms to this standard yet, and bringing existing code into conformance is a low priority.

- Use American English spelling instead of British English spelling. Examples:

  ```txt
  LabeledInput.svelte
  ColorSelector.svelte
  ```

  - [discussion](https://github.com/centerofci/mathesar/discussions/891)

- If a TypeScript file contains _only_ type definitions (without any values or implementation), then use the file extension `.d.ts` instead of `.ts`. If you use `enum` or `const` you'll need make the file a `.ts` file. If you only use `type` and `interface`, then make the file a `.d.ts` file.

- Prefer the term "delete" in code and UI over similar terms like "remove" and "drop".

  - [discussion](https://github.com/centerofci/mathesar/discussions/872)

## HTML

### Build components for valid DOM nesting

When working inside a component that _might_ be placed where [phrasing content](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#phrasing_content) is required, be sure to only use phrasing content elements (like `span`) instead of _not_-phrasing content elements (like `div`).

- ✅ Good

  `FancyCheckbox.svelte`

  ```ts
  <span class="make-it-fancy">
    <input type="checkbox" />
  </span>
  ```

- ❌ Bad because it uses `div` instead of `span`

  `FancyCheckbox.svelte`

  ```ts
  <div class="make-it-fancy">
    <input type="checkbox" />
  </div>
  ```

Rationale:

- For example, let's build on the "Bad" example above and write the following Svelte code:

  ```svelte
  <label>
    <FancyCheckbox />
    Foo
  </label>
  ```

  That Svelte code will render:

  ```html
  <label>
    <div class="make-it-fancy">
      <input type="checkbox" />
    </div>
    Foo
  </label>
  ```

  That markup has invalid DOM nesting because a `label` element can only contain phrasing content -- but a `div` is _not_ phrasing content.

Tips:

- You can make a `span` _act_ like a `div` by setting `display: block` if needed.

Notes:

- Not all of our components adhere to this guideline yet.

## CSS

### CSS units

- Don't use `px` — use `rem` or `em` instead.

  Exceptional cases where `px` is okay:

  - when setting the root `font-size`

Note: some of our older code still does not conform to this standard.

### Component spacing and layout

To preserve modularity and encapsulation, components should not define their own layout-related behavior — instead the consuming component should be responsible for layout and spacing. Components should not set any space around their outer-most visual edges or define their own z-index.

- **margin**: The component's root element should not set any margin.
- **padding**: If the component's root element has border, it's fine to set padding because the border will serve as the outer-most visual edge. But if there's no border, then there should be no padding.
- **z-index**:

  - The component's root element should not set any z-index.
  - It's fine for child elements _within the component_ to set a z-index, but in such cases the component's root element must establish its own [stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context). It's best to use `isolation: isolate;` to establish the stacking context because it clearly communicates intent and works without setting z-index. Once your component has its own stacking context, then you're free to set the z-index values within the component without thinking about anything outside the component. You can use simple values like `1` and `2` within the component because everything is encapsulated.
  - If you want to render a child component with a specific z-index, then prefer to nest the child component inside a DOM element, setting the z-index on the DOM element (not the component).
  - If you absolutely must pass a z-index value _into_ a component, then do so using CSS variables as follows:

    1. Within the parent component (that establishes a stacking context), define one CSS variable for each "layer" within that stacking context.
    1. Follow this naming convention to scope your CSS variables:

       ```css
       .record-selector-window {
         --z-index__record_selector__row-header: 1;
         --z-index__record_selector__thead: 2;
         --z-index__record_selector__thead-row-header: 3;
         --z-index__record_selector__shadow-inset: 4;
         --z-index__record_selector__overlay: 5;
         --z-index__record_selector__above-overlay: 6;
       }
       ```

       Here, the name of each variable begins with `z-index`, then has a name to represent the stacking context (in this case `record-selector`), then has a name to represent the layer within that stacking context (e.g. `row-header`). Double underscores delimit those three pieces of the variable.

## JavaScript

### `await` vs `.then`

Prefer `await` over `.then` when possible.

- ✅ Good

  ```ts
  async function handleSave() {
    isLoading = true;
    try {
      await save(value);
    } catch (e: unknown) {
      error = getErrorMessage(e);
    } finally {
      isLoading = false;
    }
  }
  ```

- ❌ Bad

  ```ts
  function handleSave() {
    isLoading = true;
    save(value)
      .then(() => {
        isLoading = false;
        return true;
      })
      .catch((e: unknown) => {
        error = getErrorMessage(e);
        isLoading = false;
      });
  }
  ```

### `function` vs `const`

Prefer `function` over `const`

- ✅ Good

  ```ts
  function withFoo(s: string) {
    return `${s} foo`;
  }
  ```

- ❌ Bad

  ```ts
  const withFoo = (s: string) => {
    return `${s} foo`;
  };
  ```

Rationale:

- The `function` syntax is more concise, with less likelihood of line wrapping.

- With TypeScript, adding explicit return type annotations becomes significantly more verbose when using the `const` approach. For example,

  ```ts
  export const withFoo: (s: string) => string = (s: string) => {
    return `${s} foo`;
  };
  ```

  We don't require explicit return types everywhere, but we do use the [explicit-module-boundary-types](https://github.com/typescript-eslint/typescript-eslint/blob/v4.33.0/packages/eslint-plugin/docs/rules/explicit-module-boundary-types.md) linting rule to require them for _exported_ functions. This makes TS errors appear closer to the code that should be fixed and also provides some small performance gains with `tsc`.

## TypeScript

### `type` vs `interface`

- Prefer `interface` when possible.
- Use `type` when necessary.

### `null` vs `undefined`

Prefer using `undefined` over `null` where possible.

- ✅ Good

  ```ts
  const name = writable<string | undefined>(undefined);
  ```

- ❌ Bad because it uses `null` when it could use `undefined`

  ```ts
  const name = writable<string | null>(null);
  ```

- ❌ Bad because it uses an empty string to represent an empty value when it probably should be using `undefined` for greater code clarity.

  ```ts
  const name = writable<string>('');
  ```

- ❌ Bad because it mixes `null` and `undefined` into the same type.

  ```ts
  const name = writable<string | undefined | null>(null);
  ```

- ✅ Acceptable use of `null` because it's necessary for data that will be serialized to JSON. (Using `undefined` here would result in that key/value pair being removed from the JSON string).

  ```ts
  await patchApi(url, { name: null });
  ```

- ✅ Acceptable use of `null` because the `Checkbox` component is designed to accept a `null` value to place the checkbox into an indeterminate state.

  ```svelte
  <Checkbox value={null} />
  ```

Considerations:

- In some cases you may need to coalesce a `null` value to `undefined`. For example:

  ```ts
  function firstCapitalLetter(s: string): string | undefined {
    return s.match(/[A-Z]/)?.[0] ?? undefined;
  }
  ```

Additional context:

- [discussion](https://github.com/centerofci/mathesar/discussions/825)

### API type definitions

TypeScript types (including interfaces) which describe API requests and responses (and properties therein) should be separated from other front end code and placed in the `mathesar_ui/src/api` directory. This structure serves to communicate that, unlike other TypeScript types, the front end does not have control over the API types.

[Discussion](https://github.com/centerofci/mathesar/discussions/875)

## Svelte

### Do not dispatch events from components

⚠️ **Note:** This is a new standard and our codebase is not yet in compliance with it. _New_ code should adhere to the standard, and refactoring should take this standard into account when feasible.

Svelte has an [events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname) system whereby components can dispatch events to imperatively pass messages and data to their parents.

- ✅ It's okay to listen to Svelte events _on DOM nodes_. For example:

    ```svelte
    <button on:click={handleClick}>
    ```

- ❌ It's not okay to use events on our components

    ```svelte
    <Button on:click={handleClick}>
    ```

- ✅ **Our components should use props instead of events**

    ```svelte
    <Button onClick={handleClick}>
    ```

- When consuming third party components that use events, it's okay to listen to those events directly. (No need to wrap it in a component that complies with our code standards.)

- For example, in a `Child.svelte` component:

    - ❌ Events are dispatched as follows. Don't do this.

        ```svelte
        <script lang="ts">
          import { createEventDispatcher } from 'svelte';

          const dispatch = createEventDispatcher<{ valueChange: number }>();

          dispatch('valueChange', 42);
        </script>
        ```

    - ✅ Use props instead.

        ```svelte
        <script lang="ts">
          export onValueChange: (value: number) => void;

          onValueChange(42);
        </script>
        ```

- Then, in the consuming (parent) component:

    - ❌ Events would be handled as follows:

        ```svelte
        <script lang="ts">
          import Child from `./Child.svelte`;

          function handleValueChange({ detail: value }: CustomEvent<number>) {
                                  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Yuck!
            console.log(`Child reports that its value is: ${value}`)
          }
        </script>

        <Child on:valueChange={handleValueChange}/>
        ```

    - ✅ With props:

        ```svelte
        <script lang="ts">
          import Child from `./Child.svelte`;

          function handleValueChange(value: number) {
                                  // ^^^^^^^^^^^^^ Nicer!
            console.log(`Child reports that its value is: ${value}`)
          }
        </script>

        <Child onValueChange={handleValueChange}/>
        ```

- Rationale

    | | Events | Props |
    | --  | -- | -- |
    | Synchronicity | ❌ Events are always synchronous. There's no way to await the `dispatch` call. | ✅ Props give us the ability to define asynchronous callbacks and then await them within the component. We do this within `SpinnerButton` for example. |
    | Dynamic passing | ❌ Event callbacks [cannot be passed dynamically](https://stackoverflow.com/questions/60934557/how-to-bind-events-dynamically-in-svelte) to dynamically rendered components with `<svelte:component>`. This makes it impossible to do things like perform imperative logic when we're using a `ComponentAndProps` object. | ✅ Props callbacks are easily passed via spreading `{...props}` |
    | Forwarding | ❌ Event callbacks [cannot be forwarded en masse to child components](https://github.com/sveltejs/svelte/issues/2837). Instead, each event must be manually forwarded. This makes composition more arduous. | ✅ Props callbacks are easily forwarded en masse to child components via `{...$$restProps}` |
    | Callback parameters | ❌ Events require destructuring the `detail` property when defining callback functions that accept values. This is extra syntax, especially in the type signature of the callback function. | ✅ Props allow us to defined the callback function parameters as we see fit, with no destructuring needed. This is cleaner. |
    | Required callbacks | ❌ Events are always optional. There is no way to enforce consumers to implement callback functions. This can lead to bugs when someone writing a child component assumes that all parents will implement the callback function. | ✅ Props can be required through the type system. In fact, they are required _by default_. Extra code is necessary to make them optional. The strict defaults make it less bug-prone because error are caught at compile time. |
    | Simplicity | ❌ Events require extra code to import and call `createEventDispatcher`. | ✅ Props require less code. |
    | Type safety | ❌ Events Require diligence to obtain type safety. It's easy to accidentally call `createEventDispatcher` without passing type arguments. | ✅ Props are type safe by default. |
    | Introspection | ❌ Events are defined in many places throughout the component. Determining the events that a component dispatches requires searching the whole file for `dispatch` (or potentially a different string, if the component uses a non-idiomatic event dispatcher name) and searching the whole file for `on:` (because child components might be forwarding events). | ✅ Props are reliably defined in one easy-to-find place. |
    | Inline modifiers | ⚖️ Events can call `preventDefault` and `stopPropagation` _inline_ which might save one or two lines of code. However, the rationale for using such modifiers is often not self evident, and placing them inline discourages code comments which would express intent and justify their usage. | ⚖️ Props require slightly more code when adding modifiers. But putting the modifiers on their own lines encourages devs to add code comments explaining why the modifiers are necessary. |
    | Idioms | ⚖️ Events are more idiomatic within the Svelte and Vue communities. | ⚖️ Props are more idiomatic within the React community. |

### Minimize Svelte store instances

- ✅ Good because only one `cost` store is created.

  ```ts
  function getCost(toppings: Readable<string[]>) {
    return derived(this.toppings, (t) => 10 + t.length * 2);
  }

  class PizzaOrder {
    toppings: string[];
    cost: Readable<number>;

    constructor() {
      this.toppings = [];
      this.cost = getCost(this.toppings);
    }
  }
  ```

- ❌ Bad because separate calls to `cost` will create separate stores which may lead to more subscribe and unsubscribe events in some cases, risking performance problems.

  ```ts
  class PizzaOrder {
    toppings: string[];

    constructor() {
      this.toppings = [];
    }

    get cost(): Readable<boolean> {
      return derived(this.toppings, (t) => 10 + t.length * 2);
    }
  }
  ```

Additional context:

- [Discussion](https://github.com/centerofci/mathesar/pull/776#issuecomment-963831424)

### When using `{...$$restProps}`, define a `$$Props` type

- Example:

  - `Child.svelte`

    ```svelte
    <script lang="ts>
      export let word: string;
    </script>

    <span class="child">{word}</span>
    ```

    `Child` explicitly accepts a `word` prop.

  - `Parent.svelte`

    ```svelte
    <script lang="ts>
      import type { ComponentProps } from 'svelte';

      import Child from './Child.svelte`;

      type $$Props = ComponentProps<MessageBox>;
    </script>

    <Child {...$$restProps} />
    ```

    TypeScript knows that `Parent` accepts a `word` prop too because we have defined `$$Props` as such.

  - `Grandparent.svelte`

    ```svelte
    <script lang="ts>
      import Parent from './Parent.svelte`;
    </script>

    <Parent word="foo" />
    ```

    Passing `"foo"` to the `word` prop here is type-safe.

- If you want to alter the props, you can define `$$Props` like this:

  ```ts
  interface $$Props extends Omit<ComponentProps<Child>, 'notThatOne'> {
    addThisOne: string;
  }
  ```

  You can search our codebase for `$$Props` to see the various ways we're using it.
