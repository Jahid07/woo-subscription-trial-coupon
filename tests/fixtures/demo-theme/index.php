<?php get_header(); ?>
<section class="demo-shell journal-page"><span class="eyebrow">Notes from the studio</span><h1>Ideas worth<br>spending time with.</h1><div class="journal-grid">
<?php while ( have_posts() ) : the_post(); ?><article class="journal-card"><a href="<?php the_permalink(); ?>"><?php the_post_thumbnail( 'large' ); ?><span class="eyebrow"><?php echo esc_html( get_the_date( 'd M Y' ) ); ?></span><h2><?php the_title(); ?></h2><p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p><span class="text-link">Read the story ↗</span></a></article><?php endwhile; ?>
</div><?php the_posts_navigation(); ?></section>
<?php get_footer(); ?>
