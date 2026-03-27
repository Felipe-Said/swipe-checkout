# Shopify App Embed

Esta pasta contem a base do App Embed oficial da Shopify para o redirecionamento do Swipe na storefront.

## Estrutura

- `extensions/swipe-checkout-redirect/shopify.extension.toml`
- `extensions/swipe-checkout-redirect/blocks/swipe-app-embed.liquid`
- `extensions/swipe-checkout-redirect/assets/swipe-checkout-redirect.js`

## O que o App Embed faz

- le a configuracao publica do Swipe por `shop`
- intercepta o botao de compra da pagina de produto quando `skip_cart_redirect = true`
- intercepta o botao de checkout do carrinho quando `skip_cart_redirect = false`
- redireciona para `/checkout/[id]` do Swipe

## Como ativar

1. publique/deploy a extension no app Shopify
2. abra o tema da loja na Shopify
3. ative o App Embed `Swipe Checkout Redirect`
4. informe a URL publica do Swipe
5. no painel `Lojas`, selecione o checkout padrao e salve o fluxo

## Endpoint usado pelo embed

- `GET /api/shopify/storefront-config?shop=<loja.myshopify.com>`

