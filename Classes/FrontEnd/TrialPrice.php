<?php
/**
 * Trial coupon presentation inside the existing classic cart price cells.
 *
 * @package WooSubscriptionTrialCoupon
 */

// phpcs:disable WordPress.Files.FileName -- PSR-4 autoloading uses the class name.
namespace CoderPlus\WooSubscriptionTrialCoupon\FrontEnd;

/** Displays trial benefits without changing calculated totals. */
class TrialPrice {
	/** Register the existing WooCommerce price filters. */
	public function init() {
		add_filter( 'woocommerce_cart_item_price', array( $this, 'unit_price' ), 20, 2 );
		add_filter( 'woocommerce_cart_item_subtotal', array( $this, 'subtotal' ), 20, 2 );
		add_action( 'wp_enqueue_scripts', array( $this, 'styles' ) );
		add_action( 'woocommerce_blocks_loaded', array( $this, 'blocks' ) );
		add_action( 'before_woocommerce_init', array( $this, 'compatibility' ) );
		add_filter( 'wcs_cart_totals_order_total_html', array( $this, 'first_payment_date' ), 20, 2 );
	}

	/** Declare support through WooCommerce’s feature registry. */
	public function compatibility() {
		if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', dirname( dirname( __DIR__ ) ) . '/woo-subscription-trial-coupon.php', true );
		}
	}

	/** Register Blocks support only when its official interface is available. */
	public function blocks() {
		if ( interface_exists( '\Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface' ) ) {
			( new BlocksIntegration() )->register();
		}
	}

	/** Load narrowly scoped presentation styles on cart and checkout. */
	public function styles() {
		if ( is_cart() || is_checkout() ) {
			wp_enqueue_style( 'wcsc-trial-price', WCSC_PLUGIN_URL . 'assets/css/trial-price.css', array(), (string) filemtime( dirname( dirname( __DIR__ ) ) . '/assets/css/trial-price.css' ) );
		}
	}

	/**
	 * Format one unit in the cart price column.
	 *
	 * @param string $html Original price markup.
	 * @param array  $item Cart item.
	 */
	public function unit_price( $html, $item ) {
		return $this->format( $html, $item, 1 );
	}

	/**
	 * Format a full line in cart and checkout.
	 *
	 * @param string $html Original price markup.
	 * @param array  $item Cart item.
	 */
	public function subtotal( $html, $item ) {
		return $this->format( $html, $item, isset( $item['quantity'] ) ? $item['quantity'] : 1 );
	}


	/**
	 * Replace only Subscriptions' existing date line for eligible trial groups.
	 *
	 * @param string   $html Recurring total markup, including the native date line.
	 * @param \WC_Cart $cart Recurring cart containing the actual billing schedule.
	 * @return string
	 */
	public function first_payment_date( $html, $cart ) {
		if ( empty( $cart->next_payment_date ) || empty( $cart->start_date ) || false === strpos( $html, 'class="first-payment-date"' ) ) {
			return $html;
		}
		$original_dates = array();
		foreach ( $cart->get_cart() as $item ) {
			$dates = $this->payment_dates( $item, $cart );
			if ( empty( $dates ) ) {
				return $html;
			}
			$original_dates[] = $dates['before'];
		}
		$original_dates = array_unique( $original_dates );
		if ( 1 !== count( $original_dates ) ) {
			return $html;
		}
		$before = reset( $original_dates );
		$after  = date_i18n( wc_date_format(), wcs_date_to_time( get_date_from_gmt( $cart->next_payment_date ) ) );
		if ( $before === $after ) {
			return $html;
		}
		$line = '<div class="first-payment-date wcsc-first-payment"><small>' . esc_html__( 'First payment:', 'woo-subscription-trial-coupon' ) .
			' <span class="screen-reader-text">' . esc_html__( 'Before trial coupon:', 'woo-subscription-trial-coupon' ) . '</span><del>' . esc_html( $before ) . '</del> ' .
			'<span class="screen-reader-text">' . esc_html__( 'With trial coupon:', 'woo-subscription-trial-coupon' ) . '</span><span>' . esc_html( $after ) . '</span></small></div>';
		return preg_replace_callback(
			'/<div class="first-payment-date">.*?<\/div>/s',
			static function () use ( $line ) {
				return $line;
			},
			$html,
			1
		);
	}


	/**
	 * Calculate payment dates from an item's actual recurring cart schedule.
	 *
	 * @param array         $item Cart item.
	 * @param \WC_Cart|null $cart Optional recurring cart, supplied by classic totals.
	 * @return array
	 */
	public function payment_dates( $item, $cart = null ) {
		if ( empty( $this->details( $item ) ) ) {
			return array();
		}
		if ( null === $cart && ! empty( $item['key'] ) && ! empty( WC()->cart->recurring_carts ) ) {
			foreach ( WC()->cart->recurring_carts as $recurring ) {
				if ( isset( $recurring->cart_contents[ $item['key'] ] ) ) {
					$cart = $recurring;
					break;
				}
			}
		}
		if ( ! $cart || empty( $cart->start_date ) || empty( $cart->next_payment_date ) ) {
			return array();
		}
		$original = wc_get_product( $item['data']->get_id() );
		if ( ! $original || 0 >= (float) \WC_Subscriptions_Product::get_price( $original ) ) {
			return array();
		}
		$before = (int) \WC_Subscriptions_Product::get_trial_length( $original ) > 0
			? \WC_Subscriptions_Product::get_first_renewal_payment_date( $original, $cart->start_date )
			: $cart->start_date;
		if ( empty( $before ) ) {
			return array();
		}
		$before = date_i18n( wc_date_format(), wcs_date_to_time( get_date_from_gmt( $before ) ) );
		$after  = date_i18n( wc_date_format(), wcs_date_to_time( get_date_from_gmt( $cart->next_payment_date ) ) );
		return $before === $after ? array() : array(
			'before' => $before,
			'after'  => $after,
		);
	}

	/**
	 * Calculate shared presentation details without changing product prices.
	 *
	 * @param array $item Cart item.
	 * @param int   $quantity Number of units.
	 * @return array
	 */
	public function details( $item, $quantity = 1 ) {
		if ( ! class_exists( 'WC_Subscriptions_Product' ) || ! WC()->cart || empty( $item['data'] ) ) {
			return array();
		}
		$product = $item['data'];
		$codes   = WC()->cart->get_applied_coupons();
		if ( 1 !== count( $codes ) || ! $product->is_type( array( 'subscription', 'subscription_variation' ) ) ) {
			return array();
		}
		$coupon = new \WC_Coupon( reset( $codes ) );
		$length = (int) $coupon->get_meta( '_wcsc_coupon_trial_length' );
		$period = $coupon->get_meta( '_wcsc_coupon_trial_period' );
		if ( ! $coupon->is_type( 'subscription_trial' ) || 1 > $length || ! in_array( $period, array( 'day', 'week', 'month', 'year' ), true ) ) {
			return array();
		}
		if ( (int) \WC_Subscriptions_Product::get_trial_length( $product ) !== $length || \WC_Subscriptions_Product::get_trial_period( $product ) !== $period || (float) \WC_Subscriptions_Product::get_sign_up_fee( $product ) > 0 || \WC_Subscriptions_Synchroniser::is_product_synced( $product ) ) {
			return array();
		}
		$original = wc_get_product( $product->get_id() );
		if ( ! $original ) {
			return array();
		}
		$base    = (float) \WC_Subscriptions_Product::get_price( $product );
		$args    = array(
			'price' => $base,
			'qty'   => $quantity,
		);
		$amount  = WC()->cart->display_prices_including_tax() ? wc_get_price_including_tax( $product, $args ) : wc_get_price_excluding_tax( $product, $args );
		$before  = (int) \WC_Subscriptions_Product::get_trial_length( $original ) > 0 ? 0 : $amount;
		$renewal = \WC_Subscriptions_Product::get_price_string(
			$product,
			array(
				'price'           => wc_price( $amount ),
				'tax_calculation' => false,
				'trial_length'    => false,
				'sign_up_fee'     => false,
			)
		);
		$unit    = wcs_get_subscription_period_strings( $length, $period );
		return array(
			'before'    => $before,
			'amount'    => $amount,
			'trial'     => sprintf( /* translators: %s: trial duration, such as 7 days. */ __( '%s free trial', 'woo-subscription-trial-coupon' ), $unit ),
			'recurring' => $renewal,
		);
	}

	/**
	 * Format the shared details for classic price cells.
	 *
	 * @param string $html Original markup.
	 * @param array  $item Cart item.
	 * @param int    $quantity Quantity to display.
	 * @return string
	 */
	private function format( $html, $item, $quantity ) {
		$data = $this->details( $item, $quantity );
		if ( empty( $data ) ) {
			return $html;
		}
		$today = 0 < $data['before'] ? wc_format_sale_price( $data['before'], 0 ) : wc_price( 0 );
		return '<span class="wcsc-trial-price">' . wp_kses_post( $today ) . ' <span>' . esc_html__( 'today', 'woo-subscription-trial-coupon' ) . '</span><small>' .
			'<span class="wcsc-trial-badge">' . esc_html( $data['trial'] ) . '</span><br>' .
			wp_kses_post( sprintf( /* translators: %s: recurring subscription price and billing period. */ __( 'Then %s', 'woo-subscription-trial-coupon' ), $data['recurring'] ) ) . '</small></span>';
	}
}
