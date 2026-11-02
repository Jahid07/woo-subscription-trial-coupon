<?php
/**
 * Official Cart and Checkout Blocks integration.
 *
 * @package WooSubscriptionTrialCoupon
 */

// phpcs:disable WordPress.Files.FileName -- PSR-4 autoloading uses class names.
namespace CoderPlus\WooSubscriptionTrialCoupon\FrontEnd;

use Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface;
use Automattic\WooCommerce\StoreApi\Schemas\V1\CartItemSchema;

/** Shares server-calculated trial details with WooCommerce's React filters. */
class BlocksIntegration implements IntegrationInterface {
	/** Register Store API data and both block integrations. */
	public function register() {
		if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) ) {
			return;
		}
		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => CartItemSchema::IDENTIFIER,
				'namespace'       => $this->get_name(),
				'data_callback'   => array( $this, 'item_data' ),
				'schema_callback' => array( $this, 'item_schema' ),
				'schema_type'     => ARRAY_A,
			)
		);
		add_filter( 'woocommerce_get_item_data', array( $this, 'payment_item_data' ), 20, 2 );
		foreach ( array( 'cart', 'checkout' ) as $block ) {
			add_action( 'woocommerce_blocks_' . $block . '_block_registration', array( $this, 'register_block' ), 20 );
		}
	}

	/**
	 * Register with a block's registry.
	 *
	 * @param object $registry WooCommerce IntegrationRegistry.
	 */
	public function register_block( $registry ) {
		$registry->register( $this );
	}

	/**
	 * Get the unique namespace.
	 *
	 * @return string
	 */
	public function get_name() {
		return 'wcsc-trial-price';
	}

	/** Register scripts with WooCommerce and WordPress dependencies. */
	public function initialize() {
		$dependencies = array( 'wc-blocks-checkout', 'wp-i18n' );
		// Run after Subscriptions' own price filters when that integration is present.
		if ( wp_script_is( 'wc-blocks-integration', 'registered' ) ) {
			$dependencies[] = 'wc-blocks-integration';
		}
		wp_register_script( 'wcsc-trial-blocks', WCSC_PLUGIN_URL . 'assets/js/trial-blocks.js', $dependencies, (string) filemtime( dirname( dirname( __DIR__ ) ) . '/assets/js/trial-blocks.js' ), true );
		wp_set_script_translations( 'wcsc-trial-blocks', 'WooSubscriptionTrialCoupon' );
	}

	/**
	 * Get frontend scripts.
	 *
	 * @return array
	 */
	public function get_script_handles() {
		return array( 'wcsc-trial-blocks' );
	}

	/**
	 * Get editor scripts.
	 *
	 * @return array
	 */
	public function get_editor_script_handles() {
		return array();
	}

	/**
	 * Get static script settings; live values use the Store API.
	 *
	 * @return array
	 */
	public function get_script_data() {
		return array();
	}

	/**
	 * Expose only presentation data for an eligible item, never customer data.
	 *
	 * @param array $item Current cart item from the Store API.
	 * @return array
	 */
	public function item_data( $item ) {
		$data = ( new TrialPrice() )->details( $item );
		if ( empty( $data ) ) {
			return array();
		}
		return array(
			'comparison' => 0 < $data['before'],
			'today'      => $this->plain_text( wc_price( 0 ) ),
			'trial'      => $data['trial'],
			'recurring'  => $this->plain_text( $data['recurring'] ),
		);
	}


	/**
	 * Add the date comparison to native item details through the Store API.
	 *
	 * @param array $data Existing item metadata.
	 * @param array $item Cart item.
	 * @return array
	 */
	public function payment_item_data( $data, $item ) {
		$dates = ( new TrialPrice() )->payment_dates( $item );
		if ( empty( $dates ) ) {
			return $data;
		}
		$data[] = array(
			'name'                                     => __( 'First payment', 'WooSubscriptionTrialCoupon' ),
			'value'                                    => '<span class="wcsc-payment-dates"><span class="screen-reader-text">' . esc_html__( 'Before trial coupon:', 'WooSubscriptionTrialCoupon' ) . '</span><span class="wcsc-payment-before">' . esc_html( $dates['before'] ) . '</span> <span class="screen-reader-text">' . esc_html__( 'With trial coupon:', 'WooSubscriptionTrialCoupon' ) . '</span><strong>' . esc_html( $dates['after'] ) . '</strong></span>',
			'className'                                => 'wcsc-payment-detail',
			'raw_key'                                  => 'wcsc_first_payment',
			'hidden'                                   => true,
			'__experimental_woocommerce_blocks_hidden' => false,
		);
		return $data;
	}

	/**
	 * Get the read-only schema.
	 *
	 * @return array
	 */
	public function item_schema() {
		$schema = array(
			'comparison' => array(
				'type'     => 'boolean',
				'readonly' => true,
			),
		);
		foreach ( array( 'today', 'trial', 'recurring' ) as $field ) {
			$schema[ $field ] = array(
				'type'     => 'string',
				'readonly' => true,
			);
		}
		return $schema;
	}

	/**
	 * Convert WooCommerce's formatted price markup to safe filter text.
	 *
	 * @param string $html Formatted price HTML.
	 * @return string
	 */
	private function plain_text( $html ) {
		return html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES, 'UTF-8' );
	}
}
