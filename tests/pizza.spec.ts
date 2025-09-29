import { test, expect } from "playwright-test-coverage";

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise**', async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
            { id: 7, name: 'Spanish Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [{ id: 7, name: 'Spanish Fork' }] },
      ]
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = {
      user: {
        id: 3,
        name: 'Kai Chen',
        email: 'd@jwt.com',
        roles: [{ role: 'diner' }],
      },
      token: 'abcdef',
    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({
      json: {
        id: 3,
        name: 'Kai Chen',
        email: 'd@jwt.com',
        roles: [{ role: 'diner' }],
      },
    });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto('/');

  // Login first
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');

  // Wait for stores to load before selecting
  await page.waitForFunction(() => {
    const select = document.querySelector('select');
    return select && select.options.length > 1; // More than just "choose store"
  });
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Wait for payment page
  await page.waitForURL('**/payment');

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});


test('franchise operations', async ({ page }) => {
  let storeCreated = false;

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = {
      user: {
        id: 1,
        name: '常用名字',
        email: 'a@jwt.com',
        roles: [
          { role: 'admin' },
          { objectId: 1, role: 'franchisee' }
        ]
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IuW4uOeUqOWQjeWtlyIsImVtYWlsIjoiYUBqd3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJhZG1pbiJ9LHsib2JqZWN0SWQiOjEsInJvbGUiOiJmcmFuY2hpc2VlIn1dLCJpYXQiOjE3NTkxNzQ4MTh9.AFcOdi-Xo9EViLROworseN-Xm0MrcBAGJN5OawHL-_c'
    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise/1', async (route) => {
    if (route.request().method() === 'GET') {
      const franchiseData = [
        {
          id: 1,
          name: 'pizzaPocket',
          admins: [{ id: 1, name: '常用名字', email: 'a@jwt.com' }],
          stores: [
            { id: 1, name: 'SLC', totalRevenue: 0 }
          ]
        }
      ];

      if (storeCreated) {
        franchiseData[0].stores.push({ id: 2, name: 'cool guy store', totalRevenue: 0 });
      }

      await route.fulfill({ json: franchiseData });
    }
  });

  await page.route('*/**/api/franchise/1/store', async (route) => {
    if (route.request().method() === 'POST') {
      const storeReq = { name: 'cool guy store' };
      const storeRes = { id: 2, franchiseId: 1, name: 'cool guy store' };
      expect(route.request().postDataJSON()).toMatchObject(storeReq);
      storeCreated = true;
      await route.fulfill({ json: storeRes });
    }
  });

  await page.goto('/');

  // Navigate to Franchise page and login
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await page.locator('a[href="/franchise-dashboard/login"]').click();

  // Login as admin
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for franchise dashboard to load
  await expect(page.locator('text=pizzaPocket')).toBeVisible();

  // Create a new store
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByPlaceholder('store name').fill('cool guy store');
  await page.getByRole('button', { name: 'Create' }).click();

  // Verify the store was created
  await expect(page.getByText('cool guy store')).toBeVisible();
});



test('register', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const registerReq = { name: 'tester', email: 'test@jwt.com', password: 'TEST' };
    const registerRes = {
      user: {
        id: 4,
        name: 'tester',
        email: 'test@jwt.com',
        roles: [{ role: 'diner' }],
      },
      token: 'abcdef123',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(registerReq);
    await route.fulfill({ json: registerRes });
  });

  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('tester');
  await page.getByRole('textbox', { name: 'Full name' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email address' }).fill('test@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('TEST');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: "The web's best pizza" })).toBeVisible();
});


test('franchisee dashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
    const loginRes = {
      user: {
        id: 2,
        name: 'Franchise Owner',
        email: 'f@jwt.com',
        roles: [{ objectId: 1, role: 'franchisee' }]
      },
      token: 'franchisee-token-abc123'
    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise/2', async (route) => {
    if (route.request().method() === 'GET') {
      const franchiseData = [
        {
          id: 1,
          name: 'MyFranchise',
          admins: [{ id: 2, name: 'Franchise Owner', email: 'f@jwt.com' }],
          stores: [
            { id: 1, name: 'Store One', totalRevenue: 0.15 },
            { id: 2, name: 'Store Two', totalRevenue: 0.25 }
          ]
        }
      ];
      await route.fulfill({ json: franchiseData });
    }
  });

  await page.goto('/');

  // Navigate to Franchise page and login
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await page.locator('a[href="/franchise-dashboard/login"]').click();

  // Login as franchisee
  await page.getByPlaceholder('Email address').fill('f@jwt.com');
  await page.getByPlaceholder('Password').fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for franchise dashboard to load
  await expect(page.locator('text=MyFranchise')).toBeVisible();

  // Verify franchise dashboard content
  await expect(page.getByText('Store One')).toBeVisible();
  await expect(page.getByText('Store Two')).toBeVisible();
  await expect(page.getByText('0.15 ₿')).toBeVisible();
  await expect(page.getByText('0.25 ₿')).toBeVisible();
});


test('explore', async ({ page }) => {
await page.goto('http://localhost:5173/');
await page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' }).click();
await page.getByRole('cell', { name: '2020' }).click();
await page.getByRole('cell', { name: '50 ₿' }).nth(4).click();
await page.getByRole('link', { name: 'About' }).click();
await page.locator('div').filter({ hasText: /^Brian$/ }).getByRole('img').click();
await page.getByRole('link', { name: 'History' }).click();
await page.getByText('However, it was the Romans').click();
await page.getByRole('link', { name: 'Login' }).click();
await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();

})
