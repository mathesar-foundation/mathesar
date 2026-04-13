import { describe, it, expect } from 'vitest';
import type { StepNode } from '../types';
import { compareStepTrees } from '../engine/step-tree-compare';

describe('compareStepTrees', () => {
  it('identical trees pass comparison', () => {
    const tree: StepNode[] = [
      { type: 'action', label: 'Do A' },
      { type: 'check', label: 'Verify B' },
    ];
    const result = compareStepTrees('test', tree, tree);
    expect(result).toBeNull();
  });

  it('different number of steps fails', () => {
    const dryRun: StepNode[] = [
      { type: 'action', label: 'A' },
      { type: 'action', label: 'B' },
      { type: 'check', label: 'C' },
    ];
    const execution: StepNode[] = [
      { type: 'action', label: 'A' },
      { type: 'action', label: 'B' },
    ];
    const result = compareStepTrees('test-code', dryRun, execution);
    expect(result).not.toBeNull();
    expect(result!.message).toContain("Step count mismatch in 'test-code'");
    expect(result!.message).toContain('dry-run had 3 steps, execution had 2');
  });

  it('different step labels fails', () => {
    const dryRun: StepNode[] = [
      { type: 'action', label: 'Create DB' },
    ];
    const execution: StepNode[] = [
      { type: 'action', label: 'Create Table' },
    ];
    const result = compareStepTrees('test-code', dryRun, execution);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('Step label mismatch');
    expect(result!.message).toContain("dry-run had 'Create DB', execution had 'Create Table'");
  });

  it('different step types fails (action vs check)', () => {
    const dryRun: StepNode[] = [
      { type: 'action', label: 'Same label' },
    ];
    const execution: StepNode[] = [
      { type: 'check', label: 'Same label' },
    ];
    const result = compareStepTrees('test-code', dryRun, execution);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('Step type mismatch');
    expect(result!.message).toContain("dry-run had 'action', execution had 'check'");
  });

  it('different sub-step references fails', () => {
    const dryRun: StepNode[] = [
      { type: 'step', label: 'Run auth', testCode: 'login', children: [] },
    ];
    const execution: StepNode[] = [
      { type: 'step', label: 'Run auth', testCode: 'signup', children: [] },
    ];
    const result = compareStepTrees('test-code', dryRun, execution);
    expect(result).not.toBeNull();
    expect(result!.message).toContain("dry-run referenced 'login', execution referenced 'signup'");
  });

  it('nested tree differences detected', () => {
    const dryRun: StepNode[] = [
      {
        type: 'step',
        label: 'Create DB',
        testCode: 'create-db',
        children: [
          { type: 'action', label: 'Inner action' },
          { type: 'check', label: 'Inner check' },
        ],
      },
    ];
    const execution: StepNode[] = [
      {
        type: 'step',
        label: 'Create DB',
        testCode: 'create-db',
        children: [
          { type: 'action', label: 'Inner action' },
        ],
      },
    ];
    const result = compareStepTrees('parent-test', dryRun, execution);
    expect(result).not.toBeNull();
    expect(result!.message).toContain("step 'Create DB'");
    expect(result!.message).toContain('Step count mismatch');
  });

  it('provides clear message about conditional steps being disallowed', () => {
    const dryRun: StepNode[] = [
      { type: 'action', label: 'A' },
    ];
    const execution: StepNode[] = [];
    const result = compareStepTrees('test', dryRun, execution);
    expect(result).not.toBeNull();
    expect(result!.message).toContain(
      'conditional steps based on runtime values, which is not supported',
    );
  });
});
