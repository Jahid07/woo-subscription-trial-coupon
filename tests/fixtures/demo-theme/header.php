<!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo( 'charset' ); ?>"><meta name="viewport" content="width=device-width, initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class( array( 'demo-site', 'store' === get_option( 'harbor_demo_kind' ) ? 'demo-store' : 'demo-studio' ) ); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main">Skip to content</a>
<?php $store = 'store' === get_option( 'harbor_demo_kind' ); ?>
<?php if ( $store ) : ?><div class="announcement">Good things for your everyday. &nbsp; Free UK delivery on orders over £60.</div><?php endif; ?>
<header class="site-header"><div class="header-inner">
<a class="wordmark" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php if ( $store ) : ?><span class="brand-symbol">N<span>↗</span></span> northline<span class="brand-dot">.</span><?php else : ?><span class="brand-symbol">h</span> harbor<span class="brand-dot">.</span><small>DESIGN STUDIO</small><?php endif; ?></a>
<nav class="desktop-nav" aria-label="Primary"><?php wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'fallback_cb' => false ) ); ?></nav>
<div class="header-actions"><?php if ( $store ) : ?><a href="<?php echo esc_url( home_url( '/my-account/' ) ); ?>">Account</a><a class="cart-link" href="<?php echo esc_url( home_url( '/cart/' ) ); ?>">Bag <span><?php echo function_exists( 'WC' ) && WC()->cart ? (int) WC()->cart->get_cart_contents_count() : 0; ?></span></a><?php else : ?><a class="text-link" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Start a project ↗</a><?php endif; ?></div>
<details class="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile"><?php wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'fallback_cb' => false ) ); ?></nav></details>
</div></header>
<main id="main">
