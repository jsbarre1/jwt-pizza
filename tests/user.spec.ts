import { test, expect } from "playwright-test-coverage";

test("updateUser", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  let userName = "pizza diner";

  // Mock all auth and user endpoints
  await page.route(/\/(api\/auth|api\/user)/, async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    // Registration (POST /api/auth)
    if (method === "POST" && url.includes("/api/auth") && !url.includes("/api/auth/")) {
      await route.fulfill({
        json: {
          user: {
            id: 3,
            name: userName,
            email: email,
            roles: [{ role: "diner" }],
          },
          token: "test-token-123",
        },
      });
    }
    // Login (PUT /api/auth)
    else if (method === "PUT" && url.match(/\/api\/auth$/)) {
      await route.fulfill({
        json: {
          user: {
            id: 3,
            name: userName,
            email: email,
            roles: [{ role: "diner" }],
          },
          token: "test-token-456",
        },
      });
    }
    // Update user (PUT /api/user/:id)
    else if (method === "PUT" && url.match(/\/api\/user\/\d+/)) {
      const requestData = route.request().postDataJSON();
      if (requestData.name) {
        userName = requestData.name;
      }
      await route.fulfill({
        json: {
          id: 3,
          name: userName,
          email: requestData.email || email,
          roles: [{ role: "diner" }],
        },
      });
    }
    // Default: continue
    else {
      await route.continue();
    }
  });

  await page.goto("/");

  // Register a new user
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByPlaceholder("Full name").fill("pizza diner");
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill("diner");
  await page.getByRole("button", { name: "Register" }).click();

  // Wait for navigation back to home page
  await expect(page.getByRole("heading", { name: "The web's best pizza" })).toBeVisible();

  // Click on the user initials link
  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");

  // First update: click Edit without changing anything and Update
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("button", { name: "Update" }).click();

  // Wait a bit for the update to process
  await page.waitForTimeout(200);

  // Second update: change the name to "pizza dinerx"
  await expect(page.getByRole("main")).toContainText("pizza diner");
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");

  // Find the name input field and update it to "pizza dinerx"
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill("pizza dinerx");
  await page.getByRole("button", { name: "Update" }).click();

  // Wait for the dialog to close and the name to update in the main content
  await page.waitForTimeout(500);

  // Verify the name was updated to "pizza dinerx"
  await expect(page.locator('text=name:').locator('..').locator('div').nth(1)).toContainText("pizza dinerx");

  // Logout
  await page.getByRole("link", { name: "Logout" }).click();

  // Login again to verify the name persisted
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill("diner");
  await page.getByRole("button", { name: "Login" }).click();

  // Verify we're logged in and navigate to user page
  await expect(page.getByRole("heading", { name: "The web's best pizza" })).toBeVisible();
  await page.getByRole("link", { name: "pd" }).click();

  // Verify the updated name "pizza dinerx" persisted after re-login
  await expect(page.getByRole("main")).toContainText("pizza dinerx");
});
