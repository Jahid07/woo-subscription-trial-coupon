<?php
/** Local demo helpers. This file is mapped only into wp-env, never distributed. */
if ( ! defined( 'WORKSHOP_DEMO_ROLE' ) ) { return; }
add_filter( 'pre_wp_mail', '__return_true' );
// The fixture store is already configured; keep local admins out of the onboarding wizard.
add_filter( 'woocommerce_enable_setup_wizard', '__return_false' );
add_filter( 'woocommerce_prevent_automatic_wizard_redirect', '__return_true' );
// Designed fixture pages contain complete semantic HTML; prevent wpautop inserting grid children.
add_filter( 'the_content', function ( $content ) {
    if ( get_post_meta( get_the_ID(), '_harbor_full_layout', true ) ) { remove_filter( 'the_content', 'wpautop' ); }
    return $content;
}, 9 );
add_action( 'wp_enqueue_scripts', function () {
    if ( 'Divi' === get_option( 'template' ) ) {
        wp_enqueue_style( 'workshop-demo', content_url( '/plugins/woo-subscription-trial-coupon/tests/fixtures/demo-theme/site.css' ), array(), '1.0.0' );
    }
} );
add_filter( 'body_class', function ( $classes ) {
    $classes[] = 'demo-site';
    $classes[] = 'store' === get_option( 'harbor_demo_kind' ) ? 'demo-store' : 'demo-studio';
    return $classes;
} );
add_shortcode( 'harbor_contact', function () {
    if ( isset( $_GET['sent'] ) ) { return '<div class="contact-success" role="status">Thank you. Your message has been saved. We’ll be in touch soon.</div>'; }
    return '<form class="demo-contact-form" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="harbor_demo_contact">' . wp_nonce_field( 'harbor_demo_contact', 'demo_nonce', true, false ) . '<label>Your name<input name="demo_name" autocomplete="name" required></label><label>Email address<input name="demo_email" type="email" autocomplete="email" required></label><label>A little about your project<textarea name="demo_message" rows="5" required></textarea></label><button type="submit" class="demo-button">Send your message ↗</button></form>';
} );
$demo_contact = function () {
    check_admin_referer( 'harbor_demo_contact', 'demo_nonce' );
    $messages = get_option( 'harbor_demo_messages', array() );
    $messages[] = array( 'name' => sanitize_text_field( wp_unslash( $_POST['demo_name'] ?? '' ) ), 'email' => sanitize_email( wp_unslash( $_POST['demo_email'] ?? '' ) ), 'message' => sanitize_textarea_field( wp_unslash( $_POST['demo_message'] ?? '' ) ) );
    update_option( 'harbor_demo_messages', array_slice( $messages, -30 ) );
    wp_safe_redirect( home_url( '/contact/?sent=1' ) ); exit;
};
add_action( 'admin_post_harbor_demo_contact', $demo_contact );
add_action( 'admin_post_nopriv_harbor_demo_contact', $demo_contact );
