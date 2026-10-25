<?php get_header(); while ( have_posts() ) : the_post(); ?>
<article class="demo-shell single-story"><header><span class="eyebrow"><?php echo esc_html( get_the_date( 'd M Y' ) ); ?> · Journal</span><h1><?php the_title(); ?></h1><p class="story-deck"><?php echo esc_html( get_the_excerpt() ); ?></p></header><?php the_post_thumbnail( 'full', array( 'class' => 'story-image' ) ); ?><div class="prose"><?php the_content(); ?></div><a class="text-link" href="<?php echo esc_url( home_url( '/journal/' ) ); ?>">← Back to the journal</a></article>
<?php endwhile; get_footer(); ?>
