<?php
/** Disposable fixtures for this repository's local Docker site. */
$slug = 'plugin-test-page';
$page = get_page_by_path( $slug );
$id   = wp_insert_post(
    array(
        'ID'           => $page ? $page->ID : 0,
        'post_title'   => 'Plugin test page',
        'post_name'    => $slug,
        'post_type'    => 'page',
        'post_status'  => 'publish',
        'post_content' => str_repeat( '<p>Plugin browser test content.</p>', 120 ),
    )
);
update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $id );
update_option( 'permalink_structure', '/%postname%/' );
flush_rewrite_rules();

$fixtures = array();
if ( 'Divi' === get_option( 'template' ) ) {
    $existing = get_posts( array( 'post_type' => 'attachment', 'name' => 'plugin-test-logo', 'numberposts' => 1 ) );
    if ( $existing ) {
        $attachment = $existing[0]->ID;
    } else {
        $image = base64_decode( 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWp8AAAAASUVORK5CYII=' );
        $upload = wp_upload_bits( 'plugin-test-logo.png', null, $image );
        $attachment = wp_insert_attachment( array( 'post_title' => 'Plugin test logo', 'post_name' => 'plugin-test-logo', 'post_mime_type' => 'image/png', 'post_status' => 'inherit' ), $upload['file'] );
        require_once ABSPATH . 'wp-admin/includes/image.php';
        wp_update_attachment_metadata( $attachment, wp_generate_attachment_metadata( $attachment, $upload['file'] ) );
    }
    update_option( 'dls_option', array( 'extra_logo' => $attachment ) );
    $fixtures['logoUrl'] = wp_get_attachment_url( $attachment );
}
if ( class_exists( 'WC_Product_Subscription' ) ) {
    $product_id = wc_get_product_id_by_sku( 'plugin-test-subscription' );
    $product = $product_id ? wc_get_product( $product_id ) : new WC_Product_Subscription();
    $product->set_name( 'Plugin test subscription' );
    $product->set_sku( 'plugin-test-subscription' );
    $product->set_status( 'publish' );
    $product->set_regular_price( '10' );
    $product->set_price( '10' );
    $product->update_meta_data( '_subscription_price', '10' );
    $product->update_meta_data( '_subscription_period', 'month' );
    $product->update_meta_data( '_subscription_period_interval', '1' );
    $product->update_meta_data( '_subscription_trial_length', '0' );
    $product->save();
    $coupon = new WC_Coupon( 'plugin-test-free-trial' );
    $coupon->set_code( 'plugin-test-free-trial' );
    $coupon->set_discount_type( 'subscription_trial' );
    $coupon->set_amount( 0 );
    $coupon->update_meta_data( '_wcsc_coupon_trial_length', 7 );
    $coupon->update_meta_data( '_wcsc_coupon_trial_period', 'day' );
    $coupon->save();
    $cart = get_page_by_path( 'cart' );
    $cart_id = wp_insert_post( array( 'ID' => $cart ? $cart->ID : 0, 'post_title' => 'Cart', 'post_name' => 'cart', 'post_type' => 'page', 'post_status' => 'publish', 'post_content' => '[woocommerce_cart]' ) );
    update_option( 'woocommerce_cart_page_id', $cart_id );
    $fixtures['subscriptionProductId'] = $product->get_id();
}
echo wp_json_encode( $fixtures ?: new stdClass() );
