<?php
add_action( 'after_setup_theme', function () {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption' ) );
    add_theme_support( 'woocommerce' );
    add_theme_support( 'wc-product-gallery-lightbox' );
    register_nav_menus( array( 'primary' => 'Primary navigation', 'footer' => 'Footer navigation' ) );
} );
add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style( 'harbor-demo', get_template_directory_uri() . '/site.css', array(), '1.0.0' );
} );
