import { NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase"

function getAppBaseUrl(request: Request) {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL

  if (explicit) {
    return explicit.replace(/\/$/, "")
  }

  return new URL(request.url).origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get("storeId")

  if (!storeId) {
    return new NextResponse("console.warn('Swipe: storeId ausente.');", {
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: store } = await supabaseAdmin
    .from("shopify_stores")
    .select("id, default_checkout_id, skip_cart_redirect")
    .eq("id", storeId)
    .maybeSingle()

  const checkoutUrl =
    store?.default_checkout_id
      ? `${getAppBaseUrl(request)}/checkout/${store.default_checkout_id}`
      : ""
  const shouldSkipCart = Boolean(store?.skip_cart_redirect)

  const script = `
(function () {
  var checkoutUrl = ${JSON.stringify(checkoutUrl)};
  var skipCartRedirect = ${JSON.stringify(shouldSkipCart)};
  if (!checkoutUrl) return;

  function redirectToSwipe(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    window.location.href = checkoutUrl;
  }

  function bindProductButtons(root) {
    var forms = root.querySelectorAll('form[action*="/cart/add"]');
    forms.forEach(function (form) {
      if (form.dataset.swipeBound === "true") return;
      form.dataset.swipeBound = "true";
      form.addEventListener('submit', function (event) {
        if (!skipCartRedirect) return;
        redirectToSwipe(event);
      }, true);
    });

    if (!skipCartRedirect) return;

    var buttons = root.querySelectorAll('button[name="add"], button[type="submit"], shopify-buy-it-now-button');
    buttons.forEach(function (button) {
      if (button.dataset.swipeBound === "true") return;
      button.dataset.swipeBound = "true";
      button.addEventListener('click', function (event) {
        var form = button.closest('form[action*="/cart/add"]');
        if (!form) return;
        redirectToSwipe(event);
      }, true);
    });
  }

  function bindCartButtons(root) {
    if (skipCartRedirect) return;
    var checkoutButtons = root.querySelectorAll('button[name="checkout"], a[href="/checkout"], a[href$="/checkout"]');
    checkoutButtons.forEach(function (button) {
      if (button.dataset.swipeBound === "true") return;
      button.dataset.swipeBound = "true";
      button.addEventListener('click', redirectToSwipe, true);
    });
  }

  function bindAll() {
    bindProductButtons(document);
    bindCartButtons(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAll);
  } else {
    bindAll();
  }

  var observer = new MutationObserver(function () {
    bindAll();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
`.trim()

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
