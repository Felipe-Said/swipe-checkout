(function () {
  var configNode = document.getElementById("swipe-checkout-redirect-config");
  if (!configNode) return;

  var rawAppUrl = configNode.getAttribute("data-app-url") || "";
  var shopDomain = configNode.getAttribute("data-shop-domain") || "";
  var productId = configNode.getAttribute("data-product-id") || "";
  var selectedVariantId = configNode.getAttribute("data-selected-variant-id") || "";
  var currencyCode = configNode.getAttribute("data-currency") || "";
  var shopifyAppSlot = configNode.getAttribute("data-shopify-app-slot") || "";
  var enabled = configNode.getAttribute("data-enabled") !== "false";
  var productDataNode = document.getElementById("swipe-checkout-redirect-product");
  var productData = null;

  function resolveAppBaseUrl(value) {
    if (!value) return "";

    try {
      var parsed = new URL(value, window.location.origin);
      if (!shopifyAppSlot) {
        shopifyAppSlot = parsed.searchParams.get("shopify_app") || "";
      }

      return (parsed.origin + parsed.pathname).replace(/\/$/, "");
    } catch (_error) {
      return String(value).replace(/[?#].*$/, "").replace(/\/$/, "");
    }
  }

  var appUrl = resolveAppBaseUrl(rawAppUrl);

  if (productDataNode) {
    try {
      productData = JSON.parse(productDataNode.textContent || "null");
    } catch (_error) {
      productData = null;
    }
  }

  if (!enabled || !appUrl || !shopDomain) return;

  var configUrl =
    appUrl +
    "/api/shopify/storefront-config?shop=" +
    encodeURIComponent(shopDomain) +
    (shopifyAppSlot ? "&shopify_app=" + encodeURIComponent(shopifyAppSlot) : "");

  function normalizeResourceId(value) {
    if (!value) return "";
    var raw = String(value).trim();
    if (!raw) return "";

    if (raw.indexOf("gid://") === 0) {
      var gidMatch = raw.match(/(\d+)(?:\D*)$/);
      return gidMatch ? gidMatch[1] : "";
    }

    return raw;
  }

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
        return normalizeResourceId(
          variantInput.value ||
          variantInput.getAttribute("value") ||
          variantInput.getAttribute("data-variant-id") ||
          ""
        );
      }
    }

    var urlVariant = new URL(window.location.href).searchParams.get("variant");
    if (urlVariant) return normalizeResourceId(urlVariant);

    var checkedVariant =
      document.querySelector('input[name="id"]:checked') ||
      document.querySelector('input[name="variant"]:checked') ||
      document.querySelector('[data-variant-id][aria-selected="true"]') ||
      document.querySelector('[data-variant-id].is-selected');

    if (checkedVariant) {
      return normalizeResourceId(
        checkedVariant.value ||
        checkedVariant.getAttribute("value") ||
        checkedVariant.getAttribute("data-variant-id") ||
          ""
      );
    }

    return normalizeResourceId(selectedVariantId);
  }

  function getComposedPath(event) {
    if (!event || typeof event.composedPath !== "function") {
      return [];
    }

    try {
      return event.composedPath();
    } catch (_error) {
      return [];
    }
  }

  function findClosestAddToCartForm(node) {
    if (!node || typeof node.closest !== "function") {
      return null;
    }

    return node.closest('form[action*="/cart/add"]');
  }

  function findFormFromEvent(event) {
    if (event && event.target) {
      var directForm = findClosestAddToCartForm(event.target);
      if (directForm) return directForm;
    }

    var eventPath = getComposedPath(event);
    for (var i = 0; i < eventPath.length; i += 1) {
      var current = eventPath[i];
      var matchedForm = findClosestAddToCartForm(current);
      if (matchedForm) {
        return matchedForm;
      }
    }

    return null;
  }

  function isDynamicCheckoutTrigger(node) {
    if (!node || typeof node.matches !== "function") {
      return false;
    }

    return node.matches(
      [
        "shopify-buy-it-now-button",
        ".shopify-payment-button__button",
        ".shopify-payment-button button",
        "button[class*='shopify-payment-button']",
        "[data-shopify='payment-button']",
        "[data-testid='ShopifyPay-button']",
        "[data-testid='BuyItNow-button']"
      ].join(",")
    );
  }

  function isDynamicCheckoutEvent(event) {
    if (isDynamicCheckoutTrigger(event && event.target)) {
      return true;
    }

    var eventPath = getComposedPath(event);
    for (var i = 0; i < eventPath.length; i += 1) {
      if (isDynamicCheckoutTrigger(eventPath[i])) {
        return true;
      }
    }

    return false;
  }

  function resolveProductPayload(variantId, currentProductId) {
    var normalizedProductId = normalizeResourceId(currentProductId || productId);
    var normalizedVariantId = normalizeResourceId(variantId);

    if (!productData || !normalizedProductId) {
      return {
        productId: normalizedProductId,
        variantId: normalizedVariantId,
        productName: "",
        variantLabel: "",
        amount: "",
        currency: currencyCode || "",
        imageSrc: "",
      };
    }

    var variants = Array.isArray(productData.variants) ? productData.variants : [];
    var selectedVariant = variants.find(function (variant) {
      return String(variant && variant.id ? variant.id : "") === normalizedVariantId;
    }) || variants[0] || null;

    return {
      productId: normalizedProductId || normalizeResourceId(productData.id),
      variantId: normalizedVariantId || normalizeResourceId(selectedVariant && selectedVariant.id),
      productName: productData.title || "",
      variantLabel: selectedVariant && selectedVariant.title ? selectedVariant.title : "",
      amount:
        selectedVariant && typeof selectedVariant.price !== "undefined"
          ? String(Number(selectedVariant.price || 0) / 100)
          : "",
      currency: currencyCode || "",
      imageSrc:
        (selectedVariant && selectedVariant.image) ||
        productData.featuredImage ||
        "",
    };
  }

  function redirectToSwipe(url, event, variantId, storeId, currentProductId) {
    if (!url) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    var resolvedPayload = resolveProductPayload(variantId, currentProductId);
    var nextUrl = new URL(url, window.location.origin);
    if (storeId) {
      nextUrl.searchParams.set("store", String(storeId));
    }
    if (resolvedPayload.productId) {
      nextUrl.searchParams.set("product", String(resolvedPayload.productId));
    }
    if (resolvedPayload.variantId) {
      nextUrl.searchParams.set("variant", String(resolvedPayload.variantId));
    }
    if (resolvedPayload.productName) {
      nextUrl.searchParams.set("product_name", resolvedPayload.productName);
    }
    if (resolvedPayload.variantLabel) {
      nextUrl.searchParams.set("variant_label", resolvedPayload.variantLabel);
    }
    if (resolvedPayload.amount) {
      nextUrl.searchParams.set("amount", resolvedPayload.amount);
    }
    if (resolvedPayload.currency) {
      nextUrl.searchParams.set("currency", resolvedPayload.currency);
    }
    if (resolvedPayload.imageSrc) {
      nextUrl.searchParams.set("image", resolvedPayload.imageSrc);
    }
    var sourceParams = new URL(window.location.href).searchParams;
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "gclid",
      "fbclid",
      "ttclid"
    ].forEach(function (key) {
      var value = sourceParams.get(key);
      if (value) {
        nextUrl.searchParams.set(key, value);
      }
    });
    if (document.referrer) {
      nextUrl.searchParams.set("referrer", document.referrer);
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
          redirectToSwipe(
            checkoutUrl,
            event,
            resolveVariantId(form),
            storeId,
            normalizeResourceId(productId)
          );
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
          var form = findFormFromEvent(event) || findClosestAddToCartForm(button);
          if (!form && !isDynamicCheckoutEvent(event)) return;
          redirectToSwipe(
            checkoutUrl,
            event,
            resolveVariantId(form || null),
            storeId,
            normalizeResourceId(productId)
          );
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
          redirectToSwipe(checkoutUrl, event, "", storeId, normalizeResourceId(productId));
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
