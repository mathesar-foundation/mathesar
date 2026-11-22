import type { User } from '../../support/api/mathesar';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import type { DisplayLanguage } from '../../support/ui/components/user-details-form';
import { isMarkedDocument, markDocument } from '../../support/ui/document-mark';
import { HomePage } from '../../support/ui/pages/home-page';
import { ProfilePage } from '../../support/ui/pages/profile-page';
import { TranslatedApp } from '../../support/ui/pages/translated-app';
import { tableUrl } from '../../support/ui/urls';
import { expect, test } from './fixtures';

interface Translation {
  option: DisplayLanguage;
  code: string;
  databases: string;
  welcome: (user: User) => string;
  feedback: string;
  filter: string;
  sort: string;
  column: string;
}

const translations: Translation[] = [
  {
    option: 'Spanish (es)',
    code: 'es',
    databases: 'Bases de datos',
    welcome: ({ username }) => `¡Bienvenido a Mathesar, ${username}!`,
    feedback: 'Comentario',
    filter: 'Filtrar',
    sort: 'Ordenar',
    column: 'Columna',
  },
  {
    option: 'French (fr)',
    code: 'fr',
    databases: 'Bases de données',
    welcome: ({ username }) => `Bienvenue à Mathesar, ${username} !`,
    feedback: 'Commentaire',
    filter: 'Filtrer',
    sort: 'Trier',
    column: 'Colonne',
  },
  {
    option: 'Japanese (ja)',
    code: 'ja',
    databases: 'データベース',
    welcome: ({ username }) => `Mathesarへようこそ、${username}！`,
    feedback: 'フィードバック',
    filter: 'フィルター',
    sort: '並べ替え',
    column: 'カラム',
  },
];

test.describe('display language', () => {
  for (const translation of translations) {
    test(`shows the app in ${translation.option} from the first page after the login`, async ({
      api,
      library,
      reader,
      signInAs,
    }) => {
      await api.setDisplayLanguage(reader, translation.code);
      const page = await signInAs(reader);
      const app = new TranslatedApp(page);

      await expect(page).toHaveTitle(`${translation.databases} | Mathesar`);
      await expect(app.text(translation.welcome(reader))).toBeVisible();
      await expect(app.button(translation.feedback)).toBeVisible();

      await page.goto(tableUrl(library.books));
      await expect(app.button(translation.filter)).toBeVisible();
      await expect(app.button(translation.sort)).toBeVisible();
      await expect(app.tab(translation.column)).toBeVisible();
    });
  }

  test('switches the open app to the chosen language without loading it again', async ({
    api,
    database,
    library,
    reader,
    signInAs,
  }) => {
    const page = await signInAs(reader);
    const app = new TranslatedApp(page);
    const breadcrumb = new Breadcrumb(page);
    await new ProfilePage(page).goto();
    await markDocument(page);
    await app.chooseLanguage('Japanese (ja)', 'Save');

    await expect(app.heading('ユーザープロフィール')).toBeVisible();
    await expect(breadcrumb.items).toHaveText(['ユーザープロフィール']);
    await expect(app.button('データベースを選択')).toBeVisible();
    await expect(app.button('フィードバック')).toBeVisible();
    await expect
      .poll(() => page.context().cookies())
      .toContainEqual(
        expect.objectContaining({ name: 'display_language', value: 'ja' }),
      );
    expect(await api.findUser(reader.username)).toMatchObject({
      displayLanguage: 'ja',
    });

    await breadcrumb.homeLink.click();
    await expect(page).toHaveTitle('データベース | Mathesar');
    await new HomePage(page).cardLink(database.name).click();
    await expect(app.tab('スキーマ')).toBeVisible();
    await app.link(library.schema.name).click();
    await expect(app.heading('テーブルとビュー')).toBeVisible();
    await app.link('Books').click();
    await expect(app.button('フィルター')).toBeVisible();
    await expect(app.tab('カラム')).toBeVisible();
    expect(await isMarkedDocument(page)).toBe(true);
  });

  test('switches back to English', async ({ api, createUser, signInAs }) => {
    const user = await createUser();
    await api.setDisplayLanguage(user, 'ja');
    const page = await signInAs(user);
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await new TranslatedApp(page).chooseLanguage('English (en)', '保存');

    await expect(profilePage.heading).toHaveText('User Profile');
    await expect(new Breadcrumb(page).items).toHaveText(['User Profile']);
    expect(await api.findUser(user.username)).toMatchObject({
      displayLanguage: 'en',
    });
  });

  test('starts the page over, which closes an open password form', async ({
    createUser,
    signInAs,
  }) => {
    const user = await createUser();
    const page = await signInAs(user);
    const profilePage = new ProfilePage(page);
    const { details, password } = profilePage;
    await profilePage.goto();
    await password.changePasswordButton.click();
    await password.oldPassword.fill(user.password);
    await details.chooseDisplayLanguage('French (fr)');
    await details.saveButton.click();

    await expect(profilePage.heading).toHaveText('Profil utilisateur');
    await expect(
      new TranslatedApp(page).button('Changer le mot de passe'),
    ).toBeVisible();
  });
});
