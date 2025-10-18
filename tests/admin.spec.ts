import { test, expect } from "playwright-test-coverage";

test("navigate to admin dashboard", async ({ page }) => {
  // Mock admin login
  await page.route("*/**/api/auth", async (route) => {
    const loginRes = {
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "admin-token-xyz",
    };
    await route.fulfill({ json: loginRes });
  });

  // Mock franchises endpoint (admin dashboard needs this)
  await page.route("*/**/api/franchise**", async (route) => {
    await route.fulfill({
      json: {
        franchises: [],
        more: false,
      },
    });
  });

  await page.goto("/");

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByPlaceholder("Email address").fill("admin@jwt.com");
  await page.getByPlaceholder("Password").fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/");

  // Navigate to admin dashboard
  await page.getByRole("link", { name: "Admin" }).click();

  // Just verify we can access the page
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
});

test("list users section appears", async ({ page }) => {
  // Mock admin login
  await page.route("*/**/api/auth", async (route) => {
    const loginRes = {
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "admin-token-xyz",
    };
    await route.fulfill({ json: loginRes });
  });

  // Mock franchises endpoint
  await page.route("*/**/api/franchise**", async (route) => {
    await route.fulfill({
      json: {
        franchises: [],
        more: false,
      },
    });
  });

  await page.goto("/");

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByPlaceholder("Email address").fill("admin@jwt.com");
  await page.getByPlaceholder("Password").fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/");

  // Navigate to admin dashboard
  await page.getByRole("link", { name: "Admin" }).click();

  // Verify Users section appears
  await expect(page.getByRole("main")).toContainText("Users");
});

test("display users table with headers", async ({ page }) => {
  // Mock admin login
  await page.route("*/**/api/auth", async (route) => {
    const loginRes = {
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "admin-token-xyz",
    };
    await route.fulfill({ json: loginRes });
  });

  // Mock franchises endpoint
  await page.route("*/**/api/franchise**", async (route) => {
    await route.fulfill({
      json: {
        franchises: [],
        more: false,
      },
    });
  });

  // Mock users endpoint - THIS IS NEW
  await page.route("*/**/api/user**", async (route) => {
    const url = route.request().url();

    if (route.request().method() === "GET" && url.includes("/api/user?")) {
      await route.fulfill({
        json: {
          users: [
            {
              id: "1",
              name: "Admin User",
              email: "admin@jwt.com",
              roles: [{ role: "admin" }],
            },
            {
              id: "2",
              name: "Pizza Diner",
              email: "diner@jwt.com",
              roles: [{ role: "diner" }],
            },
          ],
          more: false,
        },
      });
    }
  });

  await page.goto("/");

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByPlaceholder("Email address").fill("admin@jwt.com");
  await page.getByPlaceholder("Password").fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/");

  // Navigate to admin dashboard
  await page.getByRole("link", { name: "Admin" }).click();

  // Verify table headers exist - use .nth(1) to get the second table (Users table)
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Role" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Action" }).nth(1)).toBeVisible();

  // Verify user data appears in table
  await expect(page.getByText("Admin User")).toBeVisible();
  await expect(page.getByText("admin@jwt.com")).toBeVisible();
  await expect(page.getByText("Pizza Diner")).toBeVisible();
  await expect(page.getByText("diner@jwt.com")).toBeVisible();
});

test("delete user", async ({ page }) => {
  // Mock admin login
  await page.route("*/**/api/auth", async (route) => {
    const loginRes = {
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "admin-token-xyz",
    };
    await route.fulfill({ json: loginRes });
  });

  // Mock franchises endpoint
  await page.route("*/**/api/franchise**", async (route) => {
    await route.fulfill({
      json: {
        franchises: [],
        more: false,
      },
    });
  });

  let deleteWasCalled = false;

  // Mock all /api/user requests - use regex for more precise matching
  await page.route(/\/api\/user/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Handle DELETE /api/user/:id
    if (method === "DELETE" && url.match(/\/api\/user\/\d+/)) {
      deleteWasCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: "user deleted" })
      });
    }
    // Handle GET /api/user?page=...
    else if (method === "GET" && url.includes("/api/user?")) {
      const users = [
        {
          id: "1",
          name: "Admin User",
          email: "admin@jwt.com",
          roles: [{ role: "admin" }],
        },
      ];

      if (!deleteWasCalled) {
        users.push({
          id: "2",
          name: "Pizza Diner",
          email: "diner@jwt.com",
          roles: [{ role: "diner" }],
        });
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: users,
          more: false,
        })
      });
    }
    // For any other /api/user requests, continue
    else {
      await route.continue();
    }
  });

  await page.goto("/");

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByPlaceholder("Email address").fill("admin@jwt.com");
  await page.getByPlaceholder("Password").fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/");

  // Navigate to admin dashboard
  await page.getByRole("link", { name: "Admin" }).click();

  // Wait for the users table to load
  await page.waitForSelector("text=Pizza Diner");

  // Verify Pizza Diner is visible
  await expect(page.getByText("Pizza Diner")).toBeVisible();

  // Find and click the delete button for Pizza Diner
  const userRow = page.locator("tr", { hasText: "Pizza Diner" });
  const deleteButton = userRow.getByRole("button", { name: /Delete/i });

  await deleteButton.click();

  // User should be removed from the list
  await expect(page.locator("tr", { hasText: "Pizza Diner" })).not.toBeVisible();
});

