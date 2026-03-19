import { z } from "zod";
import { defineTest } from "../../framework/src";
import { login } from "./login";
import { expect } from "@playwright/test";
import { AdminUsersPage, AddUserPage } from "../pages/admin-users.page";

const addUserParams = z.object({
  login: z.object({ user: z.string(), password: z.string() }),
  newUser: z.object({
    username: z.string(),
  }),
});

const addUserOutcome = z.object({
  username: z.string(),
  password: z.string(),
});

export const addUser = defineTest({
  code: "add-user",
  params: addUserParams,
  outcome: addUserOutcome,

  scenario: async (t, params) => {
    await t.step("Login as admin", login, params.login);

    const result = await t.action(
      "Create a new user via the administration page",
      addUserOutcome,
      async ({ page }) => {
        const adminUsersPage = new AdminUsersPage(page);
        await adminUsersPage.goto();
        await expect(adminUsersPage.heading).toBeVisible();

        await adminUsersPage.addUserLink.click();

        const addUserPage = new AddUserPage(page);
        await expect(addUserPage.heading).toBeVisible();

        const newTempPassword = "test_password";
        await addUserPage.fillAndSubmit(
          params.newUser.username,
          newTempPassword,
        );

        // Wait for redirect back to the user edit page or users list
        await expect(page).not.toHaveURL(/\/new\//);

        return {
          username: params.newUser.username,
          password: newTempPassword,
        };
      },
    );

    await t.check("New user appears in the users list", async ({ page }) => {
      const adminUsersPage = new AdminUsersPage(page);
      await adminUsersPage.goto();
      await expect(adminUsersPage.userLink(result.username)).toBeVisible();
    });

    await t.action(
      "Log out current admin session",
      z.object({}),
      async ({ page }) => {
        await page.goto("/auth/logout/");
        return {};
      },
    );

    await t.step("Login as the new user", login, {
      user: result.username,
      password: result.password,
    });

    const updatedPassword = await t.action(
      "Complete forced password change for new user",
      z.object({ password: z.string() }),
      async ({ page }) => {
        await page.goto("/");
        // Mathesar forces admin-created users to change password on first login
        await expect(
          page.getByRole("heading", { name: "Update Your Password" }),
        ).toBeVisible();

        // Must use a different password so the next login step is a cache
        // MISS (different params) and actually executes instead of just
        // restoring cookies from the first login's cached outcome.
        const newPassword = `${result.password}_updated`;
        await page
          .getByRole("textbox", { name: "New Password" })
          .fill(newPassword);
        await page.getByRole("textbox", { name: "Confirm" }).fill(newPassword);
        await page.getByRole("button", { name: "Update Password" }).click();

        // After updating password, user is redirected to login
        await expect(page).toHaveURL(/login/);
        return { password: newPassword };
      },
    );

    await t.step("Login again with updated password", login, {
      user: result.username,
      password: updatedPassword.password,
    });

    await t.check(
      "New user sees the databases page after login",
      async ({ page }) => {
        await expect(page).not.toHaveURL(/login/);
      },
    );

    return {
      username: result.username,
      password: updatedPassword.password,
    };
  },

  standalone: {
    params: {
      login: { user: "admin", password: "mathesar_password" },
      newUser: {
        username: "testuser",
      },
    },
  },
});
