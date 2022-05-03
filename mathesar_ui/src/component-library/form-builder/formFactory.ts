import { derived, get, writable, readable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type {
  FormConfiguration,
  FormBuildConfiguration,
  FormValues,
  FormValidationResult,
  FormElement,
} from './types';
import { computeIfElements, computeSwitchElements } from './utils';

function getNamesOfVariablesInUse(
  element: FormElement,
  values: FormValues,
): Set<string> {
  const variablesInUse: Set<string> = new Set();
  let childElements: FormElement[] = [];
  if (element.type === 'input' || element.type === 'static') {
    variablesInUse.add(element.variable);
  } else if (element.type === 'switch') {
    const valueOfVariable = values[element.variable];
    childElements = computeSwitchElements(valueOfVariable, element);
  } else if (element.type === 'if') {
    const valueOfVariable = values[element.variable];
    childElements = computeIfElements(valueOfVariable, element);
  } else if (element.type === 'layout' || !element.type) {
    childElements = element.elements;
  }
  childElements.forEach((childElement) => {
    getNamesOfVariablesInUse(childElement, values).forEach((variable) =>
      variablesInUse.add(variable),
    );
  });
  return variablesInUse;
}

function getNamesOfConditionalVariables(element: FormElement): Set<string> {
  const conditionalVariables: Set<string> = new Set();
  let childElements: FormElement[] = [];
  if (element.type === 'switch') {
    conditionalVariables.add(element.variable);
    const allChildrenOfCases: FormElement[] = [];
    Object.keys(element.cases).forEach((caseKey) => {
      allChildrenOfCases.push(...element.cases[caseKey]);
    });
    childElements = allChildrenOfCases;
  } else if (element.type === 'if') {
    conditionalVariables.add(element.variable);
    childElements = element.elements;
  } else if (element.type === 'layout' || !element.type) {
    childElements = element.elements;
  }
  childElements.forEach((childElement) => {
    getNamesOfConditionalVariables(childElement).forEach((variable) =>
      conditionalVariables.add(variable),
    );
  });
  return conditionalVariables;
}

export function makeForm(
  formConfig: FormConfiguration,
  formValues?: FormValues,
  customComponents?: FormBuildConfiguration['customComponents'],
): FormBuildConfiguration {
  const conditionalVariableNames = getNamesOfConditionalVariables(
    formConfig.layout,
  );

  const stores: FormBuildConfiguration['stores'] = new Map();
  Object.keys(formConfig.variables)?.forEach((key) => {
    const value =
      typeof formValues?.[key] !== 'undefined'
        ? formValues[key]
        : formConfig.variables[key].default;
    const store = writable(value);
    stores.set(key, store);
  });

  function getAllValues(): FormValues {
    const allValues: FormValues = {};
    stores.forEach((store, variableName) => {
      allValues[variableName] = get(store);
    });
    return allValues;
  }

  function getValuesStore(): Readable<FormValues> {
    let results: FormValues = {};
    /**
     * namesOfVariablesInUse is not made a store of it's own as an optimization step.
     * If it was a store, we'll have to subscribe to it as well leading to multiple
     * set calls whenever a conditional store value changes.
     */
    let namesOfVariablesInUse = getNamesOfVariablesInUse(
      formConfig.layout,
      getAllValues(),
    );
    return readable(results, (set) => {
      const unsubscribers = [...stores].map(([variableName, store]) =>
        store.subscribe(() => {
          const allValues = getAllValues();
          if (conditionalVariableNames.has(variableName)) {
            namesOfVariablesInUse = getNamesOfVariablesInUse(
              formConfig.layout,
              allValues,
            );
          }
          results = {};
          namesOfVariablesInUse.forEach((nameOfVariableInUse) => {
            results[nameOfVariableInUse] = allValues[nameOfVariableInUse];
          });
          set(results);
        }),
      );
      return () => unsubscribers.forEach((unsubscriber) => unsubscriber());
    });
  }

  const values: Readable<FormValues> = getValuesStore();

  const validationStore: Readable<FormValidationResult> = derived(
    values,
    ($values) => {
      const validationObj: FormValidationResult = {
        isValid: true,
        failedChecks: {},
      };
      Object.keys($values).forEach((variableName) => {
        const storedValue = $values[variableName];
        const variableInfo = formConfig.variables[variableName];
        const validationRules = variableInfo?.validation;
        if (variableInfo && validationRules) {
          const { checks } = validationRules;
          if (checks.includes('isEmpty')) {
            let isValid =
              typeof storedValue !== 'undefined' && storedValue !== null;
            if (variableInfo.type === 'string') {
              isValid = isValid && storedValue !== '';
            }
            if (!isValid) {
              if (!validationObj.failedChecks[variableName]) {
                validationObj.failedChecks[variableName] = [];
              }
              validationObj.failedChecks[variableName].push('isEmpty');
            }
            validationObj.isValid = validationObj.isValid && isValid;
          }
        }
      });
      return validationObj;
    },
  );

  function getValidationResult(): FormValidationResult {
    return get(validationStore);
  }

  return {
    ...formConfig,
    stores,
    values,
    validationStore,
    getValidationResult,
    customComponents,
  };
}
