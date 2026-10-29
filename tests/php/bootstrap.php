<?php
/** WordPress integration bootstrap. Run with npm run test:php inside wp-env. */
$tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $tests_dir || ! file_exists( $tests_dir . '/includes/functions.php' ) ) {
    fwrite( STDERR, "WordPress test library unavailable. Start Docker with npm run env:start, then run npm run test:php.\n" );
    exit( 1 );
}
define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', dirname( __DIR__, 2 ) . '/vendor/yoast/phpunit-polyfills' );
require_once $tests_dir . '/includes/functions.php';
tests_add_filter( 'muplugins_loaded', function () {
    require WP_PLUGIN_DIR . '/woocommerce/woocommerce.php';
    require dirname( __DIR__, 2 ) . '/woo-subscription-trial-coupon.php';
} );
require $tests_dir . '/includes/bootstrap.php';
