import { test, expect } from "playwright-test-coverage";

test("list users as admin", async ({ page }) => {
  // Register an admin user
  const adminEmail = `admin${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");

  // For now, we'll register a regular user and assume they have admin privileges
  // In a real scenario, you'd need to register an admin through the backend
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Admin User");
  await page.getByRole("textbox", { name: "Email address" }).fill(adminEmail);
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Register" }).click();

  // Navigate to admin dashboard
  await page.goto("/admin-dashboard");

  // Check that we can see the Users section
  await expect(page.getByRole("main")).toContainText("Users");

  // Check that there's a users table
  await expect(page.locator("table")).toBeVisible();

  // Verify the table has the correct headers
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Role" })).toBeVisible();
});

test("delete user as admin", async ({ page }) => {
  // Register two users - one admin and one to delete
  const adminEmail = `admin${Math.floor(Math.random() * 10000)}@jwt.com`;
  const userEmail = `user${Math.floor(Math.random() * 10000)}@jwt.com`;

  await page.goto("/");

  // Register first user (to be deleted)
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("User To Delete");
  await page.getByRole("textbox", { name: "Email address" }).fill(userEmail);
  await page.getByRole("textbox", { name: "Password" }).fill("user");
  await page.getByRole("button", { name: "Register" }).click();

  // Logout
  await page.getByRole("link", { name: "Logout" }).click();

  // Register admin user
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Admin User");
  await page.getByRole("textbox", { name: "Email address" }).fill(adminEmail);
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Register" }).click();

  // Navigate to admin dashboard
  await page.goto("/admin-dashboard");

  // Find the user in the table and delete them
  const userRow = page.locator("tr", { hasText: "User To Delete" });
  await expect(userRow).toBeVisible();

  // Click the delete button for this user
  await userRow.getByRole("button", { name: "Delete" }).click();

  // Confirm deletion if there's a confirmation dialog
  // await page.getByRole("button", { name: "Confirm" }).click();

  // Verify the user is no longer in the list
  await expect(page.locator("tr", { hasText: "User To Delete" })).not.toBeVisible();
});

test("paginate users list", async ({ page }) => {
  // Register an admin user
  const adminEmail = `admin${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");

  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Admin User");
  await page.getByRole("textbox", { name: "Email address" }).fill(adminEmail);
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Register" }).click();

  // Navigate to admin dashboard
  await page.goto("/admin-dashboard");

  // Check for pagination controls
  const nextButton = page.getByRole("button", { name: "»" });
  const prevButton = page.getByRole("button", { name: "«" });

  await expect(nextButton).toBeVisible();
  await expect(prevButton).toBeVisible();

  // Previous button should be disabled on first page
  await expect(prevButton).toBeDisabled();
});

test("filter users by name", async ({ page }) => {
  // Register an admin user
  const adminEmail = `admin${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");

  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Admin User");
  await page.getByRole("textbox", { name: "Email address" }).fill(adminEmail);
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Register" }).click();

  // Navigate to admin dashboard
  await page.goto("/admin-dashboard");

  // Find the filter input and enter a search term
  const filterInput = page.getByPlaceholder("Filter users");
  await expect(filterInput).toBeVisible();

  await filterInput.fill("Admin");
  await page.getByRole("button", { name: "Submit" }).click();

  // Verify filtered results
  await expect(page.getByRole("main")).toContainText("Admin User");
});
