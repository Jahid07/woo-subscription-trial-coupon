<?php get_header(); ?>
<?php while ( have_posts() ) : the_post(); ?>
<?php if ( ! get_post_meta( get_the_ID(), '_harbor_full_layout', true ) ) : ?><div class="demo-shell standard-page"><span class="eyebrow"><?php bloginfo( 'name' ); ?></span><h1><?php the_title(); ?></h1><?php endif; ?>
<?php the_content(); ?>
<?php if ( ! get_post_meta( get_the_ID(), '_harbor_full_layout', true ) ) : ?></div><?php endif; ?>
<?php endwhile; ?>
<?php get_footer(); ?>
