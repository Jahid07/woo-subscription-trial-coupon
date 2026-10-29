<?php

class DependencyTest extends WP_UnitTestCase {

	public function test_trial_coupon_type_preserves_existing_coupon_types() {
		$handler = new CoderPlus\WooSubscriptionTrialCoupon\Admin\TrialCoupon();
		$types   = $handler->create_discount_type( array( 'percent' => 'Percentage discount' ) );
		$this->assertSame( 'Percentage discount', $types['percent'] );
		$this->assertArrayHasKey( 'subscription_trial', $types );
	}

	public function test_missing_dependencies_show_an_actionable_notice() {
		set_current_screen( 'plugins' );
		ob_start();
		do_action( 'admin_notices' );
		$notice = ob_get_clean();
		$this->assertStringContainsString( 'Woo Subscription Trial Coupon', $notice );
		$this->assertStringContainsString( 'woocommerce.com/products/woocommerce-subscriptions/', $notice );
	}
}
