<?php

use CoderPlus\WooSubscriptionTrialCoupon\Admin\TrialCoupon;
use CoderPlus\WooSubscriptionTrialCoupon\FrontEnd\RedeemCoupon;

class CouponValidationTest extends WP_UnitTestCase {

	private $original_cart;
	private $handler;

	public function set_up() {
		parent::set_up();
		$this->original_cart = WC()->cart;
		$this->handler       = new RedeemCoupon();
		add_filter( 'woocommerce_coupon_discount_types', array( new TrialCoupon(), 'create_discount_type' ) );
	}

	public function tear_down() {
		WC()->cart = $this->original_cart;
		parent::tear_down();
	}

	private function coupon() {
		$coupon = new WC_Coupon();
		$coupon->set_discount_type( 'subscription_trial' );
		return $coupon;
	}

	private function cart_with_product( $is_subscription ) {
		$product = $this->createMock( WC_Product::class );
		$product->method( 'is_type' )->willReturnCallback(
			static function ( $type ) use ( $is_subscription ) {
				return $is_subscription && 'subscription' === $type;
			}
		);
		$cart = $this->createMock( WC_Cart::class );
		$cart->method( 'get_cart' )->willReturn( array( array( 'data' => $product ) ) );
		WC()->cart = $cart;
	}

	public function test_regular_product_rejection_does_not_create_dynamic_coupon_properties() {
		$this->cart_with_product( false );
		$coupon       = $this->coupon();
		$deprecations = array();
		set_error_handler(
			static function ( $severity, $message ) use ( &$deprecations ) {
				if ( E_DEPRECATED === $severity ) {
					$deprecations[] = $message;
					return true;
				}
				return false;
			}
		);
		try {
			$valid = $this->handler->validate_coupon( true, $coupon );
		} finally {
			restore_error_handler();
		}
		$this->assertFalse( $valid );
		$this->assertSame( array(), $deprecations );
		$this->assertFalse( property_exists( $coupon, 'error_code' ) );
		$this->assertSame( 'This coupon is only valid if there is a subscription product in the cart.', $this->handler->coupon_error_message( 'Original error', 100, $coupon ) );
	}

	public function test_revalidation_clears_an_obsolete_missing_subscription_error() {
		$this->cart_with_product( false );
		$coupon = $this->coupon();
		$this->assertFalse( $this->handler->validate_coupon( true, $coupon ) );
		$this->cart_with_product( true );
		$this->assertTrue( $this->handler->validate_coupon( true, $coupon ) );
		$this->assertSame( 'Original error', $this->handler->coupon_error_message( 'Original error', 100, $coupon ) );
		$this->assertFalse( $this->handler->validate_coupon( false, $coupon ) );
	}

	public function test_rejection_state_does_not_leak_to_another_coupon_object() {
		$this->cart_with_product( false );
		$rejected = $this->coupon();
		$other    = $this->coupon();
		$this->assertFalse( $this->handler->validate_coupon( true, $rejected ) );
		$this->assertSame( 'Other validation error', $this->handler->coupon_error_message( 'Other validation error', 100, $other ) );
	}

	public function test_generic_coupon_errors_without_a_coupon_instance_are_preserved() {
		add_filter( 'woocommerce_coupon_error', array( $this->handler, 'coupon_error_message' ), 10, 3 );
		$this->assertSame( 'Please enter a coupon code.', WC_Coupon::get_generic_coupon_error( WC_Coupon::E_WC_COUPON_PLEASE_ENTER ) );
		$this->assertSame( 'Coupon does not exist.', WC_Coupon::get_generic_coupon_error( WC_Coupon::E_WC_COUPON_NOT_EXIST ) );
	}
}
