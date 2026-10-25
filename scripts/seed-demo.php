<?php
/** Repeatable local demo fixtures. Never included in the release ZIP. */
if ( ! defined( 'WP_CLI' ) || ! WP_CLI || ! defined( 'WORKSHOP_DEMO_ROLE' ) || ! in_array( WORKSHOP_DEMO_ROLE, array( 'development', 'e2e' ), true ) ) {
    throw new RuntimeException( 'Demo fixtures require an explicitly marked local wp-env site.' );
}
$manifest = get_option( 'harbor_demo_manifest', array() );
$refresh  = in_array( 'refresh', $args ?? array(), true );
if ( $manifest && ! $refresh ) { echo wp_json_encode( $manifest ); return; }
$project = json_decode( file_get_contents( dirname( __DIR__ ) . '/project.json' ), true );
$store   = 'woo-subscription-trial-coupon' === $project['slug'];
$brand   = $store ? 'Northline Supply' : 'Harbor Studio';
$assets  = dirname( __DIR__ ) . '/tests/fixtures/demo-theme/assets/';
$asset_url = plugins_url( $project['slug'] . '/tests/fixtures/demo-theme/assets/' );
update_option( 'harbor_demo_kind', $store ? 'store' : 'studio' );
update_option( 'blogname', $brand );
update_option( 'blogdescription', $store ? 'Considered goods. Everyday rituals.' : 'Thoughtful identities for a changing world.' );
update_option( 'blog_public', 0 );
update_option( 'timezone_string', 'Europe/London' );
$GLOBALS['wp_rewrite']->set_permalink_structure( '/%postname%/' );
update_option( 'default_comment_status', 'closed' );

/** Locate fixtures by ownership, so refreshing never overwrites unrelated posts. */
function harbor_owned( $key, $type ) {
    $ids = get_posts( array( 'post_type' => $type, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_harbor_demo_key', 'meta_value' => $key ) );
    return $ids ? $ids[0] : 0;
}
function harbor_post( $key, $title, $content, $type = 'page', $full = true ) {
    $id = wp_insert_post( array( 'ID' => harbor_owned( $key, $type ), 'post_title' => $title, 'post_name' => $key, 'post_type' => $type, 'post_status' => 'publish', 'post_content' => $content, 'comment_status' => 'closed', 'post_author' => 1 ), true );
    if ( is_wp_error( $id ) ) { throw new RuntimeException( $id->get_error_message() ); }
    update_post_meta( $id, '_harbor_demo_key', $key );
    update_post_meta( $id, '_harbor_full_layout', $full );
    return $id;
}
function harbor_media( $filename, $alt, $width = 1200, $height = 1000 ) {
    $assets = dirname( __DIR__ ) . '/tests/fixtures/demo-theme/assets/';
    $key = 'media-' . pathinfo( $filename, PATHINFO_FILENAME );
    $id = harbor_owned( $key, 'attachment' );
    $bytes = file_get_contents( $assets . $filename );
    if ( ! $bytes ) { throw new RuntimeException( 'Missing demo asset: ' . $filename ); }
    if ( $id && ( ! is_file( get_attached_file( $id ) ) || ! filesize( get_attached_file( $id ) ) ) ) {
        file_put_contents( get_attached_file( $id ), $bytes );
        require_once ABSPATH . 'wp-admin/includes/image.php';
        if ( 'svg' !== pathinfo( $filename, PATHINFO_EXTENSION ) ) { wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, get_attached_file( $id ) ) ); }
    }
    if ( ! $id ) {
        // These files are trusted source fixtures; do not enable SVG uploads in the admin.
        $directory = wp_upload_dir();
        if ( $directory['error'] || basename( $filename ) !== $filename ) { throw new RuntimeException( 'Invalid demo media destination.' ); }
        wp_mkdir_p( $directory['path'] );
        $upload = array( 'file' => $directory['path'] . '/' . wp_unique_filename( $directory['path'], $filename ) );
        if ( ! file_put_contents( $upload['file'], $bytes ) ) { throw new RuntimeException( 'Cannot write demo media.' ); }
        $svg = 'svg' === pathinfo( $filename, PATHINFO_EXTENSION );
        $id = wp_insert_attachment( array( 'post_title' => $alt, 'post_name' => $key, 'post_mime_type' => $svg ? 'image/svg+xml' : 'image/webp', 'post_status' => 'inherit' ), $upload['file'] );
        if ( $svg ) {
            wp_update_attachment_metadata( $id, array( 'width' => $width, 'height' => $height, 'file' => _wp_relative_upload_path( $upload['file'] ) ) );
        } else {
            require_once ABSPATH . 'wp-admin/includes/image.php';
            wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
        }
        update_post_meta( $id, '_harbor_demo_key', $key );
    }
    update_post_meta( $id, '_wp_attachment_image_alt', $alt );
    return $id;
}
$parthenon_id = harbor_media( 'parthenon-square.webp', 'Weathered columns and warm stone at the Parthenon' );
$creek_id = harbor_media( 'dallas-creek-square.webp', 'A red columbine flower photographed near East Dallas Creek' );
$typewriter_id = harbor_media( 'typewriter.webp', 'A well-used typewriter on a writing desk' );
$parthenon = wp_get_attachment_url( $parthenon_id );
$creek = wp_get_attachment_url( $creek_id );
$typewriter = wp_get_attachment_url( $typewriter_id );

$articles = array(
    array( 'making-space-for-better-work', 'Making space for better work', 'Studio notes', $typewriter_id, 'A slower start can lead to a clearer idea. Here is how we protect time for the work that matters.', '<p>A project usually arrives with more questions than answers. We begin by making room for them. A conversation, a notebook and a walk often tell us more than another presentation.</p><h2>Start with a useful question</h2><p>Before choosing a colour or drawing a mark, we ask what someone should understand when they first meet the business. That answer becomes a practical guide for every decision that follows.</p><p>For our recent hospitality work, the answer was simple: make people feel welcome before they walk through the door. The identity, booking journey and printed materials all grew from that idea.</p><h2>Build time into the process</h2><p>Good work needs a rhythm. We alternate focused making with short, honest reviews. Everyone sees the same working files and knows which decision comes next.</p><p>Leaving a little space between those reviews lets an idea settle. It also makes the collaboration calmer, especially when several people are balancing different priorities.</p><h2>Keep the useful things</h2><p>At the end of each project we write down what helped. A clearer brief, a shared vocabulary or a better handover can make the next project easier. Progress is often a collection of small, repeatable habits.</p>' ),
    array( 'a-sense-of-place', 'A sense of place, made visible', 'Field notes', $parthenon_id, 'What old buildings can teach us about making identities that feel at home.', '<p>Places carry their own visual language. It lives in a painted sign, a familiar doorway and the materials people touch every day. Looking closely is the first part of our research.</p><h2>Look beyond the obvious</h2><p>A coastal business does not always need a wave in its logo. The spacing of harbour windows or the rhythm of handwritten delivery notes might tell a more distinctive story.</p><p>We collect these details through photographs, conversations and sketches. The goal is a useful feeling rather than a literal picture of the surroundings.</p><h2>Make room for people</h2><p>An identity only comes alive when people use it. We test early ideas on the everyday materials a team actually needs: a menu, a mobile screen, a delivery label or a welcome email.</p><p>These small applications reveal whether the system can work clearly at different sizes. They also help everyone recognise their own business in the new design.</p><h2>Let the system grow</h2><p>A strong starting point should leave room for change. We deliver a small set of rules, practical examples and editable templates so the team can keep making things with confidence.</p>' ),
    array( 'rituals-worth-keeping', $store ? 'A better cup, one small ritual at a time' : 'Small rituals, lasting ideas', 'Everyday practice', $creek_id, 'Simple routines that bring a little more care to an ordinary morning.', '<p>The best part of a morning ritual is that it belongs to you. A favourite mug, an open window and a few quiet minutes can change how the day begins.</p><h2>Begin with what you enjoy</h2><p>There is no perfect routine to copy. Choose one thing you already like and give it a little attention. Freshly ground coffee and clean water make a useful starting point.</p><p>For a simple filter brew, use 15 grams of coffee for every 250 millilitres of water. Rinse the filter, add the coffee and pour slowly. Adjust the next cup to your own taste.</p><h2>Choose things that earn their place</h2><p>We prefer objects that are easy to use and pleasant to keep. A comfortable handle and a surface that ages well matter more than a long list of features.</p><p>Buying less can mean noticing more: how a notebook opens flat, how a bag sits on your shoulder or how a ceramic cup holds warmth.</p><h2>Take it outside</h2><p>When possible, carry that first cup into the garden or take a short walk. A change of scene is often enough to return with a clearer head and a better question.</p>' ),
);
$post_ids = array();
$journal_cards = '';
foreach ( $articles as $i => $article ) {
    list( $key, $title, $category, $image_id, $excerpt, $body ) = $article;
    $id = harbor_post( $key, $title, $body, 'post', false );
    $date = wp_date( 'Y-m-d 09:00:00', time() - ( 5 + $i * 5 ) * DAY_IN_SECONDS );
    wp_update_post( array( 'ID' => $id, 'post_excerpt' => $excerpt, 'post_date' => $date, 'post_date_gmt' => get_gmt_from_date( $date ) ) );
    set_post_thumbnail( $id, $image_id );
    wp_set_post_terms( $id, $category, 'category' );
    $post_ids[] = $id;
    $journal_cards .= '<article class="journal-card"><a href="' . get_permalink( $id ) . '"><img loading="lazy" src="' . wp_get_attachment_url( $image_id ) . '" alt="' . esc_attr( get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ) . '"><span class="eyebrow">' . $category . ' · ' . get_the_date( 'F Y', $id ) . '</span><h3>' . $title . ' ↗</h3><p>' . $excerpt . '</p></a></article>';
}
$services = '<div class="service-grid"><article class="service-card"><span class="service-number">01 / STRATEGY</span><h3>Find your direction.</h3><p>Positioning, research and a clear story that gives your team a shared place to begin.</p></article><article class="service-card"><span class="service-number">02 / IDENTITY</span><h3>Make your mark.</h3><p>Distinctive visual identities, thoughtful words and practical systems built for everyday use.</p></article><article class="service-card"><span class="service-number">03 / DIGITAL</span><h3>Bring it to life.</h3><p>Useful websites and considered digital experiences that help people take the next step.</p></article></div>';
$cta = '<section class="demo-cta"><div class="demo-shell"><h2>Something good<br>starts with a hello.</h2><a class="demo-button light" href="/contact/">Tell us what you have in mind ↗</a></div></section>';
$pages = array();
if ( ! $store ) {
    $home = <<<HTML
<section class="demo-shell studio-hero"><div><span class="eyebrow">Independent design studio · Bristol, UK</span><h1>Good design.<br>Lasting<br>connections.</h1><p>We help thoughtful businesses find their voice and make their mark. Strategy, identity and digital — brought together with care.</p><a class="demo-button" href="/work/">Explore our work ↗</a><div class="hero-footnote">A small team. A shared curiosity. A considered approach.</div></div><figure class="hero-image"><img src="$parthenon" alt="Warm stone columns, a study in lasting design"><figcaption class="image-caption"><span>Built to mean something.</span><span>Harbor / 2026</span></figcaption></figure></section>
<div class="demo-shell studio-folio"><span>Good company, shared ambition</span><div class="client-list"><span>FIELDWORK</span><span>Common Ground</span><span>THE SLOW HOUSE</span></div></div>
<section class="demo-shell demo-section"><header class="section-heading"><div><span class="eyebrow">Selected partnerships / 2025—2026</span><h2>A few things<br>we’ve helped shape.</h2></div><a class="text-link" href="/work/">View selected work ↗</a></header><div class="work-grid"><a class="work-card" href="/work/#fieldwork"><img loading="lazy" src="$creek" alt="The natural forms that inspired Fieldwork"><div class="work-caption"><div><h3>Fieldwork</h3><p>A fresh identity for a life outside. / Strategy & identity</p></div><span>↗</span></div></a><a class="work-card" href="/work/#common-ground"><img loading="lazy" src="$typewriter" alt="An editorial workspace for Common Ground"><div class="work-caption"><div><h3>Common Ground</h3><p>Bringing independent voices together. / Identity & digital</p></div><span>↗</span></div></a></div></section>
<section class="demo-shell demo-section"><header class="section-heading"><div><span class="eyebrow">What we do</span><h2>Clear thinking.<br>Careful making.</h2></div><p>From the first conversation to the smallest detail, we make sure every part works together.</p></header>$services</section>
<section class="demo-shell studio-quote"><span class="eyebrow">Words from our partners</span><blockquote>“Harbor helped us see what made us different, then gave us the tools to tell that story with confidence.”<span class="quote-person">Alex Morgan · Founder, Fieldwork<br>Illustrative demo partnership</span></blockquote></section>
<section class="demo-shell demo-section"><header class="section-heading"><div><span class="eyebrow">From the journal</span><h2>Notes along the way.</h2></div><a class="text-link" href="/journal/">Read the journal ↗</a></header><div class="journal-grid">$journal_cards</div></section>$cta
HTML;
    $pages['home'] = harbor_post( 'home', 'Home', $home );
    $pages['studio'] = harbor_post( 'studio', 'The studio', '<div class="demo-shell"><header class="page-intro"><span class="eyebrow">Hello, we’re Harbor.</span><h1>Small by choice.<br>Curious by nature.</h1><p>We are an independent design studio bringing clear thinking and careful making to businesses with something to say.</p></header><section class="split-section"><img src="' . $creek . '" alt="A red columbine flower, a study in natural forms"><div class="split-copy"><h2>A partnership,<br>from day one.</h2><p>We work directly with the people who care most about a business. That means honest conversations, useful questions and a shared understanding of where we are going.</p><p>Our small team brings together strategy, identity, writing and digital design. We stay involved from the first sketch to the final handover.</p><h3>Built around real life.</h3><p>Based in Bristol and connected to collaborators across the UK, we make space for different perspectives and a sustainable pace of work.</p></div></section></div>' . $cta );
    $pages['services'] = harbor_post( 'services', 'What we do', '<div class="demo-shell"><header class="page-intro"><span class="eyebrow">Our capabilities</span><h1>The whole story,<br>thoughtfully told.</h1><p>We connect strategy, identity and digital to create a clear and consistent experience for your customers.</p></header>' . $services . '<section class="demo-section"><h2>How we work together.</h2><div class="service-grid"><div><h3>Discover</h3><p>We listen, research and agree what success should look like.</p></div><div><h3>Develop</h3><p>We explore ideas together and test them on real applications.</p></div><div><h3>Deliver</h3><p>We build the system, prepare useful templates and help your team get started.</p></div></div></section></div>' . $cta );
    $pages['work'] = harbor_post( 'work', 'Selected work', '<div class="demo-shell"><header class="page-intro"><span class="eyebrow">Selected partnerships</span><h1>Made with people.<br>Built for people.</h1></header><section id="fieldwork" class="split-section"><img src="' . $creek . '" alt="A wildflower that inspired Fieldwork"><div class="split-copy"><span class="eyebrow">Fieldwork / Strategy & identity</span><h2>A life outside.</h2><p>Fieldwork wanted an identity that felt as open and resourceful as its outdoor community. We built a confident wordmark, a natural palette and a flexible set of layouts.</p><p>The result is a practical toolkit for product stories, event materials and a growing digital community.</p></div></section><section id="common-ground" class="split-section"><div class="split-copy"><span class="eyebrow">Common Ground / Identity & digital</span><h2>Independent voices.<br>A shared platform.</h2><p>We helped a small editorial team bring a collection of local stories into one welcoming place. Clear navigation and a calm reading experience put the writing first.</p><p>Both case studies are illustrative demo projects, created for this development website.</p></div><img src="' . $typewriter . '" alt="Common Ground editorial inspiration"></section></div>' . $cta );
}
$contact_intro = $store ? 'Questions about your order or your next morning ritual? Send us a note.' : 'Tell us what you are working on, what you are hoping for and where you would like to go.';
$pages['contact'] = harbor_post( 'contact', 'Contact', '<div class="demo-shell"><header class="page-intro"><span class="eyebrow">Let’s talk</span><h1>' . ( $store ? 'We’re here to help.' : 'Good things begin<br>with a conversation.' ) . '</h1><p>' . $contact_intro . '</p></header><div class="split-section"><div>[harbor_contact]</div><aside class="contact-details"><h3>A little hello goes a long way.</h3><p>Monday to Friday<br>9:00–17:00, UK time</p><p>hello@' . ( $store ? 'northline' : 'harbor' ) . '.example.test<br>Bristol, United Kingdom</p><p>This local demo saves messages in WordPress. It does not send email.</p></aside></div></div>' );
$pages['journal'] = harbor_post( 'journal', 'Journal', '' );
update_option( 'page_for_posts', $pages['journal'] );
$fixtures = array( 'brand' => $brand, 'postIds' => $post_ids );

if ( $store ) {
    if ( ! class_exists( 'WC_Product_Simple' ) ) { throw new RuntimeException( 'Activate WooCommerce before seeding the store.' ); }
    $catalog = array(
        array( 'weekend-blend', 'Weekend Blend', '14', 'Coffee', 'Chocolate, toasted almond and a gentle sweetness. Our easygoing house blend, roasted for slow mornings. 250g whole beans.' ),
        array( 'everyday-espresso', 'Everyday Espresso', '16', 'Coffee', 'A rounded espresso with notes of caramel and dark chocolate. Comforting with milk, balanced on its own. 250g whole beans.' ),
        array( 'seasonal-filter', 'Seasonal Filter', '18', 'Coffee', 'A bright, clean single origin with soft citrus and stone fruit notes. A fresh selection for curious brewers. 250g whole beans.' ),
        array( 'field-mug', 'The Field Mug', '24', 'Equipment', 'A generous stoneware mug with a comfortable handle and a soft glazed finish. Made for the cup you look forward to. 320ml.' ),
        array( 'pour-over', 'Pour-over Dripper', '28', 'Equipment', 'A simple ceramic dripper for a considered daily brew. Fits standard cone filters and makes one to two cups.' ),
        array( 'studio-tote', 'Everyday Tote', '22', 'Objects', 'A sturdy natural cotton canvas bag with room for your notebook, groceries and the unexpected. Reinforced handles, 38 × 42cm.' ),
        array( 'daily-notebook', 'Daily Notebook', '12', 'Objects', 'An uncluttered place for lists, sketches and good ideas. Lay-flat binding, 96 uncoated pages and a recycled cover.' ),
    );
    $products = array();
    foreach ( $catalog as $row ) {
        list( $sku, $title, $price, $category, $description ) = $row;
        $id = harbor_owned( 'product-' . $sku, 'product' );
        $product = $id ? wc_get_product( $id ) : new WC_Product_Simple();
        $product->set_name( $title ); $product->set_slug( $sku ); $product->set_sku( 'northline-' . $sku );
        $product->set_status( 'publish' ); $product->set_regular_price( $price ); $product->set_price( $price );
        $product->set_description( '<p>' . $description . '</p><h2>Thoughtfully chosen, easy to enjoy.</h2><p>We choose useful goods with simple materials and a considered finish. Packed with care in Bristol. Standard UK delivery takes 3–5 working days.</p><p>Local demonstration product. No real order will be fulfilled.</p>' );
        $product->set_short_description( $description ); $product->set_manage_stock( true ); $product->set_stock_quantity( 100 );
        $product->set_weight( '0.4' ); $product->set_image_id( harbor_media( $sku . '.svg', $title . ' product illustration' ) );
        $term = term_exists( $category, 'product_cat' );
        if ( ! $term ) { $term = wp_insert_term( $category, 'product_cat' ); }
        $product->set_category_ids( array( (int) $term['term_id'] ) );
        $product->update_meta_data( '_harbor_demo_key', 'product-' . $sku );
        $products[ $sku ] = $product->save();
    }
    $fixtures['simpleProductId'] = $products['weekend-blend'];
    foreach ( array( 'shop' => array( 'Shop', '' ), 'cart' => array( 'Your bag', '[woocommerce_cart]' ), 'checkout' => array( 'Checkout', '[woocommerce_checkout]' ), 'my-account' => array( 'My account', '[woocommerce_my_account]' ) ) as $key => $data ) {
        $option = 'woocommerce_' . ( 'my-account' === $key ? 'myaccount' : $key ) . '_page_id';
        $existing = (int) get_option( $option );
        if ( $existing && ! harbor_owned( $key, 'page' ) ) {
            // Adopt WooCommerce's own generated utility page, preserving unrelated pages.
            update_post_meta( $existing, '_harbor_demo_key', $key );
        }
        $pages[ $key ] = harbor_post( $key, $data[0], $data[1], 'page', false );
        update_option( $option, $pages[ $key ] );
    }
    update_option( 'woocommerce_allow_tracking', 'no' );
    update_option( 'woocommerce_onboarding_profile', array( 'completed' => true, 'skipped' => true ) );
    delete_transient( '_wc_activation_redirect' );
    update_option( 'woocommerce_coming_soon', 'no' );
    update_option( 'woocommerce_currency', 'GBP' ); update_option( 'woocommerce_default_country', 'GB' );
    update_option( 'woocommerce_store_address', '24 Market Lane' ); update_option( 'woocommerce_store_city', 'Bristol' ); update_option( 'woocommerce_store_postcode', 'BS1 4DJ' );
    update_option( 'woocommerce_allowed_countries', 'specific' ); update_option( 'woocommerce_specific_allowed_countries', array( 'GB' ) );
    update_option( 'woocommerce_ship_to_countries', '' ); update_option( 'woocommerce_calc_taxes', 'no' );
    update_option( 'woocommerce_enable_coupons', 'yes' ); update_option( 'woocommerce_enable_guest_checkout', 'yes' );
    update_option( 'woocommerce_enable_myaccount_registration', 'yes' ); update_option( 'woocommerce_registration_generate_password', 'no' );
    update_option( 'woocommerce_cod_settings', array( 'enabled' => 'yes', 'title' => 'Pay on delivery (local demo)', 'description' => 'Place a test order. No payment is collected and nothing will be shipped.', 'enable_for_virtual' => 'yes' ) );
    update_option( 'woocommerce_bacs_settings', array( 'enabled' => 'yes', 'title' => 'Manual payment (local demo)', 'description' => 'A local test order. Do not send money.' ) );
    foreach ( array( 'paypal', 'cheque' ) as $gateway ) { update_option( 'woocommerce_' . $gateway . '_settings', array( 'enabled' => 'no' ) ); }
    $zone = new WC_Shipping_Zone( 0 );
    $methods = $zone->get_shipping_methods();
    foreach ( array( 'flat_rate' => array( 'cost' => '4.50', 'title' => 'Standard UK delivery', 'enabled' => 'yes' ), 'free_shipping' => array( 'requires' => 'min_amount', 'min_amount' => '60', 'title' => 'Free UK delivery', 'enabled' => 'yes' ) ) as $method => $settings ) {
        $instance = 0; foreach ( $methods as $item ) { if ( $item->id === $method ) { $instance = $item->instance_id; break; } }
        if ( ! $instance ) { $instance = $zone->add_shipping_method( $method ); }
        update_option( 'woocommerce_' . $method . '_' . $instance . '_settings', $settings );
    }
    $customer_id = username_exists( 'demo-customer' );
    if ( ! $customer_id ) { $customer_id = wp_create_user( 'demo-customer', 'LocalDemo2026!', 'demo.customer@example.test' ); }
    if ( ! is_wp_error( $customer_id ) ) {
        $customer = new WC_Customer( $customer_id ); $customer->set_role( 'customer' );
        $customer->set_first_name( 'Jamie' ); $customer->set_last_name( 'Taylor' );
        $customer->set_billing_first_name( 'Jamie' ); $customer->set_billing_last_name( 'Taylor' );
        $customer->set_billing_address_1( '12 Example Street' ); $customer->set_billing_city( 'Bristol' );
        $customer->set_billing_postcode( 'BS1 4DJ' ); $customer->set_billing_country( 'GB' );
        $customer->set_billing_email( 'demo.customer@example.test' ); $customer->set_billing_phone( '07700900123' ); $customer->save();
        $fixtures['customerId'] = $customer_id;
    }
    if ( class_exists( 'WC_Product_Subscription' ) ) {
        update_option( 'woocommerce_subscriptions_accept_manual_renewals', 'yes' );
        $id = harbor_owned( 'coffee-club', 'product' );
        $product = $id ? wc_get_product( $id ) : new WC_Product_Subscription();
        $product->set_name( 'The Coffee Club' ); $product->set_slug( 'coffee-club' ); $product->set_sku( 'northline-coffee-club' );
        $product->set_status( 'publish' ); $product->set_regular_price( '22' ); $product->set_price( '22' ); $product->set_virtual( true );
        $product->set_image_id( harbor_media( 'coffee-club.svg', 'The Coffee Club monthly plan' ) );
        $product->set_short_description( 'A fresh 500g selection every month. Discover a new favourite, with the freedom to pause or cancel.' );
        $product->set_description( '<p>A rotating selection from our small-batch roasters. Use <strong>plugin-test-free-trial</strong> at checkout to test a seven-day free trial.</p><p>This demonstration plan creates a local subscription. No payment is collected.</p>' );
        foreach ( array( '_subscription_price' => '22', '_subscription_period' => 'month', '_subscription_period_interval' => '1', '_subscription_trial_length' => '0', '_subscription_length' => '0', '_subscription_sign_up_fee' => '0', '_harbor_demo_key' => 'coffee-club' ) as $key => $value ) { $product->update_meta_data( $key, $value ); }
        $fixtures['subscriptionProductId'] = $product->save();
        $coupon = new WC_Coupon( 'plugin-test-free-trial' );
        $coupon->set_code( 'plugin-test-free-trial' ); $coupon->set_discount_type( 'subscription_trial' ); $coupon->set_amount( 0 );
        $coupon->set_description( 'Local integration fixture: seven-day subscription trial.' );
        $coupon->update_meta_data( '_wcsc_coupon_trial_length', 7 ); $coupon->update_meta_data( '_wcsc_coupon_trial_period', 'day' ); $coupon->save();
        $pages['coffee-club'] = harbor_post( 'coffee-club', 'Coffee club', '<div class="demo-shell"><header class="page-intro"><span class="eyebrow">A little discovery, delivered</span><h1>Your next favourite.<br>Every month.</h1><p>Meet the Coffee Club. A fresh selection, thoughtful tasting notes and a new reason to enjoy your morning.</p></header>[product_page id="' . $product->get_id() . '"]</div>' );
    }
    $home = '<section class="shop-hero"><div class="hero-copy"><span class="eyebrow">Good things, thoughtfully chosen.</span><h1>For the everyday.<br>And the moments<br>in between.</h1><p>Freshly roasted coffee, useful objects and small rituals worth keeping. Welcome to Northline.</p><a class="demo-button" href="/shop/">Explore the collection ↗</a></div><figure><img src="' . $asset_url . 'store-hero.svg" alt="Northline coffee and a ceramic mug"></figure></section><div class="demo-shell store-benefits"><span><strong>↗</strong> Small-batch coffee, freshly roasted</span><span><strong>◇</strong> Considered materials, lasting use</span><span><strong>↗</strong> Free UK delivery over £60</span></div><section class="demo-shell demo-section"><header class="section-heading"><div><span class="eyebrow">The everyday collection</span><h2>A few good essentials.</h2></div><a class="text-link" href="/shop/">Shop everything ↗</a></header>[products limit="4" columns="4" ids="' . implode( ',', array_slice( $products, 0, 4 ) ) . '" orderby="post__in"]</section><section class="demo-shell demo-section"><div class="collection-story"><img loading="lazy" src="' . $creek . '" alt="A red columbine flower in the natural world"><div><span class="eyebrow">A slower kind of everyday.</span><h2>Less, but<br>a little better.</h2><p>We believe the things you reach for every day deserve a little care. We work with small makers and thoughtful roasters to bring you goods that earn their place.</p><a class="text-link" href="/our-story/">Meet Northline ↗</a></div></div></section><div class="store-quotes"><span class="eyebrow">The Northline approach</span><blockquote>“Useful things. Honest materials. More room for the moments that matter.”</blockquote><span>Our promise to keep choosing with care.</span></div><section class="demo-shell demo-section"><header class="section-heading"><div><span class="eyebrow">Notes from Northline</span><h2>Good reads for a slow morning.</h2></div><a class="text-link" href="/journal/">Visit the journal ↗</a></header><div class="journal-grid">' . $journal_cards . '</div></section>';
    $pages['home'] = harbor_post( 'home', 'Home', $home );
    $pages['our-story'] = harbor_post( 'our-story', 'Our story', '<div class="demo-shell"><header class="page-intro"><span class="eyebrow">Meet Northline</span><h1>Considered goods.<br>Everyday rituals.</h1><p>We started with a simple idea: fewer things, chosen with more care.</p></header><section class="split-section"><img src="' . $creek . '" alt="A wildflower, a source of everyday inspiration"><div class="split-copy"><h2>A collection with purpose.</h2><p>From our Bristol studio we look for good coffee, useful objects and makers who care about the details. Our collection is small on purpose.</p><p>We choose comfortable shapes, honest materials and the kind of quality you notice over time. We hope these things become part of your own daily rhythm.</p><p>Northline is an illustrative local development store. Its products, people and orders are demonstration data.</p><a class="demo-button" href="/shop/">Find your everyday essentials ↗</a></div></section></div>' );
}
update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', $pages['home'] );
$menu_items = $store ? array( 'shop' => 'Shop', 'our-story' => 'Our story', 'journal' => 'Journal', 'contact' => 'Contact' ) : array( 'work' => 'Work', 'studio' => 'Studio', 'services' => 'Services', 'journal' => 'Journal' );
if ( isset( $pages['coffee-club'] ) ) { $menu_items = array( 'shop' => 'Shop', 'coffee-club' => 'Coffee club', 'our-story' => 'Our story', 'journal' => 'Journal' ); }
$menu = wp_get_nav_menu_object( 'Harbor demo navigation' );
$menu_id = $menu ? $menu->term_id : wp_create_nav_menu( 'Harbor demo navigation' );
$existing_items = wp_get_nav_menu_items( $menu_id ) ?: array();
foreach ( $menu_items as $key => $label ) {
    $item_id = 0; foreach ( $existing_items as $item ) { if ( (int) $item->object_id === (int) $pages[ $key ] ) { $item_id = $item->ID; break; } }
    wp_update_nav_menu_item( $menu_id, $item_id, array( 'menu-item-title' => $label, 'menu-item-object' => 'page', 'menu-item-object-id' => $pages[ $key ], 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
}
$locations = get_theme_mod( 'nav_menu_locations', array() );
$locations['secondary-menu'] = 0;
$locations['primary'] = $menu_id; $locations['primary-menu'] = $menu_id; $locations['footer'] = $menu_id;
set_theme_mod( 'nav_menu_locations', $locations );
if ( 'Divi' === get_option( 'template' ) ) {
    $normal = harbor_media( 'harbor-logo.svg', 'Harbor Studio', 260, 70 );
    $compact = harbor_media( 'harbor-compact.svg', 'Harbor Studio compact logo', 190, 54 );
    $options = get_option( 'et_divi', array() );
    update_option( 'et_divi', array_merge( $options, array( 'divi_logo' => wp_get_attachment_url( $normal ), 'divi_fixed_nav' => 'on', 'fixed_nav' => 'on', 'logo_height' => '70', 'menu_height' => '90', 'minimized_menu_height' => '60', 'hide_primary_logo' => false, 'show_footer_social_icons' => false, 'show_header_social_icons' => false, 'custom_footer_credits' => 'Harbor Studio · Thoughtful design, lasting connections. Local development website.' ) ) );
    update_option( 'dls_option', array_merge( get_option( 'dls_option', array() ), array( 'extra_logo' => $compact ) ) );
    $widgets = wp_get_sidebars_widgets();
    foreach ( array( 'sidebar-2', 'sidebar-3', 'sidebar-4', 'sidebar-5' ) as $sidebar ) { $widgets[ $sidebar ] = array(); }
    wp_set_sidebars_widgets( $widgets );
    $fixtures['logoUrl'] = wp_get_attachment_url( $compact );
}
$fixtures['pageIds'] = $pages;
$fixtures['seedVersion'] = 1;
$fixtures['role'] = WORKSHOP_DEMO_ROLE;
update_option( 'harbor_demo_manifest', $fixtures, false );
echo wp_json_encode( $fixtures );
