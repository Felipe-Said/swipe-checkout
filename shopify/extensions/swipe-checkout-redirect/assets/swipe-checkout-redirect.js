(function () {
  var configNode = document.getElementById("swipe-checkout-redirect-config");
  if (!configNode) return;

  var appUrl = (configNode.getAttribute("data-app-url") || "").replace(/\/$/, "");
  var shopDomain = configNode.getAttribute("data-shop-domain") || "";
  var enabled = configNode.getAttribute("data-enabled") !== "false";

  if (!enabled || !appUrl || !shopDomain) return;

  var configUrl = appUrl + "/api/shopify/storefront-config?shop=" + encodeURIComponent(shopDomain);

  function redirectToSwipe(url, event) {
    if (!url) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    window.location.href = url;
  }

  function bindProductButtons(root, checkoutUrl, skipCartRedirect) {
    if (!skipCartRedirect) return;

    var forms = root.querySelectorAll('form[action*="/cart/add"]');
    forms.forEach(function (form) {
      if (form.dataset.swipeBound === "true") return;
      form.dataset.swipeBound = "true";
      form.addEventListener(
        "submit",
        function (event) {
          redirectToSwipe(checkoutUrl, event);
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
          redirectToSwipe(checkoutUrl, event);
        },
        true
      );
    });
  }

  function bindCartButtons(root, checkoutUrl, skipCartRedirect) {
    if (skipCartRedirect) return;

    var checkoutButtons = root.querySelectorAll('button[name="checkout"], a[href="/checkout"], a[href$="/checkout"]');
    checkoutButtons.forEach(function (button) {
      if (button.dataset.swipeBound === "true") return;
      button.dataset.swipeBound = "true";
      button.addEventListener(
        "click",
        function (event) {
          redirectToSwipe(checkoutUrl, event);
        },
        true
      );
    });
  }

  function bindAll(checkoutUrl, skipCartRedirect) {
    bindProductButtons(document, checkoutUrl, skipCartRedirect);
    bindCartButtons(document, checkoutUrl, skipCartRedirect);
  }

  fetch(configUrl, { credentials: "omit" })
    .then(function (response) {
      return response.json();
    })
    .then(function (payload) {
      if (!payload || !payload.checkoutUrl) return;

      bindAll(payload.checkoutUrl, Boolean(payload.skipCartRedirect));

      var observer = new MutationObserver(function () {
        bindAll(payload.checkoutUrl, Boolean(payload.skipCartRedirect));
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    })
    .catch(function () {
      console.warn("Swipe: nao foi possivel carregar a configuracao do checkout.");
    });
})();
