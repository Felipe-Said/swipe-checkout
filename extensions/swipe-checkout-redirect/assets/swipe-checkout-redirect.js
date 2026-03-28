(function () {
  var configNode = document.getElementById("swipe-checkout-redirect-config");
  if (!configNode) return;

  var appUrl = (configNode.getAttribute("data-app-url") || "").replace(/\/$/, "");
  var shopDomain = configNode.getAttribute("data-shop-domain") || "";
  var enabled = configNode.getAttribute("data-enabled") !== "false";

  if (!enabled || !appUrl || !shopDomain) return;

  var configUrl = appUrl + "/api/shopify/storefront-config?shop=" + encodeURIComponent(shopDomain);

  function resolveVariantId(form) {
    if (form) {
      var variantInput =
        form.querySelector('input[name="id"]') ||
        form.querySelector('select[name="id"]') ||
        form.querySelector('input[name="variant"]') ||
        form.querySelector('select[name="variant"]') ||
        form.querySelector('[name="id"]') ||
        form.querySelector('[data-variant-id]');

      if (variantInput) {
        return (
          variantInput.value ||
          variantInput.getAttribute("value") ||
          variantInput.getAttribute("data-variant-id") ||
          ""
        );
      }
    }

    var urlVariant = new URL(window.location.href).searchParams.get("variant");
    if (urlVariant) return urlVariant;

    var checkedVariant =
      document.querySelector('input[name="id"]:checked') ||
      document.querySelector('input[name="variant"]:checked') ||
      document.querySelector('[data-variant-id][aria-selected="true"]') ||
      document.querySelector('[data-variant-id].is-selected');

    if (checkedVariant) {
      return (
        checkedVariant.value ||
        checkedVariant.getAttribute("value") ||
        checkedVariant.getAttribute("data-variant-id") ||
        ""
      );
    }

    return "";
  }

  function redirectToSwipe(url, event, variantId, storeId) {
    if (!url) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    var nextUrl = new URL(url, window.location.origin);
    nextUrl.searchParams.set("shop", shopDomain);
    if (storeId) {
      nextUrl.searchParams.set("store", String(storeId));
    }
    if (variantId) {
      nextUrl.searchParams.set("variant", String(variantId));
    }
    window.location.href = nextUrl.toString();
  }

  function bindProductButtons(root, checkoutUrl, skipCartRedirect, storeId) {
    if (!skipCartRedirect) return;

    var forms = root.querySelectorAll('form[action*="/cart/add"]');
    forms.forEach(function (form) {
      if (form.dataset.swipeBound === "true") return;
      form.dataset.swipeBound = "true";
      form.addEventListener(
        "submit",
        function (event) {
          redirectToSwipe(checkoutUrl, event, resolveVariantId(form), storeId);
        },
        true
      );
    });

    var buttons = root.querySelectorAll('button[name="add"], button[type="submit"], shopify-buy-it-now-button');
    buttons.forEach(function (button) {
      if (button.dataset.swipeBound === "true") return;
      button.dataset.swipeBound = "true";
      button.addEventListener(
        "click",
        function (event) {
          var form = button.closest('form[action*="/cart/add"]');
          if (!form) return;
          redirectToSwipe(checkoutUrl, event, resolveVariantId(form), storeId);
        },
        true
      );
    });
  }

  function bindCartButtons(root, checkoutUrl, skipCartRedirect, storeId) {
    if (skipCartRedirect) return;

    var checkoutButtons = root.querySelectorAll('button[name="checkout"], a[href="/checkout"], a[href$="/checkout"]');
    checkoutButtons.forEach(function (button) {
      if (button.dataset.swipeBound === "true") return;
      button.dataset.swipeBound = "true";
      button.addEventListener(
        "click",
        function (event) {
          redirectToSwipe(checkoutUrl, event, "", storeId);
        },
        true
      );
    });
  }

  function bindAll(checkoutUrl, skipCartRedirect, storeId) {
    bindProductButtons(document, checkoutUrl, skipCartRedirect, storeId);
    bindCartButtons(document, checkoutUrl, skipCartRedirect, storeId);
  }

  fetch(configUrl, { credentials: "omit" })
    .then(function (response) {
      return response.json();
    })
    .then(function (payload) {
      if (!payload || !payload.checkoutUrl) return;

      bindAll(payload.checkoutUrl, Boolean(payload.skipCartRedirect), payload.storeId || "");

      var observer = new MutationObserver(function () {
        bindAll(payload.checkoutUrl, Boolean(payload.skipCartRedirect), payload.storeId || "");
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    })
    .catch(function () {
      console.warn("Swipe: nao foi possivel carregar a configuracao do checkout.");
    });
})();
