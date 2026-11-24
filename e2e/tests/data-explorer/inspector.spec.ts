import { type Exploration, uniqueName } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { chooseOption } from '../../support/ui/components/select';
import { selectOptions } from '../../support/ui/pages/exploration-transformations';
import { expect, test } from './library';

test.describe('the inspector of a saved exploration', () => {
  let name: string;
  let exploration: Exploration;

  test.beforeEach(async ({ api, library, dataExplorer }) => {
    name = uniqueName('Book lengths');
    exploration = await api.defineExploration(library.books, {
      name,
      description: 'Pages per book',
      columns: ['Title', 'Pages'],
    });
    await dataExplorer.gotoSaved(library.books.schema, exploration.id);
  });

  test('asks for a selection on the "Column" and the "Cell" tab', async ({
    dataExplorer: { inspector },
  }) => {
    await inspector.tab('Column').click();
    await expect(inspector.panel).toHaveText(
      'Select a column to view its properties.',
    );

    await inspector.tab('Cell').click();
    await expect(inspector.panel).toHaveText(
      'Select a cell to view its properties.',
    );
  });

  test('opens the "Column" tab for a column whose header is clicked', async ({
    dataExplorer: { inspector, results },
  }) => {
    await expect(inspector.selectedTab).toHaveText('Exploration');

    await results.columnHeaderButton('Books_Pages').click();

    await expect(inspector.selectedTab).toHaveText('Column');
    await expect(inspector.name).toHaveValue('Books_Pages');
    await expect(inspector.columnSource).toHaveText(
      'Source Column Pages from Books',
      { useInnerText: true },
    );
    await expect(results.selectedColumnHeaders).toHaveText(['Books_Pages']);
    await expect(results.sheet.selectedCells).toHaveText([
      '203',
      '165',
      '387',
      '184',
      'NULL',
    ]);
  });

  test('shows the value of the active cell on the "Cell" tab', async ({
    dataExplorer: { inspector, results },
  }) => {
    await results.sheet.cell(1, 'Books_Title').click();
    await expect(inspector.selectedTab).toHaveText('Exploration');

    await inspector.tab('Cell').click();
    await expect(inspector.panel).toHaveText('Content Invisible Cities', {
      useInnerText: true,
    });

    await results.sheet.cell(4, 'Books_Pages').click();
    await expect(inspector.panel).toHaveText('Content NULL', {
      useInnerText: true,
    });
  });

  test('shows a new name and description in the page at once and stores them on "Save"', async ({
    page,
    api,
    schema,
    dataExplorer,
  }) => {
    const { inspector } = dataExplorer;
    const newName = uniqueName('Long reads');
    await inspector.name.fill(newName);
    await inspector.description.fill('How long each book is');

    await expect(dataExplorer.heading).toHaveText(newName);
    await expect(dataExplorer.description).toHaveText('How long each book is');
    await expect(dataExplorer.breadcrumbLinks.last()).toHaveText(newName);
    await expect(page).toHaveTitle(`${newName} | Mathesar`);
    await expect(dataExplorer.unsavedMark).toBeVisible();
    expect(await api.findExploration(schema, newName)).toBeUndefined();

    await dataExplorer.saveButton.click();

    await expect(dataExplorer.unsavedMark).toHaveCount(0);
    expect(await api.findExploration(schema, newName)).toMatchObject({
      id: exploration.id,
      description: 'How long each book is',
    });
    expect(await api.findExploration(schema, name)).toBeUndefined();
  });

  test('returns to the saved name when the name is emptied, which still counts as a change', async ({
    dataExplorer,
  }) => {
    const { inspector } = dataExplorer;
    await expect(dataExplorer.saveButton).toBeDisabled();

    await inspector.name.fill('');
    await inspector.name.blur();

    await expect(inspector.name).toHaveValue(name);
    await expect(dataExplorer.heading).toHaveText(name);
    await expect(dataExplorer.unsavedMark).toBeVisible();
  });

  test('stores the description without the spaces around it', async ({
    api,
    schema,
    dataExplorer,
  }) => {
    await dataExplorer.inspector.description.fill('  How long each book is  ');
    await expect(dataExplorer.unsavedMark).toBeVisible();
    await dataExplorer.saveButton.click();

    await expect(dataExplorer.unsavedMark).toHaveCount(0);
    expect((await api.findExploration(schema, name))?.description).toBe(
      'How long each book is',
    );
  });

  test(
    'drops a space typed at the end of the description once typing pauses, which joins the next word to it',
    pinsKnownBug('exploration-description-drops-space'),
    async ({ api, schema, dataExplorer }) => {
      const { inspector } = dataExplorer;
      await inspector.description.fill('Long ');
      await expect(dataExplorer.description).toHaveText('Long');
      await expect(inspector.description).toHaveValue('Long');
      await inspector.description.pressSequentially('reads');
      await expect(inspector.description).toHaveValue('Longreads');
      await expect(dataExplorer.description).toHaveText('Longreads');
      await dataExplorer.saveButton.click();

      await expect(dataExplorer.unsavedMark).toHaveCount(0);
      expect((await api.findExploration(schema, name))?.description).toBe(
        'Longreads',
      );
    },
  );

  test.fixme('keeps a space typed at the end of the description while typing pauses', async ({
    api,
    schema,
    dataExplorer,
  }) => {
    const { inspector } = dataExplorer;
    await inspector.description.fill('Long ');
    await expect(dataExplorer.description).toHaveText('Long');
    await inspector.description.pressSequentially('reads');
    await expect(inspector.description).toHaveValue('Long reads');
    await expect(dataExplorer.description).toHaveText('Long reads');
    await dataExplorer.saveButton.click();

    await expect(dataExplorer.unsavedMark).toHaveCount(0);
    expect((await api.findExploration(schema, name))?.description).toBe(
      'Long reads',
    );
  });

  test('renames a column in the result and in the steps, and stores the name on "Save"', async ({
    page,
    api,
    schema,
    dataExplorer,
  }) => {
    const { inspector, results, transformations } = dataExplorer;
    await results.columnHeaderButton('Books_Pages').click();
    await inspector.name.fill('Length');

    await expect(results.sheet.columnHeaders).toHaveText([
      'Books_Title',
      'Length',
    ]);
    await expect(dataExplorer.unsavedMark).toBeVisible();
    await dataExplorer.addTransformation('Filter');
    await expect(
      await selectOptions(transformations.filter(1).column),
    ).toHaveText(['Books_Title', 'Length']);
    await page.keyboard.press('Escape');
    await transformations.filter(1).deleteButton.click();

    await dataExplorer.saveButton.click();

    await expect(dataExplorer.unsavedMark).toHaveCount(0);
    expect((await api.findExploration(schema, name))?.displayNames).toEqual({
      Books_Title: 'Books_Title',
      Books_Pages: 'Length',
    });
  });

  test('is hidden and shown by the "Inspector" button', async ({
    dataExplorer,
  }) => {
    await expect(dataExplorer.inspector.root).toBeVisible();

    await dataExplorer.inspectorToggle.click();
    await expect(dataExplorer.inspector.root).toHaveCount(0);
    await expect(dataExplorer.results.sheet.recordRows).toHaveCount(5);

    await dataExplorer.inspectorToggle.click();
    await expect(dataExplorer.inspector.name).toHaveValue(name);
  });
});

test.describe('the side panels of the Data Explorer', () => {
  const panels = [
    { side: 'left', width: 400, dragBy: 80, widthAfter: 480 },
    { side: 'right', width: 350, dragBy: -80, widthAfter: 430 },
  ] as const;

  for (const { side, width, dragBy, widthAfter } of panels) {
    test(`keep the width of the ${side} panel after a reload`, async ({
      page,
      library,
      dataExplorer,
    }) => {
      await dataExplorer.explore(library.books);
      await dataExplorer.addColumns('Title');
      const panel = dataExplorer.panel(side);
      await expect(panel).toHaveCSS('width', `${width}px`);

      await dataExplorer.resizePanel(side, dragBy);
      await expect(panel).toHaveCSS('width', `${widthAfter}px`);

      await page.reload();
      await chooseOption(dataExplorer.baseTableSelect, library.books.name);
      await dataExplorer.addColumns('Title');
      await expect(panel).toHaveCSS('width', `${widthAfter}px`);
    });
  }
});
