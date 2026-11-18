import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";

async function getWhenAppReady(request: APIRequestContext, path: string, options: Parameters<APIRequestContext["get"]>[1]) {
  let response: APIResponse | undefined;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    response = await request.get(path, options);
    if (response.status() !== 500) return response;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return response!;
}

test.describe("local authentication boundary", () => {
  test("unauthenticated root redirects to the local sign-in route", async ({ request }) => {
    const response = await getWhenAppReady(request, "/", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/signin-with-chatgpt?return_to=%2F");
  });

  test("forged production identity headers stay signed out", async ({ request }) => {
    const response = await request.get("/", {
      maxRedirects: 0,
      headers: {
        "oai-authenticated-user-id": "synthetic-forged",
        "oai-authenticated-user-email": "synthetic-forged@example.test",
      },
    });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/signin-with-chatgpt?return_to=%2F");
  });

  test("dummy cookie is the local sign-in and hosted callback stays unavailable", async ({ request }) => {
    const signIn = await request.get("/signin-with-chatgpt?return_to=%2F", { maxRedirects: 0 });
    expect(signIn.status()).toBe(302);
    expect(signIn.headers().location).toBe("/");
    const setCookie = signIn.headers()["set-cookie"] ?? "";
    expect(setCookie).toContain("__sites_local_auth=1");
    expect(setCookie.toLowerCase()).toContain("httponly");

    const callback = await request.get("/callback", { maxRedirects: 0 });
    expect(callback.status()).toBe(501);

    const home = await request.get("/", {
      maxRedirects: 0,
      headers: { cookie: "__sites_local_auth=1" },
    });
    expect(home.status()).toBe(200);
    expect(home.headers()["content-type"] ?? "").toContain("text/html");
  });
});
